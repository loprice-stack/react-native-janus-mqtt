import { EventEmitter } from 'events';
import { getNumericID } from './utils';
import Mqtt, { type MqttOptions } from './transport-mqtt';
import TransactionManager from './transaction-manager';
import { JANUSMQTT } from './protocol';

class Connection extends EventEmitter {
  _tm: any;
  _sessions: Map<string, any>;
  id: any;
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
        //this._signalClose(false)
        console.log(error);
      });
      transport.onMessageArrived((message: any) => {
        console.log(message.payloadString);
      });
      transport.connect();
      if (transport) this._transport = transport;
      this.options = options;
    } catch (error) {
      console.log(`Error while initializing transport (${error})`);
    }
  }

  connect() {
    this._transport.connect();
  }

  disconnect() {
    this._transport.disconnect();
  }

  setJanusMessageListerner(topic: string) {
    this._transport.subscribe(topic);
  }

  send(request: any) {
    this._transport.publish(this.options.tojanus, request);
  }

  /**
   * Cleanup the connection closing all owned transactions and emitting the destroyed event
   * and removing all registered listeners.
   *
   * @private
   * @param {boolean} graceful - True if this is an expected disconnection
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
       *
       * @event module:connection~Connection#event:CONNECTION_CLOSED
       * @type {Object}
       * @property {number} id - The connection identifier
       */
      this.emit(JANUSMQTT.EVENT.CONNECTION_CLOSED, { id: this.id });
    } else {
      /* If this event is unexpected emit an error */
      const error = new Error('unexpected disconnection');
      /**
       * The connection has been unexpectedly closed.
       *
       * @event module:connection~Connection#event:CONNECTION_ERROR
       * @type {Error}
       */
      this.emit(JANUSMQTT.EVENT.CONNECTION_ERROR, error);
    }

    /* Remove all listeners to avoid leaks */
    this.removeAllListeners();
  }
}

export default Connection;
