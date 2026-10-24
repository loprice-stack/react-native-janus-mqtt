import { StyleSheet, Text, useColorScheme } from 'react-native';
import { store } from './store';
import { Provider } from 'react-redux';
import Conference from './room/VideoRoomWeb';
import React from 'react';

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <Conference />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
