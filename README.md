# react-native-janus-mqtt

This library enables you to connect to [Janus Webrtc Server](https://janus.conf.meetecho.com/) through janus.transport.mqtt plugin. Under the hood it uses  [Paho](https://github.com/eclipse-paho/paho.mqtt.javascript) as a transport. The library has also implement at least neccessary functions of Paho (Paho.Client(options) ) transporrt client which can be used via Mqtt (Mqtt(options) client). 

#### Plugins implementations
+ videocall-plugin

## Installation


```sh
npm install react-native-janus-mqtt
```


## Usage

A brief usage for the janus implementation. Check on example app for more

```ts
import { Connection } from 'react-native-janus-mqtt';
import videocallPlugin from '../../src/plugins/videocall-plugin';
import { Logger } from '../../src/utils';
import type Session from '../../src/session';
const LOG_NS = '[App.ts]';


let connection: Connection
let session: Session
let handle: any


  function janusMqttConect() {
    //Create connection
    connection = new Connection({
      serverUrl: 'tuchati.loprice.co.tz',
      port: 5281,
      clientId: undefined, //set undefine to generate clientId automatically
      userName: 'test@tuchati.loprice.co.tz',
      password: 'test',
      tojanus: 'to-janus',//send message to janus server topic
      fromjanus: 'from-janus',//receive message from janus server topic
      useSSL: true,
      keepAliveInterval: 60,
      reconnect: true,
      willMessageOptions: {
        topic: 'topic',
        qos: 0,
        retain: false,
        message: 'will',
      },
      onSuccess: () => {
        connection.setJanusMessageListerner(); //subscribe to from-janus channel/topic
        connection.setJanusMessageListerner2('status');//subscribe to status channel/topic from janus
        //connection.setJanusMessageListerner2('janus-other-topics/channels'); //subscribe to other channels/topics from janus
        Logger(`${LOG_NS}  connected successfully`);
      },
    });
  }

  // Create session
  async function createSession() {
    session = await connection.create();
    Logger(session));

  }

  // Create handle
  async function createHandle() {
    handle = await session.attach(videocallPlugin)
    Logger(handle));
  }


```
Usage for mqtt client

```ts
import { Mqtt } from 'react-native-janus-mqtt';
import { Logger } from '../../src/utils';
const LOG_NS = '[App.ts]';

let client: any

function mqttClient(options){

   try {
        client = new Mqtt({
        serverUrl: options.serverUrl,
        port: options.port,
        clientId: options.clientId,
        userName: options.userName,
        password: options.password,
        tojanus: options.tojanus, //not necessary
        fromjanus: options.fromjanus,//not necessary
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
      //client.onSuccess()
      client.onConnectionLost((error: any) => {
        Logger(`${LOG_NS} [${this.id}] connection lost! reason [${error}]`);
      });
      client.onMessageArrived((message: any) => {
        console.log(message.payloadString);
      });

      client.connect();
    } catch (error) {
      Logger(
        `${LOG_NS} [${this.id}] Error while initializing client (${error})`
      );
    }
}


function publish(topic: string, payload: any) {
    client.publish(topic, payload)
}

function publish2(topic: string, payload: any, qos: 0 | 1 | 2, retain: boolean) {
    client.publish2(topic, payload, qos, retain)
}

function subscribe(topic: string) {
  client.subscribe(topic)
}

```
## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---
