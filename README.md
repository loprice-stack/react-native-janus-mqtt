# react-native-janus-mqtt

Connect Janus Webrtc Server with Mqtt

## Installation


```sh
npm install react-native-janus-mqtt
```


## Usage

A brief usage for the library. For more, check on example app

```js
import { Connection } from 'react-native-janus-mqtt';
import videocallPlugin from '../../src/plugins/videocall-plugin';
import { Logger } from '../../src/utils';
import type Session from '../../src/session';
const LOG_NS = '[App.ts]';
// ...

let connection: Connection
let session: Session
let handle: any


  function janusMqttConect() {
    //Create connection
    connection = new Connection({
      serverUrl: 'tuchati.loprice.co.tz',
      port: 5281,
      clientId: undefined,
      userName: 'test@tuchati.loprice.co.tz',
      password: 'test',
      tojanus: 'to-janus',
      fromjanus: 'from-janus',
      useSSL: true,
      keepAliveInterval: 0,
      reconnect: true,
      willMessageOptions: {
        topic: 'topic',
        qos: 0,
        retain: false,
        message: 'will',
      },
      onSuccess: () => {
        connection.setJanusMessageListerner();
        connection.setJanusMessageListerner2('status');
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


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---
