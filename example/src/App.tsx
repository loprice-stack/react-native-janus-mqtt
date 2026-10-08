import { Text, View, StyleSheet, Button } from 'react-native';
import { Connection } from 'react-native-janus-mqtt';
import { Logger } from '../../src/utils';
const LOG_NS = '[App.ts]';
let connection: any = null;
function janusMqttConect() {
  connection = new Connection({
    serverUrl: 'loprice.co.tz',
    port: 5281,
    clientId: undefined,
    userName: 'ws@loprice.co.tz',
    password: 'ws',
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

// publish to topic
async function createSession() {
  const session = await connection.create();

  console.log(session);
  console.log('----------------session-----------------------------');
}

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={{ margin: 4 }}>Janus Mqtt Api test</Text>
      <Button title="Connect" onPress={() => janusMqttConect()} />
      <Button title="Create session" onPress={() => createSession()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
});
