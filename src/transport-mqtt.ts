import Paho from 'paho-mqtt';
import { getNumericID, Logger, randomString } from './utils';
const LOG_NS = '[transport-mqtt.ts]';

export type MqttOptions = {
  serverUrl: string;
  port: number;
  clientId: string | undefined;
  userName: string;
  password: string;
  tojanus: string;
  fromjanus: string;
  useSSL: boolean;
  keepAliveInterval: number;
  reconnect: boolean;
  willMessageOptions: willOptions;
  onSuccess: any;
};

export type willOptions = {
  topic: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  message: string;
};

class Mqtt {
  private mqttclient: any;
  id: string;
  private options: MqttOptions = {
    serverUrl: '',
    port: 0,
    clientId: '',
    userName: '',
    password: '',
    tojanus: 'to-janus',
    fromjanus: 'from-janus',
    useSSL: true,
    keepAliveInterval: 60,
    reconnect: true,
    willMessageOptions: { topic: '', qos: 0, retain: false, message: '' },
    onSuccess: undefined,
  };

  constructor({
    serverUrl,
    port,
    clientId = randomString(),
    userName,
    password,
    tojanus = 'tojanus',
    fromjanus = 'fromjanus',
    useSSL = true,
    keepAliveInterval = 60,
    reconnect,
    willMessageOptions,
    onSuccess,
  }: MqttOptions) {
    this.options.serverUrl = serverUrl;
    this.options.port = port;
    this.options.clientId = clientId;
    this.options.userName = userName;
    this.options.password = password;
    this.options.tojanus = tojanus;
    this.options.fromjanus = fromjanus;
    this.options.useSSL = useSSL;
    this.options.keepAliveInterval = keepAliveInterval;
    this.options.reconnect = reconnect;
    this.options.willMessageOptions = willMessageOptions;
    this.options.onSuccess = onSuccess;
    this.mqttclient = new Paho.Client(serverUrl, Number(port), clientId);
    this.id = getNumericID();
    Logger(`${LOG_NS} [${this.id}] creating new mqtt transport connection`);
  }

  connect() {
    this.mqttclient.connect({
      userName: this.options.userName,
      password: this.options.password,
      useSSL: this.options.useSSL,
      keepAliveInterval: 60,
      onSuccess: this.options.onSuccess,
      willMessage: this.message(),
    });
  }

  disconnect() {
    this.mqttclient.disconnect();
  }

  private message() {
    var lastWillMessage = new Paho.Message(
      this.options.willMessageOptions.message
    );
    lastWillMessage.destinationName = this.options.willMessageOptions.topic;
    lastWillMessage.qos = this.options.willMessageOptions.qos;
    lastWillMessage.retained = this.options.willMessageOptions.retain;
    return lastWillMessage;
  }

  // called when the mqttclient succeed connecting
  onSuccess(onSuccess: any) {
    this.mqttclient.onConnectionLost = onSuccess;
  }

  // called when the mqttclient loses its connection
  onConnectionLost(onConnectionLost: any) {
    this.mqttclient.onConnectionLost = onConnectionLost;
  }

  // called when the message arrive
  onMessageArrived(onMessageArrived: any) {
    this.mqttclient.onMessageArrived = onMessageArrived;
  }

  // called when the message arrive
  onMessageDelivered(onMessageDelivered: any) {
    this.mqttclient.onMessageDelivered = onMessageDelivered;
  }

  publish(topic: string, payload: any) {
    const message = new Paho.Message(JSON.stringify(payload));
    message.destinationName = topic;
    this.mqttclient.send(message);
  }

  send(request: any) {
    this.publish(this.options.tojanus, request);
  }

  publish2(topic: string, payload: any, qos: 0 | 1 | 2, retain: boolean) {
    const message = new Paho.Message(JSON.stringify(payload));
    message.destinationName = topic;
    message.qos = qos;
    message.retained = retain;
    this.mqttclient.send(message);
  }

  subscribe(topic: string) {
    this.mqttclient.subscribe(topic);
  }
}

export default Mqtt;
