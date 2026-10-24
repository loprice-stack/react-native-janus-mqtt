import { createContext } from 'react';
import {
  RTCPeerConnection,
  //@ts-ignore
} from 'react-native-webrtc-web-shim';
export const pc_ = createContext({
  pcPub: RTCPeerConnection,
  pcSub: RTCPeerConnection,

  subscriptions: [],
});
