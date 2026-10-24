import { store } from './store';
import { Provider } from 'react-redux';
import Conference from './room/VideoRoomWeb';

export default function App() {
  return (
    <Provider store={store}>
      <Conference />
    </Provider>
  );
}
