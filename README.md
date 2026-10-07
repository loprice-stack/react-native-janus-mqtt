# react-native-janus-mqtt

Connect Janus Webrtc Server with Mqtt

## Installation


```sh
npm install react-native-janus-mqtt
```


## Usage


```js
import { Mqtt } from 'react-native-janus-mqtt';

// ...


let client: any = null;
function getClient() {
  client = new Mqtt({
    serverUrl: 'loprice.co.tz',
    port: 5281,
    clientId: undefined,
    userName: 'ws@loprice.co.tz',
    password: 'ws',
    tojanus: 'tojanus',
    fromjanus: 'fromjanus',
    useSSL: true,
    keepAliveInterval: 60,
    willMessageOptions: {
      topic: 'topic',
      qos: 0,
      retain: false,
      message: 'will',
    },
    onSuccess: onSuccess,
  });

  client.onConnectionLost(onConnectionLost);
  client.onMessageArrived(onMessageArrived);

  client.connect();
}

// called when the client successfully connect to the mqtt broker
function onSuccess() {
  console.log('onSuccess: connected');
}

// publish to topic
function publish() {
  client.publish('/loprice/test', 'test');
}

// subscribe to topic
function subscribe() {
  client.subscribe('/loprice/test');
}

// called when the client loses its connection
function onConnectionLost(responseObject: any) {
  if (responseObject.errorCode !== 0) {
    console.log('onConnectionLost:' + responseObject.errorMessage);
  }
}

// called when the client receive message
function onMessageArrived(message: any) {
  console.log(message);

}

```


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---
