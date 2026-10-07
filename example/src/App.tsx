import { Text, View, StyleSheet, Button } from 'react-native';
import { Connection } from 'react-native-janus-mqtt';

let connection: any = null;
function getClient() {
  connection = new Connection({
    serverUrl: 'loprice.co.tz',
    port: 5281,
    clientId: undefined,
    userName: 'ws@loprice.co.tz',
    password: 'ws',
    tojanus: 'tojanus',
    fromjanus: 'fromjanus',
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
      connection.setJanusMessageListerner(connection.options.tojanus);
      console.log('Success from connection class');
    },
  });
}

// publish to topic
function publish() {
  connection.send('test');
}

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={{ margin: 4 }}>Mqtt function test</Text>
      <Button title="Start mqtt" onPress={() => getClient()} />
      <Button title="Publish" onPress={() => publish()} />
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
