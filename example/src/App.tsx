import { Text, View, StyleSheet, Button } from 'react-native';
import { Mqtt } from 'react-native-janus-mqtt';

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

function onSuccess() {
  console.log('--------------------connected---------------------');
}

function send() {
  client.publish('/loprice/test', 'test');
}

function subscribe() {
  client.subscribe('/loprice/test');
}

// called when the client loses its connection
function onConnectionLost(responseObject: any) {
  if (responseObject.errorCode !== 0) {
    console.log('onSignupsConnectionLost:' + responseObject.errorMessage);
  }
}

// called when the client loses its connection
function onMessageArrived(message: any) {
  //if (responseObject.errorCode !== 0) {
  console.log(message.payloadString);
  //}
}

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={{ margin: 4 }}>Mqtt function test</Text>
      <Button title="Start mqtt" onPress={() => getClient()} />
      <Button title="Subscribe" onPress={() => subscribe()} />
      <Button title="Publish" onPress={() => send()} />
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
