import { EventEmitter } from 'events';
import { getNumericID, Logger } from './utils';
import Mqtt, { type MqttOptions } from './transport-mqtt';
import TransactionManager from './transaction-manager';
import { isErrorData, isResponseData, JANUS, JANUSMQTT } from './protocol';
import Session from './session';
const LOG_NS = '[connection.ts]';

class Connection extends EventEmitter {
  _tm: any;
  _sessions: Map<number, Session>;
  id: number;
  name: string;
  _transport: any;
  //@ts-ignore
  options: MqttOptions = {};

  constructor(options: MqttOptions) {
    super();
    /**
     * The transaction manager used by this connection.
     */
    this._tm = new TransactionManager();

    /**
     * Keep track of the sessions.
     */
    this._sessions = new Map();

    /**
     * A numerical identifier assigned for logging purposes.
     */
    this.id = parseInt(getNumericID());

    /**
     * A more descriptive, not unique string (used for logging).
     */
    this.name = `[${this.id}]id}]`;

    try {
      const transport = new Mqtt({
        serverUrl: options.serverUrl,
        port: options.port,
        clientId: options.clientId,
        userName: options.userName,
        password: options.password,
        tojanus: options.tojanus,
        fromjanus: options.fromjanus,
        useSSL: options.useSSL,
        keepAliveInterval: options.keepAliveInterval,
        reconnect: options.reconnect,
        willMessageOptions: {
          topic: options.willMessageOptions.topic,
          qos: options.willMessageOptions.qos,
          retain: options.willMessageOptions.retain,
          message: options.willMessageOptions.message,
        },
        onSuccess: options.onSuccess,
      });
      //transport.onSuccess()
      transport.onConnectionLost((error: any) => {
        this._signalClose(false);
        Logger(`${LOG_NS} [${this.id}] connection lost! reason [${error}]`);
      });
      transport.onMessageArrived((message: any) => {
        console.log(message.payloadString);

        this._handleMessage(JSON.parse(message.payloadString));
      });
      transport.connect();
      if (transport) this._transport = transport;
      this.options = options;
    } catch (error) {
      Logger(
        `${LOG_NS} [${this.id}] Error while initializing transport (${error})`
      );
    }
  }

  /**
   * Open a connection using the transport defined open method.
   * Users do not need to call this method, since the connection is opened by JanusMqtt()
   */
  async open() {
    await this._transport.connect();
    return this;
  }

  /**
   * Gracefully close the connection using the transport defined close method.
   */
  async close() {
    await this._transport.disconnect();
    return;
  }

  /**
   * Listen to message specified to options.
   */
  setJanusMessageListerner() {
    this._transport.subscribe(this.options.fromjanus);
  }

  /**
   * Listen to message by explicity specification.
   */
  setJanusMessageListerner2(topic: string) {
    this._transport.subscribe(topic);
  }

  /**
   * Send request to janus.
   */
  send(request: any) {
    this._transport.publish(this.options.tojanus, request);
  }

  /**
   * Change tojanus topic
   */
  setToJanusTopicOption(newtopic: string) {
    this.options.tojanus = newtopic;
  }

  /**
   * Change fromjanus topic
   */
  setFromJanusTopicOption(newtopic: string) {
    this.options.fromjanus = newtopic;
  }

  /**
   * Cleanup the connection closing all owned transactions and emitting the destroyed event
   * and removing all registered listeners.
   */
  _signalClose(graceful: boolean) {
    /* Close all pending transactions inside this connection with an error */
    this._tm.closeAllTransactionsWithError(
      null,
      new Error('connection closed')
    );
    /* Clear tx table */
    this._tm.clear();
    /* Clear session table */
    this._sessions.clear();

    /* Did we really mean to close it? */
    if (graceful) {
      /* This is a greceful teardown */
      /**
       * The connection has been gracefully closed.
       */
      this.emit(JANUSMQTT.EVENT.CONNECTION_CLOSED, { id: this.id });
    } else {
      /* If this event is unexpected emit an error */
      const error = new Error('unexpected disconnection');
      /**
       * The connection has been unexpectedly closed.
       */
      this.emit(JANUSMQTT.EVENT.CONNECTION_ERROR, error);
    }

    /* Remove all listeners to avoid leaks */
    this.removeAllListeners();
  }

  /**
   * Create a new session in this connection.
   *
   *
   * const session = await connection.create();
   * Logger.info(`***** SESSION CREATED *****`);
   */
  async create(ka_interval: number = 30) {
    Logger(`${LOG_NS} ${this.name} creating new session`);

    const request = {
      janus: JANUS.REQUEST.CREATE_SESSION,
    };

    try {
      const {
        //@ts-ignore
        data: { id },
      } = await this.sendRequest(request);
      /* Increase the maximum number of listeners for this connection */
      /* The session will register two listeners */
      this.setMaxListeners(this.getMaxListeners() + 2);

      /* Create a new Session and add it to the table */
      const session_instance = new Session(this, id, ka_interval);
      this._sessions.set(session_instance.id, session_instance);

      /* On session destroy delete the entry from session map and decrease the number of listeners */
      session_instance.once(JANUSMQTT.EVENT.SESSION_DESTROYED, ({ id }) => {
        this._sessions.delete(id);
        this.setMaxListeners(this.getMaxListeners() - 2);
      });

      Logger(`${LOG_NS} ${this.name} session created (id=${id})`);
      return session_instance;
    } catch (error) {
      Logger(`${LOG_NS} ${this.name} session creation error (${error})`);
      throw error;
    }
  }

  /**
   * Send a request from this connection using the transport defined send method
   */
  async sendRequest(request: any) {
    /* Add connection properties */
    request.transaction = (await request.transaction)
      ? request.transaction
      : getNumericID();

    return new Promise((resolve, reject) => {
      /* Create a new transaction if the transaction does not exist */
      /* Use promise resolve and reject fn as callbacks for the transaction */
      this._tm.createTransaction({
        id: request.transaction,
        owner: this,
        request: request.janus,
        done: resolve,
        error: reject,
      });
      try {
        this._transport.send(request);
      } catch (error: any) {
        /* In case of error quickly close the transaction */
        this._tm.closeTransactionWithError(request.transaction, this, error);
        reject(error);
        return;
      }
    });
  }

  /**
   * Manage a message sent to this session.  If a session is involved let it manage the message.
   * If the message involves a owned transaction and the response is a definitive one,
   * the transaction will be closed
   */
  _handleMessage(janus_message: any) {
    const { session_id, transaction, janus } = janus_message;

    //console.log(session_id);
    //console.log(transaction);
    //console.log(janus);
    //console.log("--------session_id--------transaction------------janus------------------------------");

    /* Check if a session is involved */
    if (session_id) {
      /* Look for the session in the map */
      const session = this._sessions.get(session_id);
      /* If the handle is missing notifies the user */
      if (!session) {
        Logger(
          `${LOG_NS} ${this.name} session ${session_id} not found for incoming message ${janus}`
        );
        return;
      }

      try {
        /* Let the session manage the message */
        session._handleMessage(janus_message);
      } catch (error) {
        Logger(
          `${LOG_NS} ${this.name} error while handling message (${error})`
        );
      }
      return;
    }

    /* Check if a transaction is involved */
    if (transaction) {
      Logger(
        `${LOG_NS} ${this.name} received ${janus} for transaction ${transaction}`
      );

      /* Not owned by this connection? */
      if (this._tm.getTransactionOwner(transaction) !== this) {
        Logger(
          `${LOG_NS} ${this.name} transaction ${transaction} not found for incoming messsage ${janus}`
        );
        return;
      }

      /*
       * Pending connection transaction management.
       * Close transaction in case of:
       * 1) Definitive response
       */
      if (isResponseData(janus_message)) {
        if (isErrorData(janus_message)) {
          const error = new Error(
            `${janus_message.error.code} ${janus_message.error.reason}`
          );
          return this._tm.closeTransactionWithError(transaction, this, error);
        }

        this._tm.closeTransactionWithSuccess(transaction, this, janus_message);
      }

      return;
    }

    /* No session, no transaction? */
    Logger(
      `${LOG_NS} ${this.name} unexpected janus message directed to the connection ${JSON.stringify(janus_message)}`
    );
  }
}

export default Connection;
