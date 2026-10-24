import { store } from './../store';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCRtpTransceiver,
  RTCRtpReceiver,
  RTCRtpSender,
  RTCErrorEvent,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  permissions,
  registerGlobals,
  RTCView,
  //@ts-ignore
} from 'react-native-webrtc-web-shim';
import {
  pushSubRemoteStream,
  setPubLocalStream,
  setStreamRoomRemoteCandidate,
} from './conferenceSlice';
import { JANUSMQTT } from './../../node_modules/react-native-janus-mqtt/src/protocol';
import { Logger } from '../../node_modules/react-native-janus-mqtt/src/utils';
const LOG_NS = '[videoroom-plugin-wbrtc.ts]';


//May be used by publisher handle
export async function doOffer(handlePub: any, peerContx: any) {
  peerContx.pcPub = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:tuchati.loprice.co.tz:3478' }],
  });

  //@ts-ignore
  peerContx.pcPub.onnegotiationneeded = (event) =>
    Logger(peerContx.pcPub.onnegotiationneeded);

  //@ts-ignore
  peerContx.pcPub.onicecandidate = (event) => {
    // When you find a null candidate then there are no more candidates.
    // Gathering of candidates has finished.
    try {
      const candidate = {
        //@ts-ignore
        candidate: event.candidate.candidate,
        //@ts-ignore
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        //@ts-ignore
        sdpMid: event.candidate.sdpMid,
      };
      handlePub.tricklle(candidate);
      Logger(candidate);
      // Send the event.candidate onto the person you're calling.
      // Keeping to Trickle ICE Standards, you should send the candidates immediately.
    } catch (null_candidate) {
      handlePub.tricklleComplete();
      Logger(null_candidate);
      Logger(event);
    }
    Logger(
      `${LOG_NS} ----------------------icecandidate----stufF---------------`
    );
  };

  //@ts-ignore
  peerContx.pcPub.oniceconnectionstatechange = (event) => {
    if (
      peerContx.pcPub.iceConnectionState === 'failed' ||
      peerContx.pcPub.iceConnectionState === 'disconnected' ||
      peerContx.pcPub.iceConnectionState === 'closed'
    ) {
      closePcPub(peerContx);
    } else if (peerContx.pcPub.iceConnectionState === 'connected') {
    } else if (peerContx.pcPub.iceConnectionState === 'completed') {
    }
    Logger(peerContx.pcPub.iceConnectionState);
    
    Logger(
      `${LOG_NS} -----------------iceconnectionstatechange---------------`
    );
  };
  /* This one below should not be fired, cause the PC is used just to send */
  //@ts-ignore
  peerContx.pcPub.ontrack = (event) => Logger(peerContx.pcPub.ontrack);

  try {
    const localStream = await mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    //@ts-ignore
    localStream.getTracks().forEach((track) => {
      Logger(`${LOG_NS}adding track`);

      //@ts-ignore
      peerContx.pcPub.addTrack(track, localStream);
    });

    store.dispatch(setPubLocalStream(localStream));
  } catch (e) {
    Logger(`${LOG_NS}error while doing offer`);
    return;
  }

  try {
    const offer = await peerContx.pcPub.createOffer();

    //@ts-ignore
    await peerContx.pcPub.setLocalDescription(offer);
    Logger(`${LOG_NS}set local sdp OK`);
    return offer;
  } catch (e) {
    Logger(`${LOG_NS}error while doing offer`);
    return;
  }
}

export function eventTrickle(handle: any, pc: any) {
  let remoCandidates = [];

  //@ts-ignore
  handle.on(JANUSMQTT.EVENT.HANDLE_TRICKLE, (evtdata) => {
    if (
      pc.signalingstatechange == 'have-local-offer' ||
      pc.signalingstatechange == 'stable'
    ) {
      const completed = evtdata.complete;
      if (completed) {
        //@ts-ignore
        remoCandidates.push(null);
        store.dispatch(setStreamRoomRemoteCandidate(remoCandidates));
        Logger(remoCandidates);
        Logger(
          `${LOG_NS} ------------------null--------list------------------------------------`
        );
      } else {
        const iceCandidate = new RTCIceCandidate(evtdata);
        //@ts-ignore
        remoCandidates.push(iceCandidate);
        Logger(remoCandidates);
        Logger(
          `${LOG_NS} --------------------------list------------------------------------`
        );
      }
    }

    Logger(evtdata);
    Logger(
      `${LOG_NS} --------------------------eventTrickle------------------------------------`
    );
  });
}

export function processCandidates(peerConnection: any, remoteCandidates: any) {
  if (remoteCandidates.length < 1) {
    return;
  }
  //@ts-ignore
  remoteCandidates.map((candidate) => {
    peerConnection.addIceCandidate(candidate);
    Logger(candidate);
    Logger(
      `${LOG_NS} ---------------------saving--saved--remote---candidate-------------------------`
    );
  });
  Logger(remoteCandidates);
  Logger(
    `${LOG_NS} ---------------------clearing--remote---candidate----list---------------------`
  );
  store.dispatch(setStreamRoomRemoteCandidate([]));
}

//May be used by subscriber handle
export async function doOfferAnswer(
  handleSub: any,
  peerContx: any,
  r_jsep: any
) {
  peerContx.pcSub = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:tuchati.loprice.co.tz:3478' }],
  });

  //@ts-ignore
  peerContx.pcSub.onnegotiationneeded = (event) =>
    Logger(peerContx.pcSub.onnegotiationneeded);

  //@ts-ignore
  peerContx.pcSub.onicecandidate = (event) => {
    // When you find a null candidate then there are no more candidates.
    // Gathering of candidates has finished.
    try {
      const candidate = {
        //@ts-ignore
        candidate: event.candidate.candidate,
        //@ts-ignore
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        //@ts-ignore
        sdpMid: event.candidate.sdpMid,
      };
      handleSub.tricklle(candidate);
      Logger(candidate);
      // Send the event.candidate onto the person you're calling.
      // Keeping to Trickle ICE Standards, you should send the candidates immediately.
    } catch (null_candidate) {
      handleSub.tricklleComplete();
      Logger(null_candidate);
      Logger(event);
    }
    Logger(
      `${LOG_NS} ----------------------icecandidate----stufF---------------`
    );
  };

  eventTrickle(handleSub, peerContx.pcSub);

  //@ts-ignore
  peerContx.pcSub.oniceconnectionstatechange = () => {
    if (
      peerContx.pcSub.iceConnectionState === 'failed' ||
      peerContx.pcSub.iceConnectionState === 'closed'
    ) {
      //removeAllRemoteMediaElements();
      //closeSubPc();
    }
  };

  //@ts-ignore
  peerContx.pcSub.ontrack = (event) => {
    //@ts-ignore
    event.track.onunmute = (evt) => {
      Logger(evt);
      Logger(`${LOG_NS} track.onunmute`);
    };

    //@ts-ignore
    event.track.onmute = (evt) => {
      Logger(evt);
      Logger(`${LOG_NS} track.onmute`);
    };

    //@ts-ignore
    event.track.onended = (evt) => {
      Logger(evt);
      Logger(`${LOG_NS} track.onended`);
    };

    /* avoid latching tracks */
    //@ts-ignore
    const submid = event.transceiver?.mid || event.receiver.mid;
    const remoteStream =
      event.streams[0].id === 'janus'
        ? new MediaStream([event.track])
        : event.streams[0];
    const track_kind = event.track.kind;

    if (event.track.kind == 'video') {
      const strm = new MediaStream([event.track]);

      store.dispatch(
        pushSubRemoteStream({
          remotestream: strm,
          feed: undefined,
          display: undefined,
          room: undefined,
        })
      );
      Logger({
        remotestream: strm,
        feed: undefined,
        display: undefined,
        room: undefined,
      });
      Logger(
        `${LOG_NS} -------------------------(event.track.kind == video)----------------------------------`
      );
    }
    Logger(`${LOG_NS} -----------------peerContx.pcSub.ontrack'`);
    Logger(peerContx.subscriptions);
    Logger(
      `${LOG_NS} ----------------------------remotestream-------------------------------`
    );
  };

  try {
    if (r_jsep.lenght !== 0) {
      const offerDescription = new RTCSessionDescription(r_jsep);
      await peerContx.pcSub.setRemoteDescription(offerDescription);
      const answerDescription = await peerContx.pcSub.createAnswer();
      await peerContx.pcSub.setLocalDescription(answerDescription);
      Logger(`${LOG_NS}  Got answer jsep `);
      return answerDescription;
    } else {
      Logger(`${LOG_NS} No offer jsep is found`);
    }
  } catch (err) {
    Logger(err);
  }
}

//May be used by subscriber handle
export async function doOfferAnswerUpdate(peerContx: any, r_jsep: any) {
  try {
    Logger(
      `${LOG_NS} -----------------------doOfferAnserUpdate-------------------------`
    );

    const offerDescription = new RTCSessionDescription(r_jsep);
    await peerContx.pcSub.setRemoteDescription(offerDescription);
    const answerDescription = await peerContx.pcSub.createAnswer();
    await peerContx.pcSub.setLocalDescription(answerDescription);
    Logger(`${LOG_NS}  Got answer jsep `);
    return answerDescription;
  } catch (err) {
    Logger(err);
  }
}

export function closePcPub(peerContx: any) {
  if (!peerContx.pcPub) return;
  //@ts-ignore
  peerContx.pcPub.getSenders().forEach((sender) => {
    if (sender.track) sender.track.stop();
  });

  //@ts-ignore
  peerContx.pcPub.getReceivers().forEach((receiver) => {
    if (receiver.track) receiver.track.stop();
  });
  peerContx.pcPub.onnegotiationneeded = null;
  peerContx.pcPub.onicecandidate = null;
  peerContx.pcPub.oniceconnectionstatechange = null;
  peerContx.pcPub.ontrack = null;
  try {
    peerContx.pcPub.close();
    peerContx.pcPub = null;
  } catch (_e) {}
}

export function closePcSub(peerContx: any) {
  if (!peerContx.pcSub) return;

  //@ts-ignore
  peerContx.pcSub.getSenders().forEach((sender) => {
    if (sender.track) sender.track.stop();
  });

  //@ts-ignore
  peerContx.pcSub.getReceivers().forEach((receiver) => {
    if (receiver.track) receiver.track.stop();
  });
  peerContx.pcSub.onnegotiationneeded = null;
  peerContx.pcSub.onicecandidate = null;
  peerContx.pcSub.oniceconnectionstatechange = null;
  peerContx.pcSub.ontrack = null;
  try {
    peerContx.pcSub.close();
    peerContx.pcSub = null;
  } catch (_e) {}
}

//May be used by publisher handle
export async function saveReceivedJsepAnswer(peerContx: any, r_jsep: any) {
  try {
    // Use the received receivedAnswerDescription
    const receivedAnswerDescription = new RTCSessionDescription(r_jsep);
    Logger(`${LOG_NS} Answer description object is ok`);
    Logger(peerContx.pcPub.signalingState);
    Logger(`${LOG_NS} -----------------signalingstatechange---------------`);
    await peerContx.pcPub.setRemoteDescription(receivedAnswerDescription);
    Logger(`${LOG_NS}  Saved answer jsep `);
  } catch (err) {
    Logger(
      `${LOG_NS} ---------------------------------answer---jse----error-----------------------`
    );
  }
}
