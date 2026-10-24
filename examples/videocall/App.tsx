import { Text, View, StyleSheet, Button, TextInput } from 'react-native';

import { useState } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
  RTCView,
  //@ts-ignore
} from 'react-native-webrtc-web-shim';
import { Connection } from "react-native-janus-mqtt";
import { Logger } from './node_modules/react-native-janus-mqtt/src/utils';
import type Session from './node_modules/react-native-janus-mqtt/src/session';
import VideocallHandle from './node_modules/react-native-janus-mqtt/src/plugins/videocall-plugin';

const LOG_NS = '[VideoCall.ts]';
let connection: Connection;
let session: Session;
let handle: any;
let pc: RTCPeerConnection;

export default function App() {
  const [username, setUserName] = useState('yourname');
  const [caller, setCaller] = useState('callername');
  const [signalingstatechange, setSignalingstatechange] =
    useState('have-local-offer');

  //@ts-ignore
  const [localstream, setLocalstream] = useState<MediaStream>(null);
  //@ts-ignore
  const [remotestream, setRemotestream] = useState<MediaStream>(null);
  const [remoteCandidates, setRemoteCandidates] = useState([]);
  const [callstate, setCallState] = useState('iddle');
  const [remotesdp, setRemoteSdp] = useState(null);

  function janusMqttConect() {
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

  async function createSession() {
    session = await connection.create();
  }

  async function createHandle() {
    handle = await session.attach(VideocallHandle);
  }

  async function register() {
    handle.register(username);
    await pcListerners();
  }

  async function startCall() {
    try {
      //setCallState("calling")
      pcListerners();
      await setMediaStream(pc);
      const jsep = await createOffer(pc);
      Logger(`${LOG_NS} Starting a call`);

      await handle.call(caller, jsep);
    } catch (err) {
      Logger(err);
      Logger(`${LOG_NS} Error starting a call`);
    }
  }

  async function pcListerners() {
    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:tuchati.loprice.co.tz:3478' }],
    });
    handleCallOnstart(pc, handle);
    eventIcomming(handle);
    eventCalling(handle);
    eventAccepted(handle);
    eventTricle(handle);
    eventHangup(handle);
    eventDetached(handle);
    eventUpdate(handle);
  }

  async function acceptCall() {
    try {
      await pcListerners();
      await setMediaStream(pc);
      const jsep = await createOfferAnser(pc, remotesdp);

      handle.accept(jsep);
    } catch (err) {
      Logger(err);
      Logger(`${LOG_NS} Error answering a call`);
    }
  }

  async function hangupCall() {
    try {
      await handle.hangup();
      //stopAllStreams();
      //closePeerConnection(pc)
      Logger(`${LOG_NS} Hangup successfully`);
    } catch (err) {
      Logger(err);
      //close anyway
      //stopAllStreams();
      //closePeerConnection(pc)
      Logger(`${LOG_NS} Error closing a call`);
    }
  }

  async function hangupCallRemote() {
    try {
      setLocalstream(null);
      Logger(`${LOG_NS} Local stream closed `);

      setRemotestream(null);
      Logger(`${LOG_NS} Remote stream closed `);
      //closePeerConnection(pc)
      Logger(`${LOG_NS} We Hanguped successfully`);
    } catch (err) {
      Logger(`${LOG_NS} ${err}`);
      //close anyway
      setLocalstream(null);
      Logger(`${LOG_NS} Local stream closed `);
      setRemotestream(null);
      Logger(`${LOG_NS} Remote stream closed `);
      //closePeerConnection(pc)
      Logger(`${LOG_NS} Error hanguped a call`);
    }
  }

  function processCandidates(peerConnection: any, remoteCandidates: any) {
    if (remoteCandidates.length < 1) {
      return;
    }
    remoteCandidates.map((candidate: any) => {
      peerConnection.addIceCandidate(candidate);
      Logger(`${LOG_NS} ${candidate}`);
      Logger(
        `${LOG_NS}---------------------saving--saved--remote---candidate-------------------------`
      );
    });
    Logger(`${LOG_NS} ${remoteCandidates}`);
    Logger(
      `${LOG_NS}---------------------clearing--remote---candidate----list---------------------`
    );
    setRemoteCandidates([]);
  }

  async function createOffer(peerConnection: any) {
    try {
      const offerDescription = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        voiceActivityDetection: true,
      });
      await peerConnection.setLocalDescription(offerDescription);
      Logger(`${LOG_NS} Got offer jsep `);
      return offerDescription;
    } catch (err) {
      Logger(err);
    }
    Logger(`${LOG_NS}------------------createOffer---------------------------`);
  }

  async function createOfferAnser(peerConnection: any, r_jsep: any) {
    try {
      if (r_jsep.lenght !== 0) {
        const offerDescription = new RTCSessionDescription(r_jsep);
        await peerConnection.setRemoteDescription(offerDescription);
        const answerDescription = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answerDescription);
        Logger(`${LOG_NS} Got answer jsep `);
        return answerDescription;
      } else {
        Logger(`${LOG_NS} No offer jsep is found`);
      }
    } catch (err) {
      Logger(err);
    }
    Logger(
      `${LOG_NS} ------------------createOfferAnser---------------------------`
    );
  }

  async function saveReceivedJsepAnswer(peerConnection: any, r_jsep: any) {
    try {
      // Use the received receivedAnswerDescription
      const receivedAnswerDescription = new RTCSessionDescription(r_jsep);
      Logger(`${LOG_NS} Answer description object is ok`);
      Logger(`${LOG_NS} ${peerConnection.signalingState}`);
      Logger(`${LOG_NS}-----------------signalingstatechange---------------`);
      await peerConnection.setRemoteDescription(receivedAnswerDescription);
      Logger(`${LOG_NS} Saved answer jsep `);
    } catch (err) {
      Logger(err);
      Logger(
        `${LOG_NS}---------------------------------answer---jse----error-----------------------`
      );
    }
  }

  async function setMediaStream(peerConnection: any) {
    try {
      Logger(`${LOG_NS} Setting local media stream`);

      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          frameRate: 30,
        },
      });

      setLocalstream(mediaStream);

      mediaStream
        .getTracks()
        .forEach((track: any) => peerConnection.addTrack(track, mediaStream));
    } catch (err) {
      Logger(`${LOG_NS} ${err}`);
    }
  }

  function closePeerConnection(pc: any) {
    if (!pc) return;
    //@ts-ignore
    pc.getSenders().forEach((sender) => {
      if (sender.track) sender.track.stop();
    });
    //@ts-ignore
    pc.getReceivers().forEach((receiver) => {
      if (receiver.track) receiver.track.stop();
    });

    //@ts-ignore
    pc.onnegotiationneeded = null;
    //@ts-ignore
    pc.onicecandidate = null;
    //@ts-ignore
    pc.oniceconnectionstatechange = null;
    //@ts-ignore
    pc.ontrack = null;
    //@ts-ignore
    pc.close();
  }

  return (
    <View style={styles.container}>
      <Text style={{ margin: 4, fontSize: 20 }}>
        Janus Mqtt Video Call Api test
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Connect" onPress={() => janusMqttConect()} />
        <Button title="Create session" onPress={() => createSession()} />
        <Button title="Create handle" onPress={() => createHandle()} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Register" onPress={() => register()} />
        <TextInput
          id="nm"
          style={styles.input}
          value={username}
          placeholder="your name"
          onChangeText={(text) => {
            setUserName(text);
          }}
        />
        <TextInput
          style={styles.input}
          id="cnm"
          value={caller}
          placeholder="caller name"
          onChangeText={(text) => {
            setCaller(text);
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ width: 800, height: '90%' }}>
          {remotestream && (
            <RTCView
              style={{ backgroundColor: 'black', width: 800, height: '100%' }}
              mirror={true}
              objectFit={'cover'}
              stream={remotestream}
              zOrder={0}
            />
          )}
        </View>
        <View
          //@ts-ignore
          bottom={60}
          style={{
            position: 'absolute',
            marginLeft: 8,
            width: 100,
            height: 150,
          }}
        >
          {localstream && (
            <RTCView
              style={{ backgroundColor: 'black', width: 100, height: 150 }}
              mirror={true}
              objectFit={'cover'}
              stream={localstream}
              zOrder={0}
            />
          )}
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          bottom: 2,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <Button
          title={
            callstate === 'incoming' ||
            callstate === 'connecting' ||
            callstate === 'calling' ||
            callstate === 'connected' ||
            callstate === 'accepted'
              ? 'Hangup'
              : 'Call'
          }
          color={
            callstate === 'incoming' ||
            callstate === 'connecting' ||
            callstate === 'calling' ||
            callstate === 'connected' ||
            callstate === 'accepted'
              ? 'red'
              : 'green'
          }
          onPress={
            //"call" | "calling" | "incoming" | "hangup" | "iddle" | "connected" | "accepted"
            () => {
              callstate === 'incoming' ||
              callstate === 'calling' ||
              callstate === 'connecting' ||
              callstate === 'connected' ||
              callstate === 'accepted'
                ? hangupCall()
                : startCall();
            }
          }
        />
        <Button
          title="Accept"
          color={callstate === 'incoming' ? 'green' : undefined}
          disabled={callstate === 'incoming' ? false : true}
          onPress={() => acceptCall()}
        />
      </View>
    </View>
  );

  function eventCalling(vch: any) {
    vch.once(VideocallHandle.EVENT.VIDEOCALL_CALLING, (evtdata: any) => {
      setCallState('calling');
      Logger(evtdata);
      Logger(
        `${LOG_NS} ----------------------eventCalling------------------------------`
      );
    });
  }

  function eventIcomming(vch: any) {
    vch.once(VideocallHandle.EVENT.VIDEOCALL_INCOMMING, (evtdata: any) => {
      setCallState('incoming');
      const jsep = evtdata.jsep;
      setRemoteSdp(jsep);
      Logger(evtdata);
      Logger(
        `${LOG_NS} ----------------------eventIcomming------------------------------`
      );
    });
  }

  function eventTricle(vch: any) {
    let remoCandidates = [];
    vch.on(VideocallHandle.EVENT.VIDEOCALL_TRICKLE, (evtdata: any) => {
      if (
        signalingstatechange == 'have-local-offer' ||
        signalingstatechange == 'stable'
      ) {
        const completed = evtdata.complete;
        if (completed) {
          remoCandidates.push(null);
          //@ts-ignore
          setRemoteCandidates(remoCandidates);
          Logger(`${LOG_NS} ${remoteCandidates}`);
          Logger(`${LOG_NS} ${evtdata}`);
        } else {
          const iceCandidate = new RTCIceCandidate(evtdata);

          remoCandidates.push(iceCandidate);
          Logger(`${LOG_NS} ${remoteCandidates}`);
          Logger(`${LOG_NS} ${evtdata}`);
        }
      }
      Logger(
        `${LOG_NS} ----------------------eventTricle------------------------------`
      );
    });
  }

  function eventAccepted(vch: any) {
    vch.once(VideocallHandle.EVENT.VIDEOCALL_ACCEPTED, (evtdata: any) => {
      const jsep = evtdata.jsep;
      saveReceivedJsepAnswer(pc, jsep);
      Logger(evtdata);
      Logger(
        `${LOG_NS} ----------------------eventAccepted------------------------------`
      );
    });
  }

  function eventHangup(vch: any) {
    vch.once(VideocallHandle.EVENT.VIDEOCALL_HANGUP, (evtdata: any) => {
      const reason = evtdata.result.reason;
      const username = evtdata.result.username;
      Logger(`${LOG_NS} ${reason}`);
      Logger(`${LOG_NS} ${username}`);
      setCallState('hangup');
      hangupCallRemote();
      Logger(evtdata);
      Logger(
        `${LOG_NS} ----------------------eventHangup------------------------------`
      );
    });
  }

  function eventDetached(vch: any) {
    vch.once(VideocallHandle.EVENT.VIDEOCALL_DETACHED, (evtdata: any) => {
      setCallState('hangup');
      handle = null;
      Logger(evtdata);
      Logger(
        `${LOG_NS} ----------------------eventDetached------------------------------`
      );
    });
  }

  //This was attempt on call update when you want
  //to swiitch face camera from user to environment
  //while the call is in connected state
  function eventUpdate(vch: any) {
    vch.once(VideocallHandle.EVENT.VIDEOCALL_UPDATE, (evtdata: any) => {
      const jsep = evtdata.jsep;
      if (jsep) {
        if (jsep.type == 'offer') {
        } else if (jsep.type == 'answer') {
          saveReceivedJsepAnswer(pc, jsep);
        }
      }
      Logger(evtdata);
      Logger(
        `${LOG_NS} ----------------------eventUpdate------------------------------`
      );
    });
  }

  function handleCallOnstart(peerConnection: any, vch: any) {
    if (peerConnection !== null) {
      peerConnection.addEventListener('track', (event: any) => {
        setRemotestream(event.streams[0]);
        Logger(event);
        Logger(
          `${LOG_NS}--------------remote---tracks---[kind=${event.track.kind}]------------`
        );
      });
      peerConnection.addEventListener('connectionstatechange', (event: any) => {
        switch (peerConnection.connectionState) {
          case 'closed':
            // You can handle the call being disconnected here.
            break;
        }
        setCallState(peerConnection.connectionState);
        Logger(`${LOG_NS} ${peerConnection.connectionState}`);
        Logger(event);
        Logger(
          `${LOG_NS}-----------------connectionstatechange---------------`
        );
      });

      peerConnection.addEventListener('icecandidate', (event: any) => {
        // When you find a null candidate then there are no more candidates.
        // Gathering of candidates has finished.

        try {
          const candidate = event.candidate;

          if (candidate) {
            const candidate = {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid,
            };
            vch.tricklee(candidate);
            Logger(candidate);
          } else {
            //posible candidates

            const candidates = event.candidate;
            if (candidates) {
              candidates.map((candidate: RTCIceCandidate) => {
                const c = {
                  candidate: candidate.candidate,
                  sdpMLineIndex: candidate.sdpMLineIndex,
                  sdpMid: candidate.sdpMid,
                };
                vch.tricklee(c);
                Logger(c);
              });
            }
          }
          // Send the candidate onto the person you're calling.
          // Keeping to Trickle ICE Standards, you should send the candidates immediately.
        } catch (null_candidate) {
          vch.trickleeComplete();
          Logger(`${LOG_NS} ${null_candidate}`);
        }

        Logger(event);
        Logger(
          `${LOG_NS} ----------------------icecandidate----stufF---------------`
        );
      });

      peerConnection.addEventListener('icecandidateerror', (event: any) => {
        // You can ignore some candidate errors.
        // Connections can still be made even when errors occur.
        Logger(event);
        Logger(
          `${LOG_NS}----------------------icecandidateerror----stufF---------------`
        );
      });

      peerConnection.addEventListener(
        'iceconnectionstatechange',
        (event: any) => {
          if (
            peerConnection.iceConnectionState === 'failed' ||
            peerConnection.iceConnectionState === 'disconnected' ||
            peerConnection.iceConnectionState === 'closed'
          ) {
            closePeerConnection(peerConnection);
          } else if (peerConnection.iceConnectionState === 'connected') {
          } else if (peerConnection.iceConnectionState === 'completed') {
          }
          Logger(`${LOG_NS} ${peerConnection.iceConnectionState}`);
          Logger(event);
          setCallState(peerConnection.iceConnectionState);
          Logger(
            `${LOG_NS}-----------------iceconnectionstatechange---------------`
          );
        }
      );

      peerConnection.addEventListener('negotiationneeded', (event: any) => {
        // You can start the offer stages here.
        // Be careful as this event can be called multiple times.
        Logger(event);
        Logger(`${LOG_NS}----------negotiationneeded---------------`);
      });

      peerConnection.addEventListener('signalingstatechange', (event: any) => {
        switch (peerConnection.signalingState) {
          case 'closed':
            // You can handle the call being disconnected here.
            break;
          case 'stable':
            // You can handle the call being disconnected here.
            processCandidates(peerConnection, remoteCandidates);
            break;
        }
        setSignalingstatechange(peerConnection.signalingState);
        Logger(event);
        Logger(`${LOG_NS} ${peerConnection.signalingState}`);
        Logger(`${LOG_NS}-----------------signalingstatechange---------------`);
      });
    } else {
      Logger(`${LOG_NS}----------null---------peerconnection---------------`);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
