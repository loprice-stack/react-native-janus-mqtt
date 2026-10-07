import Paho from 'paho-mqtt';
import { randomString } from './utils';
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
  private client: any;
  private options: MqttOptions = {
    serverUrl: '',
    port: 0,
    clientId: '',
    userName: '',
    password: '',
    tojanus: 'tojanus',
    fromjanus: 'fromjanus',
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
    this.client = new Paho.Client(serverUrl, Number(port), clientId);
  }

  connect() {
    this.client.connect({
      userName: this.options.userName,
      password: this.options.password,
      useSSL: this.options.useSSL,
      keepAliveInterval: 60,
      onSuccess: this.options.onSuccess,
      willMessage: this.message(),
    });
  }

  disconnect() {
    this.client.disconnect();
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

  // called when the client succeed connecting
  onSuccess(onSuccess: any) {
    this.client.onConnectionLost = onSuccess;
  }

  // called when the client loses its connection
  onConnectionLost(onConnectionLost: any) {
    this.client.onConnectionLost = onConnectionLost;
  }

  // called when the message arrive
  onMessageArrived(onMessageArrived: any) {
    this.client.onMessageArrived = onMessageArrived;
  }

  // called when the message arrive
  onMessageDelivered(onMessageDelivered: any) {
    this.client.onMessageDelivered = onMessageDelivered;
  }

  publish(topic: string, payload: any) {
    const message = new Paho.Message(JSON.stringify(payload));
    message.destinationName = topic;
    this.client.send(message);
  }

  publish2(topic: string, payload: any, qos: 0 | 1 | 2, retain: boolean) {
    const message = new Paho.Message(JSON.stringify(payload));
    message.destinationName = topic;
    message.qos = qos;
    message.retained = retain;
    this.client.send(message);
  }

  subscribe(topic: string) {
    this.client.subscribe(topic);
  }
}

export default Mqtt;
