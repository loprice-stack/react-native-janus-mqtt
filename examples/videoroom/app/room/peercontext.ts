import { createContext } from 'react';

export const pc_ = createContext({
  pcPub: RTCPeerConnection,
  pcSub: RTCPeerConnection,

  subscriptions: [],
});
