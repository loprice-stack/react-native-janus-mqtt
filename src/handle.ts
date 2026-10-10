import { EventEmitter } from 'events';
import type Session from './session';
import type TransactionManager from './transaction-manager';
import {
  isAckData,
  isErrorData,
  isResponseData,
  JANUS,
  JANUSMQTT,
} from './protocol';
import { getNumericID, Logger } from './utils';

const LOG_NS = '[handle.ts]';
const PLUGIN_EVENT_SYM = Symbol('plugin_event');

/**
 * Class representing a janusmqtt handle.<br>
 *
 * Users implementing new plugins must extend this class and override the `handleMessage` function.<br>
 *
 * Handle extends EventEmitter, so an instance can emit events and users can subscribe to them.<br>
 *
 * Users are not expected to create Handle instances, but insted use the Session.attach() API.
 */
class JanusMqttHandle extends EventEmitter {
  _tm: TransactionManager;
  _detaching: boolean;
  _detached: boolean;
  session: Session;
  id: number;
  name: string;
  _sessionDestroyedListener: () => void;

  /**
   * Create a janusmqtt handle.
   */
  constructor(session: Session, id: number) {
    super();

    /**
     * The transaction manager used by this handle.
     */
    this._tm = session._tm; // keep track of pending requests

    /**
     * A boolean flag indicating that the handle is being detached.
     * Once the detach has been completed, the flag returns to false.
     */
    this._detaching = false;

    /**
     * A boolean flag indicating that the handle has been detached.
     */
    this._detached = false;

    /**
     * The parent janusmqtt session.
     */
    this.session = session;

    /**
     * The handle unique id, usually taken from Janus response.
     *
     * @type {number}
     */
    this.id = id;

    /**
     * A more descriptive, not unique string (used for logging).
     */
    this.name = `[${this.id}]`;

    /**
     * The callback function used for a session destroyed event.
     */
    this._sessionDestroyedListener = this._signalDetach.bind(this);

    /* Set a listener to run a callback when session gets destroyed */
    this.session.once(
      JANUSMQTT.EVENT.SESSION_DESTROYED,
      this._sessionDestroyedListener
    );
    /* Set a dummy error listener to avoid to avoid unmanaged errors */
    this.on(
      'error',
      (e) => `${LOG_NS} ${this.name} catched unmanaged error ${e.message}`
    );
  }

  /**
   * Cleanup the handle closing all owned transactions, emitting the detached event
   * and removing all registered listeners.
   */
  _signalDetach() {
    if (this._detached) return;
    this._detaching = false;
    this._detached = true;

    /* Remove the listener for session destroyed event */
    //this.session.removeListener(JANUSMQTT.EVENT.SESSION_DESTROYED, this._sessionDestroyedListener);
    /* Close all pending transactions for this handle with an error */

    this._tm.closeAllTransactionsWithError(this, new Error('handle detached'));
    /* Emit the detached event */
    /**
     * The handle has been detached.
     */
    this.emit(JANUSMQTT.EVENT.HANDLE_DETACHED, { id: this.id });
    /* Remove all listeners to avoid leaks */
    this.removeAllListeners();
  }

  /**
   * Helper to check if a pending transaction is a trickle.
   */
  _isTrickleTx(id: number) {
    const tx = this._tm.get(id);
    if (tx) return tx.request === JANUS.REQUEST.TRICKLE;
    return false;
  }

  /**
   * Helper to check if a pending transaction is a hangup.
   */
  _isHangupTx(id: number) {
    const tx = this._tm.get(id);
    if (tx) return tx.request === JANUS.REQUEST.HANGUP;
    return false;
  }

  /**
   * Helper to check if a pending transaction is a detach.
   */
  _isDetachTx(id: number) {
    const tx = this._tm.get(id);
    if (tx) return tx.request === JANUS.REQUEST.DETACH_PLUGIN;
    return false;
  }

  /**
   * Manage a message sent to this handle. If this involves a owned transaction
   * and the response is a definitive one, the transaction will be closed.
   * In case the instance implements a `handleMessage` method, this function will
   * pass the message to it on order to let a plugin implements its custom logic.
   * Generic Janus API events like `detached`, `hangup` etc. are handled here.
   */
  _handleMessage(janus_message: any) {
    const { transaction, janus } = janus_message;

    /* First check if a transaction is involved */
    if (transaction) {
      Logger(
        `${LOG_NS} ${this.name} received ${janus} for transaction ${transaction}`
      );

      /* First check if this handle owns the transaction */
      if (this.ownsTransaction(transaction)) {
        /*
         * Pending transaction management. Close transaction in case of:
         * 1) Ack response to a trickle request
         * 2) Definitive (success/error) response
         */

        /* Case #1: close tx related to trickles */
        if (isAckData(janus_message)) {
          if (this._isTrickleTx(transaction)) {
            this.closeTransactionWithSuccess(transaction, janus_message);
          }
          return;
        }

        /* Case #2: close tx with a definitive response */
        if (isResponseData(janus_message)) {
          if (isErrorData(janus_message)) {
            /* Case #2 (error): close tx with a definitive error */
            const error = new Error(
              `${janus_message.error.code} ${janus_message.error.reason}`
            );
            this.closeTransactionWithError(transaction, error);
            return;
          }

          /* Case #2 (success) */

          /* Close hangup Tx */
          if (this._isHangupTx(transaction)) {
            this.closeTransactionWithSuccess(transaction, janus_message);
            return;
          }

          /* Close detach tx */
          if (this._isDetachTx(transaction)) {
            this.closeTransactionWithSuccess(transaction, janus_message);
            return;
          }

          /*
           * If an instance implements a handleMessage method, try to use it.
           * The custom handler may decide to close tx with success or error.
           * A falsy return from handleMessage is considered as a "not-handled" message.
           */
          if (!this.handleMessage(janus_message)) {
            Logger(
              `${LOG_NS} ${this.name} received response could not be handled by the plugin`
            );
          }

          /*
           * As a fallback always close with success a transaction with a definitive success response.
           * Closing a transaction is an indempotent action.
           */
          this.closeTransactionWithSuccess(transaction, janus_message);
          return;
        }
      }
    }

    /* Handling of a message that did not close a transaction (e.g. async events) */
    const janusmqtt_event_data: any = {};
    switch (janus) {
      /* Generic Janus event */
      case JANUS.EVENT.EVENT: {
        /* If an instance implements a handleMessage method, use it */
        if (!this.handleMessage(janus_message)) {
          /* If handleMessage has a falsy return close tx with error */
          Logger(
            `${LOG_NS} ${this.name} received event could not be handled by the plugin`
          );
          const error = new Error('unmanaged event');
          this.closeTransactionWithError(transaction, error);
        }
        break;
      }

      /* Detached event: the handle has been detached */
      case JANUS.EVENT.DETACHED: {
        this._signalDetach();
        break;
      }

      /* ice-failed event: Janus ICE agent has detected a failure */
      case JANUS.EVENT.ICE_FAILED: {
        /**
         * The handle has detected an ICE failure.
         */
        this.emit(JANUSMQTT.EVENT.HANDLE_ICE_FAILED, janusmqtt_event_data);
        break;
      }

      /* Hangup event: peer connection is down */
      /* In this case the janus message has a reason field */
      case JANUS.EVENT.HANGUP: {
        if (typeof janus_message.reason !== 'undefined')
          janusmqtt_event_data.reason = janus_message.reason;
        /**
         * The handle WebRTC connection has been closed.
         */
        this.emit(JANUSMQTT.EVENT.HANDLE_HANGUP, janusmqtt_event_data);
        break;
      }

      /* Media event: a/v media reception from Janus */
      /* In this case the janus message has "type" and "receiving" fields */
      case JANUS.EVENT.MEDIA: {
        if (typeof janus_message.type !== 'undefined')
          janusmqtt_event_data.type = janus_message.type;
        if (typeof janus_message.receiving !== 'undefined')
          janusmqtt_event_data.receiving = janus_message.receiving;
        if (typeof janus_message.mid !== 'undefined')
          janusmqtt_event_data.mid = janus_message.mid;
        if (typeof janus_message.substream !== 'undefined')
          janusmqtt_event_data.substream = janus_message.substream;
        if (typeof janus_message.seconds !== 'undefined')
          janusmqtt_event_data.seconds = janus_message.seconds;
        /**
         * The handle received a media notification.
         */
        this.emit(JANUSMQTT.EVENT.HANDLE_MEDIA, janusmqtt_event_data);
        break;
      }

      /* Webrtcup event: peer connection is up */
      case JANUS.EVENT.WEBRTCUP: {
        /**
         * The handle WebRTC connection is up.
         */
        this.emit(JANUSMQTT.EVENT.HANDLE_WEBRTCUP, janusmqtt_event_data);
        break;
      }

      /* Slowlink event: NACKs number increasing */
      /* In this case the janus message has "uplink" and "nacks" fields */
      case JANUS.EVENT.SLOWLINK: {
        if (typeof janus_message.uplink !== 'undefined')
          janusmqtt_event_data.uplink = janus_message.uplink;
        if (typeof janus_message.mid !== 'undefined')
          janusmqtt_event_data.mid = janus_message.mid;
        if (typeof janus_message.media !== 'undefined')
          janusmqtt_event_data.media = janus_message.media;
        if (typeof janus_message.lost !== 'undefined')
          janusmqtt_event_data.lost = janus_message.lost;
        /**
         * The handle has received a slowlink notification.
         */
        this.emit(JANUSMQTT.EVENT.HANDLE_SLOWLINK, janusmqtt_event_data);
        break;
      }

      /* Trickle from Janus */
      case JANUS.EVENT.TRICKLE: {
        const { completed, sdpMid, sdpMLineIndex, candidate } =
          janus_message.candidate;
        if (!completed) {
          janusmqtt_event_data.sdpMid = sdpMid;
          janusmqtt_event_data.sdpMLineIndex = sdpMLineIndex;
          janusmqtt_event_data.candidate = candidate;
        } else {
          janusmqtt_event_data.completed = true;
        }

        /**
         * The handle has received a trickle notification.
         */
        this.emit(JANUSMQTT.EVENT.HANDLE_TRICKLE, janusmqtt_event_data);
        break;
      }

      default:
        Logger(
          `${LOG_NS} ${this.name} unknown janus event directed to the handle ${JSON.stringify(janus_message)}`
        );
    }
  }

  /**
   * Decorate request with handle id and transaction (if missing).
   */
  _decorateRequest(request: any) {
    request.transaction = request.transaction || getNumericID();
    request.handle_id = request.handle_id || this.id;
  }

  decorateRequest(request: any) {
    this._decorateRequest(request);
  }

  /**
   * Helper method used by plugins to create a new plugin event and assign it to a janus message.
   *
   */
  _newPluginEvent(janus_message: any) {
    type jevent = {
      event: any;
      data: any;
    };
    /* Prepare an object for the output janusmqtt event */
    const janusmqtt_event: jevent = {
      /* The name of the resolved event */
      event: null,
      /* The event payload */
      data: {},
    };

    /* Add JSEP data if available */
    if (janus_message.jsep) {
      janusmqtt_event.data.jsep = janus_message.jsep;
      if (typeof janus_message.jsep.e2ee === 'boolean')
        janusmqtt_event.data.e2ee = janus_message.jsep.e2ee;
    }

    janus_message[PLUGIN_EVENT_SYM] = janusmqtt_event;
    return janusmqtt_event;
  }

  /**
   * Helper method used by plugins to get an assigned plugin eventfrom a handled janus message.
   *
   */
  _getPluginEvent(janus_message: any) {
    return janus_message[PLUGIN_EVENT_SYM] || {};
  }

  /**
   * Stub handleMessage (it is overriden by specific plugin handlers).
   * Implementations must return falsy values for unhandled events and truthy value
   * for handled events
   */
  handleMessage(_janus_message: any) {
    return null;
  }

  /**
   * Helper to check if the handle is managing a specific transaction.
   *
   */
  ownsTransaction(id: number) {
    return this._tm.getTransactionOwner(id) === this;
  }

  /**
   * Helper to close a transaction with error.
   *
   */
  closeTransactionWithError(id: number, error: any) {
    this._tm.closeTransactionWithError(id, this, error);
    return;
  }

  /**
   * Helper to close a transaction with success.
   *
   */
  closeTransactionWithSuccess(id: number, data: any) {
    this._tm.closeTransactionWithSuccess(id, this, data);
    return;
  }

  /**
   * Send a request from this handle.
   *It return a promise resolving with the response to the request
   */
  async sendRequest(request: any, timeout_ms = 0) {
    /* Input check */
    if (typeof request !== 'object' || !request) {
      const error = new Error('request must be an object');
      Logger(`${LOG_NS} ${this.name} ${error.message}`);
      throw error;
    }

    /* Check handle status */
    if (this._detached) {
      const error = new Error(
        'unable to send request because handle has been detached'
      );
      Logger(`${LOG_NS} ${this.name} ${error.message}`);
      throw error;
    }

    /* Add handle properties */
    this._decorateRequest(request);

    return new Promise((resolve, reject) => {
      /* Create a new transaction if the transaction does not exist */
      /* Use promise resolve and reject fn as callbacks for the transaction */
      this._tm.createTransaction({
        id: request.transaction,
        owner: this,
        request: request.janus,
        done: resolve,
        error: reject,
        timeout: timeout_ms,
      });

      /* Send this message through the parent janusmqtt session */
      this.session.sendRequest(request).catch((error) => {
        /* In case of error quickly close the transaction */
        this.closeTransactionWithError(request.transaction, error);
      });
    });
  }

  /**
   * Gracefully detach the Handle.
   */
  async detach() {
    if (this._detaching) {
      const error = new Error('detaching already in progress');
      Logger(`${LOG_NS} ${this.name} ${error.message}`);
      throw error;
    }
    if (this._detached) {
      const error = new Error('already detached');
      Logger(`${LOG_NS} ${this.name} ${error.message}`);
      throw error;
    }
    Logger(`${LOG_NS} ${this.name} detaching handle`);
    this._detaching = true;

    const request = {
      janus: JANUS.REQUEST.DETACH_PLUGIN,
    };

    try {
      await this.sendRequest(request);
      this._signalDetach();
      return;
    } catch ({ message }: any) {
      this._detaching = false;
      Logger(`${LOG_NS} ${this.name} error while detaching (${message})`);
    }
  }

  /**
   * Close the peer connection associated to this handle.
   */
  async hangup() {
    const request = {
      janus: JANUS.REQUEST.HANGUP,
    };

    try {
      return this.sendRequest(request);
    } catch (error) {
      Logger(`${LOG_NS} ${this.name} error while hanging up (${error})`);
      throw error;
    }
  }

  /**
   * Send an ICE candidate / array of candidates.
   */
  //@ts-ignore
  async trickle(candidate: any) {
    /* If candidate is null or undefined, send an ICE trickle complete message */
    if (!candidate) return this.trickleComplete();

    /* Input checking */
    if (typeof candidate !== 'object') {
      const error = new Error('invalid candidate object');
      Logger(`${LOG_NS} ${this.name} ${error.message}`);
      throw error;
    }

    const request = {
      janus: JANUS.REQUEST.TRICKLE,
    };

    /* WATCH OUT ! In case of an array, the field is name "candidates" */
    if (Array.isArray(candidate)) {
      //@ts-ignore
      request.candidates = candidate;
    } else {
      //@ts-ignore
      request.candidate = candidate;
    }

    try {
      return this.sendRequest(request);
    } catch (error) {
      Logger(`${LOG_NS} ${this.name} error on trickle (${error})`);
      throw error;
    }
  }

  /**
   * Send ICE trickle complete message.
   */
  //@ts-ignore
  async trickleComplete() {
    return this.trickle({
      completed: true,
    });
  }

  /**
   * Send a `message` to Janus from this handle, with given body and optional jsep.
   
   * //example
   * // This is a plugin that sends a message with a custom body
   * const body = {
   *   audio: true,
   *   video: true,
   *   record: false,
   * };
   *
   * await handle.message(body, jsep);
   *
   */
  async message(body: any, jsep: any = undefined) {
    const request: any = {
      janus: JANUS.REQUEST.MESSAGE,
      body,
    };

    if (jsep) request.jsep = jsep;

    try {
      return this.sendRequest(request);
    } catch (error) {
      Logger(`${LOG_NS} ${this.name} error on message (${error})`);
      throw error;
    }
  }
}

export default JanusMqttHandle;
