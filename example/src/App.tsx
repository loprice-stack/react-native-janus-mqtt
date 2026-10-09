import { Text, View, StyleSheet, Button, TextInput } from 'react-native';
import { Connection } from 'react-native-janus-mqtt';
import { Logger } from '../../src/utils';
import type Session from '../../src/session';
import videocallPlugin from '../../src/plugins/videocall-plugin';
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

const LOG_NS = '[App.ts]';
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
    handle = await session.attach(videocallPlugin);
  }

  async function register() {
    handle.register(username);
    await pcListerners();
  }

  async function startCall() {
    try {
      await pcListerners();
      await setMediaStream(pc);
      const jsep = await createOffer(pc);
      console.log('--------setting----all-------listerner------------');
      //@ts-ignore
      handle.call(caller, jsep);
    } catch (err) {
      console.log(err);
      console.log('Error starting a call');
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
      //@ts-ignore
      handle.accept(jsep);
    } catch (err) {
      console.log(err);
      console.log('Error answering a call');
    }
  }

  async function hangupCall() {
    try {
      //@ts-ignore
      await handle.hangup();
      //stopAllStreams();
      //closePeerConnection(pc)
      console.log('Hangup successfully');
    } catch (err) {
      console.log(err);
      //close anyway
      //stopAllStreams();
      //closePeerConnection(pc)
      console.log('Error closing a call');
    }
  }

  async function hangupCallRemote() {
    try {
      //@ts-ignore
      setLocalstream(null);
      console.log(' Local stream closed ');
      //@ts-ignore
      setRemotestream(null);
      console.log(' Remote stream closed ');
      //closePeerConnection(pc)
      console.log('We Hanguped successfully');
    } catch (err) {
      console.log(err);
      //close anyway
      //@ts-ignore
      setLocalstream(null);
      console.log(' Local stream closed ');
      //@ts-ignore
      setRemotestream(null);
      console.log(' Remote stream closed ');
      //closePeerConnection(pc)
      console.log('Error hanguped a call');
    }
  }

  function processCandidates(peerConnection: any, remoteCandidates: any) {
    if (remoteCandidates.length < 1) {
      return;
    }
    remoteCandidates.map((candidate: any) => {
      peerConnection.addIceCandidate(candidate);
      console.log(candidate);
      console.log(
        '---------------------saving--saved--remote---candidate-------------------------'
      );
    });
    console.log(remoteCandidates);
    console.log(
      '---------------------clearing--remote---candidate----list---------------------'
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
      console.log(' Got offer jsep ');
      return offerDescription;
    } catch (err) {
      console.log('Error creating offer' + err);
    }
  }

  async function createOfferAnser(peerConnection: any, r_jsep: any) {
    try {
      if (r_jsep.lenght !== 0) {
        const offerDescription = new RTCSessionDescription(r_jsep);
        await peerConnection.setRemoteDescription(offerDescription);
        const answerDescription = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answerDescription);
        console.log(' Got answer jsep ');
        return answerDescription;
      } else {
        console.log('No offer jsep is found');
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function saveReceivedJsepAnswer(peerConnection: any, r_jsep: any) {
    try {
      // Use the received receivedAnswerDescription
      const receivedAnswerDescription = new RTCSessionDescription(r_jsep);
      console.log('Answer description object is ok');
      console.log(peerConnection.signalingState);
      console.log('-----------------signalingstatechange---------------');
      await peerConnection.setRemoteDescription(receivedAnswerDescription);
      console.log(' Saved answer jsep ');
    } catch (err) {
      console.log(err);
      console.log(
        '---------------------------------answer---jse----error-----------------------'
      );
    }
  }

  async function setMediaStream(peerConnection: any) {
    try {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          frameRate: 30,
        },
      });

      setLocalstream(mediaStream);
      mediaStream.getTracks().forEach(
        //@ts-ignore
        (track) => peerConnection.addTrack(track, mediaStream)
      );
    } catch (err) {
      console.log(err);
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
          value={username}
          onChangeText={(text) => {
            setUserName(text);
          }}
        />
      </View>
      <TextInput
        id="cnm"
        value={caller}
        onChangeText={(text) => {
          setCaller(text);
        }}
      />

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
            callstate == 'incoming' ||
            callstate == 'calling' ||
            callstate == 'connecting' ||
            callstate == 'connected' ||
            callstate == 'accepted'
              ? 'Hangup'
              : 'Call'
          }
          color={
            callstate == 'incoming' ||
            callstate == 'calling' ||
            callstate == 'connecting' ||
            callstate == 'connected' ||
            callstate == 'accepted'
              ? 'red'
              : 'green'
          }
          onPress={
            //"call" | "calling" | "incoming" | "hangup" | "iddle" | "connected" | "accepted"
            () => {
              callstate == 'incoming' ||
              callstate == 'calling' ||
              callstate == 'connecting' ||
              callstate == 'connected' ||
              callstate == 'accepted'
                ? hangupCall()
                : startCall();
            }
          }
        />
        <Button
          title="Incomming"
          disabled={callstate == 'incoming' ? false : true}
          onPress={() => acceptCall()}
        />
      </View>
    </View>
  );

  function eventCalling(vch: any) {
    vch.once(videocallPlugin.EVENT.VIDEOCALL_CALLING, (evtdata: any) => {
      setCallState('calling');
      console.log(evtdata);
      console.log(
        '-------------------------calling--------------------------------'
      );
    });
  }

  function eventIcomming(vch: any) {
    vch.once(videocallPlugin.EVENT.VIDEOCALL_INCOMMING, (evtdata: any) => {
      setCallState('incoming');
      const jsep = evtdata.jsep;
      setRemoteSdp(jsep);
      console.log(
        '-------------------------icomming--call------------------------------'
      );
    });
  }

  function eventTricle(vch: any) {
    let remoCandidates = [];
    vch.on(videocallPlugin.EVENT.VIDEOCALL_TRICKLE, (evtdata: any) => {
      if (
        signalingstatechange == 'have-local-offer' ||
        signalingstatechange == 'stable'
      ) {
        const completed = evtdata.complete;
        if (completed) {
          //@ts-ignore
          remoCandidates.push(null);
          //@ts-ignore
          setRemoteCandidates(remoCandidates);
          console.log(remoteCandidates);
          console.log(
            '------------------null--------list------------------------------------'
          );
        } else {
          const iceCandidate = new RTCIceCandidate(evtdata);
          //@ts-ignore
          remoCandidates.push(iceCandidate);
          console.log(remoteCandidates);
          console.log(
            '--------------------------list------------------------------------'
          );
        }
      }
    });
  }

  function eventAccepted(vch: any) {
    vch.once(videocallPlugin.EVENT.VIDEOCALL_ACCEPTED, (evtdata: any) => {
      const jsep = evtdata.jsep;
      saveReceivedJsepAnswer(pc, jsep);
      console.log(
        '-------------------------accepted--------------------------------'
      );
    });
  }

  function eventHangup(vch: any) {
    vch.once(videocallPlugin.EVENT.VIDEOCALL_HANGUP, (evtdata: any) => {
      const reason = evtdata.result.reason;
      const username = evtdata.result.username;
      console.log(reason);
      console.log(username);
      setCallState('hangup');
      hangupCallRemote();
      console.log(
        '-------------------------hangupCallRemote--------------------------------'
      );
    });
  }

  function eventDetached(vch: any) {
    vch.once(videocallPlugin.EVENT.VIDEOCALL_DETACHED, (evtdata: any) => {
      setCallState('hangup');
      console.log(evtdata);
      handle = null;
      console.log('--------videocall--handle---detached----------');
    });
  }

  //This was attempt on call update when you want
  // to swiitch face camera from user to environment
  //while the call is in connected state
  function eventUpdate(vch: any) {
    vch.once(videocallPlugin.EVENT.VIDEOCALL_UPDATE, (evtdata: any) => {
      const jsep = evtdata.jsep;
      if (jsep) {
        if (jsep.type == 'offer') {
          console.log(
            '-------------videocall--handle---update--we-received--offer-----------'
          );
        } else if (jsep.type == 'answer') {
          saveReceivedJsepAnswer(pc, jsep);
        }
      }
      console.log('-------------videocall--handle---update--------------');
    });
  }

  function handleCallOnstart(peerConnection: any, vch: any) {
    if (peerConnection !== null) {
      peerConnection.addEventListener('track', (event: any) => {
        setRemotestream(event.streams[0]);

        console.log(
          '----------------------track----remote-----------------------------'
        );
      });

      peerConnection.addEventListener('connectionstatechange', (event: any) => {
        switch (peerConnection.connectionState) {
          case 'closed':
            // You can handle the call being disconnected here.
            break;
        }
        setCallState(peerConnection.connectionState);
        console.log(event);
        console.log(peerConnection.connectionState);
        console.log('-----------------connectionstatechange---------------');
      });

      peerConnection.addEventListener('icecandidate', (event: any) => {
        // When you find a null candidate then there are no more candidates.
        // Gathering of candidates has finished.
        try {
          const candidate = {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          };
          vch.tricklee(candidate);
          console.log(candidate);
          // Send the event.candidate onto the person you're calling.
          // Keeping to Trickle ICE Standards, you should send the candidates immediately.
        } catch (null_candidate) {
          vch.trickleeComplete();
          console.log(null_candidate);
        }
        console.log(
          '----------------------icecandidate----stufF---------------'
        );
      });

      peerConnection.addEventListener('icecandidateerror', (event: any) => {
        // You can ignore some candidate errors.
        // Connections can still be made even when errors occur.
        console.log(event);
        console.log(
          '----------------------icecandidateerror----stufF---------------'
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
          console.log(peerConnection.iceConnectionState);
          console.log(event);
          console.log(
            '-----------------iceconnectionstatechange---------------'
          );
        }
      );

      peerConnection.addEventListener('negotiationneeded', (event: any) => {
        // You can start the offer stages here.
        // Be careful as this event can be called multiple times.
        console.log(event);
        console.log('----------negotiationneeded---------------');
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
        console.log(event);
        console.log(peerConnection.signalingState);
        console.log('-----------------signalingstatechange---------------');
      });
    } else {
      console.log('----------null---------peerconnection---------------');
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
});
