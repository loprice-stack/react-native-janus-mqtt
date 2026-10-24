import { createContext, useContext, useEffect, useState } from 'react';
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
import VideoRoomHandle from '../../node_modules/react-native-janus-mqtt/src/plugins/videoroom-plugin';
import {
  setRemoteJsep,
  setStreamTitle,
  setPrivateId,
  setFeed,
  setStreamRoom,
  setPubLocalStream,
  setSubRemoteStream,
  setPublishers,
  setParticipants,
  findSubRemoteStreamReserve,
  type SubscriptionsObject,
  setStreamRoomDisplay,
} from './conferenceSlice';
import {
  closePcPub,
  closePcSub,
  doOffer,
  doOfferAnswer,
  doOfferAnswerUpdate,
  saveReceivedJsepAnswer,
} from './videoroom-plugin-wbrtc';
import { useAppDispatch, useAppSelector } from '../store';
import { Connection } from '../../node_modules/react-native-janus-mqtt/src';
import type Session from '../../node_modules/react-native-janus-mqtt/src/session';
import { Logger } from '../../node_modules/react-native-janus-mqtt/src/utils';
import {
  ScrollView,
  View,
  Text,
  useWindowDimensions,
  Button,
  TextInput,
} from 'react-native';
import { pc_ } from './peercontext';

const LOG_NS = '[VideoRoom.ts]';
let connection: Connection;
let session: Session;
let handlePub: any;
let handleSub: any;
//let pcPub: RTCPeerConnection | null;
//let pcSub: RTCPeerConnection | null;

export default function Conference() {
  const { width, height } = useWindowDimensions();
  const {
    feed_,
    stream_title,
    stream_room,
    pub_localstream,
    stream_room_display,
    subscriptions,
  } = useAppSelector((state) => state.conference);
  const dispatch = useAppDispatch();
  const pc = useContext(pc_);
  const [pub_speaker, setPubSpeaker] = useState(null);
  const [pub_speaker_title, setPubSpeakerTitle] = useState('');

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

  async function createHandlePub() {
    session !== undefined
      ? await session.attach(VideoRoomHandle).then((handle) => {
          handlePub = handle;
          videoRoomPubEvents();
        })
      : Logger(`${LOG_NS} session undefined`);
  }

  async function createHandleSub() {
    session !== undefined
      ? (handleSub = await session.attach(VideoRoomHandle))
      : Logger(`${LOG_NS} session undefined`);
  }

  async function closeSession() {
    await closePubHandle();
    await closeSubHandle();
    if (session !== undefined) await session.destroy();
    //@ts-ignore
    session = undefined;
    dispatch(setPubLocalStream(null));
  }

  async function closePubHandle() {
    handlePub !== undefined
      ? await handlePub.hangup()
      : Logger(`${LOG_NS} handlePub undefined`);
    handlePub = undefined;
    dispatch(setPubLocalStream(null));
  }

  async function closeSubHandle() {
    handleSub !== undefined
      ? await handleSub.hangup()
      : Logger(`${LOG_NS} handleSub undefined`);
    handleSub = undefined;
    dispatch(setSubRemoteStream([]));
  }

  function isSessionDefined() {
    if (session !== undefined) {
      return true;
    } else {
      Logger(`${LOG_NS} session undefined`);
      return false;
    }
  }

  function isPubDefined() {
    if (handlePub !== undefined) {
      return true;
    } else {
      Logger(`${LOG_NS} handlePub undefined`);
      return false;
    }
  }

  function isSubDefined() {
    if (handleSub !== undefined) {
      return true;
    } else {
      Logger(`${LOG_NS} handlePub undefined`);
      return false;
    }
  }

  function createRoom() {
    if (isPubDefined()) {
      //Crete room
      handlePub
        .create({
          //@ts-ignore
          room: stream_room ? parseInt(stream_room) : undefined,
          description: stream_title,
          max_publishers: 6,
          permanent: false,
          is_private: false,
          secret: undefined,
          pin: undefined,
          admin_key: undefined,
          bitrate: 128000, // This is a low cap, increase if you want to use simulcast or SVC
          bitrate_cap: false,
          fir_freq: 10,
          audiocodec: 'opus',
          videocodec: 'vp8',
          talking_events: false,
          talking_level_threshold: 25,
          talking_packets_threshold: 100,
          require_pvtid: false,
          notify_joining: false,
          require_e2ee: false,
          record: false,
          rec_dir: '/opt/janus/share/janus/recordings/',
          videoorient: false,
          h264_profile: 'high',
          vp9_profile: 'high',
          threads: 2,
        })
        .then(async (res: any) => {
          dispatch(setStreamRoom(res.room));
          Logger(res);
          Logger(
            `${LOG_NS} ----------------------createRoom------success--------------------------------`
          );
        })
        .catch(async (err: any) => {
          //Even if the room is created arleady
          if (err.message.includes(stream_room)) {
          }
          Logger(err);
          Logger(
            `${LOG_NS} -----------------createRoom-----err----------------------------`
          );
        });
    }
  }

  async function joinPublishFeed() {
    //Publish your feed the handle is already joined in
    try {
      if (isPubDefined()) {
        //Create jsep offer
        const jsep = await doOffer(handlePub, pc);

        //Join and configure/publish your feed
        handlePub
          .joinConfigurePublisher({
            //@ts-ignore
            room: parseInt(stream_room),
            feed: undefined,
            audio: true,
            video: true,
            data: true,
            bitrate: 1280000,
            record: false,
            filename: '/opt/janus/share/janus/recordings/',
            display: stream_room_display,
            token: undefined,
            pin: undefined,
            e2ee: false,
            descriptions: '',
            jsep: jsep,
          })
          .then((res: any) => {
            const rjsp = res.jsep;
            if (rjsp) {
              dispatch(setRemoteJsep(rjsp));
              saveReceivedJsepAnswer(pc, rjsp);
              dispatch(setStreamTitle(res.description));
              dispatch(setPrivateId(res.private_id));
              dispatch(setFeed(res.feed));
              dispatch(setStreamRoom(res.room));
              //const streams: any = []
              // const pubs = res.publishers
              // if (pubs) {

              //    pubs.map((pub) => {

              //        streams.push({
              //            remotestream: undefined,
              //            feed: pub.feed,
              //            display: pub.display,
              //            room: pub.room
              //        })
              //    })
              //    dispatch(setPublishers(streams))
              //    conferenceContext.conference_subscriptions = streams
              //}
            }
            Logger(res);
            Logger(
              `${LOG_NS} --------------joinConfigurePublisher--------res----------------------------`
            );
          })
          .catch(async (err: any) => {
            if (
              err.message.includes(
                '425 Already in as a publisher on this handle'
              )
            ) {
              //Tear down handle and create another one
              if (isSessionDefined()) {
                await closeSession();
                createSession().then(async (r) => {
                  await createHandlePub();
                  joinPublishFeed();
                  await createHandleSub();
                });
              }

              //Publish your feed the handle is already joined in
              //handlePub.publish({ display: stream_room_display, jsep: jsep }).then((ress: any) => {
              // const rjsp = ress.jsep
              // if (rjsp) {
              //     dispatch(setRemoteJsep(rjsp))
              //     saveReceivedJsepAnswer(pc, rjsp)
              //     dispatch(setStreamTitle(ress.description))
              //     dispatch(setPrivateId(ress.private_id))
              //     dispatch(setFeed(ress.feed))
              //     dispatch(setStreamRoom(ress.room))

              //const streams: any = []
              //const pubs = ress.publishers
              //if (pubs) {
              //    pubs.map((pub) => {
              //        streams.push({ feed: pub.feed, display: pub.display })
              //    })
              //    dispatch(setPublishers(streams))
              //    conferenceContext.conference_subscriptions = streams
              //}
              // }
              // Logger(ress)
              // Logger(`${LOG_NS} ------------publish----------ress----------------------------`)
              //}).catch((errr: any) => {

              // if (errr.message.includes("490 Error setting ICE locally")) {
              //     Logger(`${LOG_NS} ----------------------490 Error setting ICE locally----------------------------`)

              //closePcPub(conferenceContext)
              //closePcSub(conferenceContext)
              //     dispatch(setPubLocalStream(null))
              //     dispatch(setSubRemoteStream([]))

              //     handlePub.hangup()

              //     handleSub.hangup()
              //     handlePub = null
              //     handleSub = null
              //     pc.pcPub = undefined
              //     pc = null
              //conferenceContext.conference_subscriptions = null
              //session = null
              // }

              // Logger(errr)
              // Logger(`${LOG_NS} ----------------publish------errr----------------------------`)
              //})
            } else if (err.message.includes('490 Error setting ICE locally')) {
              Logger(
                `${LOG_NS} ----------------------490 Error setting ICE locally----------------------------`
              );

              closePcPub(pc);
              closePcSub(pc);
              dispatch(setPubLocalStream(null));
              dispatch(setSubRemoteStream([]));
              closeSession();
            }
            Logger(err);
            Logger(
              `${LOG_NS} ---------------joinConfigurePublisher-------err----------------------------`
            );
          });
      }
    } catch (e) {
      Logger(e);
      Logger(
        `${LOG_NS} --------------------------catch-------------------------------------`
      );
    }
  }

  function leave() {
    if (isSessionDefined()) {
      isPubDefined()
        ? handlePub
            .leave()
            .then((res: any) => {
              closePcPub(pc);
              closePcSub(pc);
              dispatch(setPubLocalStream(null));
              dispatch(setSubRemoteStream([]));
              dispatch(setPublishers([]));

              closeSession();
              pc.subscriptions = [];

              Logger(res);
              Logger(
                `${LOG_NS} ------------------------goodbye--------------------------------------`
              );
            })
            .catch((error: any) => {
              closePcPub(pc);
              closePcSub(pc);
              dispatch(setPubLocalStream(null));
              dispatch(setSubRemoteStream([]));
              dispatch(setPublishers([]));

              closeSession();

              Logger(error);
              Logger(
                `${LOG_NS} ------------------------goodbye------error--------------------------------`
              );
            })
        : Logger(`${LOG_NS} handlePub undefined`);
    }
  }

  function joinSubscribeSubscriber() {
    if (isSubDefined()) {
      dispatch(setSubRemoteStream([]));

      handleSub
        .joinSubscriber({
          //@ts-ignore
          room: parseInt(stream_room),
          feed: undefined, //deprecated
          audio: true, //deprecated
          video: true, //deprecated
          data: true, //deprecated
          offer_audio: true, //deprecated
          offer_video: true, //deprecated
          offer_data: true, //deprecated
          private_id: undefined,
          sc_substream_layer: undefined,
          sc_substream_fallback_ms: 2,
          sc_temporal_layers: undefined,
          streams: subscriptions,
          autoupdate: true,
          use_msid: false,
          token: undefined,
          pin: undefined,
        })
        .then(async (res: any) => {
          const jsepp = res.jsep;
          if (jsepp) {
            dispatch(setRemoteJsep(jsepp));
            const jsep_a = await doOfferAnswer(handleSub, pc, jsepp);
            handleSub.start({ jsep: jsep_a }).then((response: any) => {
              Logger(response);
            });
          }

          Logger(res);
          Logger(
            `${LOG_NS} ------------------------joinSubscriber-----------------------------`
          );
        })
        .catch(async (err: any) => {
          if (
            err.message.includes(
              '425 Already in as a subscriber on this handle'
            )
          ) {
            //Tear down handle and create  and subscribe to another one
            if (isSessionDefined()) {
              if (isSubDefined()) {
                await closePcSub(pc);
                await closeSubHandle();
                await createHandleSub();
                joinSubscribeSubscriber();
              }
            }

            //handleSub.update({ subscribe: subscriptions }).then(async (ress: any) => {
            //    const jsepp = ress.jsep
            //    if (jsepp) {
            //        dispatch(setRemoteJsep(jsepp))

            //        dispatch(setSubRemoteStream([]))
            //        const jsep_a = await doOfferAnswer(handleSub, pc, jsepp)
            //        handleSub.start({ jsep: jsep_a }).then((response: any) => {
            //            Logger(response)
            //        })
            //    }
            //    Logger(ress)
            //    Logger(`${LOG_NS} ------------------------subscribeSubscriber-----------------------------`)
            //}).catch((err: any) => {
            //    Logger(err)
            //    Logger(`${LOG_NS} -------------------subscribeSubscriber--------err-----------------------------`)
            //})
          } else if (
            err.message.includes('429 Missing mandatory element (feed)')
          ) {
          }
          Logger(subscriptions);
          Logger(err.message);
          Logger(
            `${LOG_NS} -------------------joinSubscribeSubscriber----err--------------------------------`
          );
        });
    }
  }

  async function joinSubscribeSubscriberRefresh() {
    if (isSessionDefined()) {
      if (isSubDefined()) {
        closePcSub(pc);
        dispatch(setSubRemoteStream([]));

        await closeSubHandle();
        await createHandleSub();

        handleSub
          .joinSubscriber({ room: stream_room, streams: subscriptions })
          .then(async (res: any) => {
            const jsepp = res.jsep;
            if (jsepp) {
              dispatch(setRemoteJsep(jsepp));
              const jsep_a = await doOfferAnswer(handleSub, pc, jsepp);
              handleSub.start({ jsep: jsep_a }).then((response: any) => {
                Logger(response);
              });
            }
            Logger(res);
            Logger(
              `${LOG_NS} ------------------------joinSubscriber-----------------------------`
            );
          })
          .catch((err: any) => {
            if (
              err.message.includes(
                '425 Already in as a subscriber on this handle'
              )
            ) {
              handleSub
                .update({ subscribe: subscriptions })
                .then(async (ress: any) => {
                  const jsepp = ress.jsep;
                  if (jsepp) {
                    dispatch(setRemoteJsep(jsepp));

                    closePcSub(pc);
                    dispatch(setSubRemoteStream([]));
                    const jsep_a = await doOfferAnswer(handleSub, pc, jsepp);
                    handleSub.start({ jsep: jsep_a }).then((response: any) => {
                      Logger(response);
                    });
                  }
                  Logger(ress);
                  Logger(
                    `${LOG_NS} ------------------------subscribeSubscriber-----------------------------`
                  );
                })
                .catch((err: any) => {
                  Logger(err);
                  Logger(
                    `${LOG_NS} -------------------subscribeSubscriber--------err-----------------------------`
                  );
                });
            } else if (
              err.message.includes('429 Missing mandatory element (feed)')
            ) {
            }
            Logger(err.message);
            Logger(
              `${LOG_NS} -------------------joinSubscribeSubscriber----err--------------------------------`
            );
          });
      }
    }
  }

  function unPublishFeed() {
    //Publish your feed

    if (isPubDefined()) {
      handlePub
        .unpublish()
        .then((res: any) => {
          closePcPub(pc);
          closePcSub(pc);
          dispatch(setPubLocalStream(null));
        })
        .catch((error: any) => {
          closePcPub(pc);
          closePcSub(pc);
          dispatch(setPubLocalStream(null));
        });
    }
  }

  function list() {
    if (isPubDefined()) {
      handlePub.listParticipants({ room: stream_room }).then((lst: any) => {
        const streams: any = [];
        const pubs = lst.participants;
        const room = lst.room;
        if (pubs) {
          pubs.map((pub: any) => {
            if (pub.publisher) {
              streams.push({
                remotestream: undefined,
                feed: pub.feed,
                display: pub.display,
                room: room,
              });
            }
          });
          dispatch(setPublishers(streams));
          dispatch(setParticipants(streams));
          pc.subscriptions = streams;
        }
        Logger(lst);
        Logger(
          `${LOG_NS} ---------------------------listParticipants--------------------------------------------`
        );
      });
    }
  }

  function subscribeToNewFeed(streams: any) {
    handleSub
      .subscribe({ streams: streams })
      .then(async (ress: any) => {
        const jsepp = ress.jsep;
        if (jsepp) {
          dispatch(setRemoteJsep(jsepp));
          dispatch(setSubRemoteStream([]));
          closePcSub(pc);
          const jsep_a = await doOfferAnswerUpdate(handleSub, jsepp);
          handleSub
            .start({ jsep: jsep_a })
            .then((response: any) => {
              Logger(response);
              Logger(
                `${LOG_NS} ---------------------------start--response---------------------------------------`
              );
            })
            .catch((err: any) => {
              Logger(err);
              Logger(
                `${LOG_NS} -------------------start--------err-----------------------------`
              );
            });
        } else {
          const feed = ress.feed;
          dispatch(findSubRemoteStreamReserve(feed));
          Logger(
            `${LOG_NS} -----------------------no--jsep-------------------------`
          );
        }

        Logger(ress);
        Logger(
          `${LOG_NS} ------------------new--feed------subscribeToNewFeed-----------------------------`
        );
      })
      .catch((err: any) => {
        Logger(err);
        Logger(
          `${LOG_NS} -------------------subscribeToNewFeed--------err-----------------------------`
        );
      });
  }

  function unSubscribe() {
    if (isSubDefined()) {
      Logger(subscriptions);
      Logger(
        `${LOG_NS} ------------------unSubscribed-----------------------------`
      );

      let unsubscribe = [];
      subscriptions.map((uns: any) => {
        unsubscribe.push({ feed: uns.feed });
      });

      handleSub
        .update({ subscribe: undefined, unsubscribe: subscriptions })
        .then(async (ress: any) => {
          dispatch(setPublishers([]));
          dispatch(setSubRemoteStream([]));
          dispatch(setPubLocalStream(null));
          Logger(ress);
          Logger(
            `${LOG_NS} ------------------unSubscribed-----------------------------`
          );
        })
        .catch((err: any) => {
          Logger(err);
          Logger(
            `${LOG_NS} -------------------unSubscribe--------err-----------------------------`
          );
        });
    }
  }

  return (
    <View style={{ width: '100%', flex: 1 }}>
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            margin: 8,
            width: width < 800 ? '100%' : '100%',
            flexDirection: 'column',
            height: height,
          }}
        >
          <View
            style={{
              flexDirection: width < 800 ? 'column' : 'row',
              backgroundColor: '#6dbe8c',
              width: width < 800 ? '98%' : '99%',
              marginBottom: 2,
              marginEnd: 80,
              display: width < 600 ? 'flex' : 'flex',
            }}
          >
            <View
              style={{
                marginLeft: 4,
                gap: 2,
              }}
            >
              <Text>Room</Text>{' '}
              <TextInput
                style={{
                  height: 30,
                  marginBottom: 4,
                  maxWidth: 200,
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: 'white',
                }}
                onChangeText={(text) => {
                  dispatch(setStreamRoom(text));
                }}
                //@ts-ignore
                value={stream_room}
                placeholder="Room number (optional)"
              />
            </View>
            <View
              style={{
                marginLeft: 4,
                gap: 2,
              }}
            >
              <Text>Publisher name</Text>{' '}
              <TextInput
                style={{
                  height: 30,
                  marginBottom: 4,
                  maxWidth: 200,
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: 'white',
                }}
                onChangeText={(text) => {
                  dispatch(setStreamRoomDisplay(text));
                }}
                value={stream_room_display}
                placeholder="Your display name"
              />
            </View>
            <View
              style={{
                marginLeft: 4,
                gap: 2,
              }}
            >
              <Text>Room description</Text>{' '}
              <TextInput
                style={{
                  height: 30,
                  marginBottom: 4,
                  maxWidth: 300,
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: 'white',
                }}
                onChangeText={(text) => {
                  dispatch(setStreamTitle(text));
                }}
                value={stream_title}
                placeholder="eg. Conference room"
              />
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              height: '92%',
              display: width < 600 ? 'flex' : 'flex',
            }}
          >
            <ScrollView
              showsHorizontalScrollIndicator={true}
              style={{ maxWidth: width < 800 ? 100 : 200 }}
            >
              {pub_localstream && (
                <View
                  onClick={() => {
                    setPubSpeakerTitle(stream_room_display);
                    setPubSpeaker(pub_localstream);
                  }}
                  style={{
                    cursor: 'pointer',
                    flexDirection: 'column',
                    alignSelf: 'center',
                  }}
                >
                  <RTCView
                    style={{
                      width: width < 800 ? 200 : 300,
                      height: width < 800 ? 100 : 200,
                    }}
                    mirror={true}
                    objectFit={'cover'}
                    stream={pub_localstream}
                    zOrder={10}
                  />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      maxWidth: width < 800 ? 180 : 280,
                      position: 'absolute',
                      alignSelf: 'center',
                      marginTop: width < 800 ? 75 : 170,
                      backgroundColor: 'white',
                      padding: 2,
                    }}
                  >
                    {stream_room_display}
                  </Text>
                </View>
              )}
              {subscriptions.map((substreams: SubscriptionsObject) => {
                return substreams.remotestream ? (
                  <View
                    onClick={() => {
                      setPubSpeakerTitle(substreams.display);
                      setPubSpeaker(substreams.remotestream);
                    }}
                    style={{
                      cursor: 'pointer',
                      flexDirection: 'column',
                      alignSelf: 'center',
                    }}
                  >
                    <RTCView
                      style={{
                        width: width < 800 ? 200 : 300,
                        height: width < 800 ? 100 : 200,
                      }}
                      mirror={true}
                      objectFit={'cover'}
                      stream={substreams.remotestream}
                      zOrder={10}
                    />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        maxWidth: width < 800 ? 180 : 280,
                        position: 'absolute',
                        alignSelf: 'center',
                        marginTop: width < 800 ? 75 : 170,
                        backgroundColor: 'white',
                        padding: 2,
                      }}
                    >
                      {substreams.display}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'column' }}>
                    <View
                      style={{
                        height: 150,
                        width: 200,
                        backgroundColor: 'black',
                      }}
                    >
                      <Text>Place holder</Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        maxWidth: width < 800 ? 180 : 280,
                        position: 'absolute',
                        alignSelf: 'center',
                        marginTop: width < 800 ? 75 : 170,
                        backgroundColor: 'white',
                        padding: 2,
                      }}
                    >
                      {substreams.display}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <>
              <RTCView
                style={{
                  width: '85%',
                  height: width < 800 ? '70%' : '90%',
                  backgroundColor: pub_speaker ? 'black' : undefined,
                  flexDirection: 'column',
                }}
                mirror={true}
                objectFit={'cover'}
                stream={pub_speaker}
                zOrder={10}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  maxWidth: width < 800 ? 280 : 280,
                  position: 'absolute',
                  marginStart: width < 800 ? 120 : 220,
                  marginTop: width < 800 ? height - 270 : height - 150,
                  backgroundColor: 'white',
                  padding: 2,
                }}
              >
                {pub_speaker_title}
              </Text>
            </>
          </View>

          <View
            style={{
              flex: 1,
              alignItems: 'center',
              marginBottom: 8,
              position: 'absolute',
              bottom: 0,
              zIndex: 100,
              alignSelf: 'center',
            }}
          >
            <View
              style={{
                flexDirection: width < 800 ? 'column' : 'row',
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Button onPress={() => janusMqttConect()} title="Connect" />

                <Button
                  onPress={() => createSession()}
                  title="Create session"
                />
                <Button
                  onPress={() => closeSession()}
                  title="Destroy session"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Button onPress={() => createHandlePub()} title="Pub handle" />

                <Button onPress={() => createHandleSub()} title="Sub handle" />
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Button onPress={() => createRoom()} title="Create room" />
                <Button onPress={() => joinPublishFeed()} title="Publish" />
                <Button onPress={() => unPublishFeed()} title="Unpublish" />
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Button onPress={() => list()} title="Feeds" />

                <Button
                  onPress={() => joinSubscribeSubscriber()}
                  title="Subscribe"
                />

                <Button onPress={() => unSubscribe()} title="Unsubscribe" />

                <Button onPress={() => leave()} title="Leave" />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  function videoRoomPubEvents() {
    try {
      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_UPDATED,
        (evtdata: any) => {
          //const streams = {feed: evtdata.publisters[0].feed}
          //subscribeToNewFeed(streams)
          //const jsepp = evtdata.jsep
          //subscribeToNewFeedStart(jsepp)
          //dispatch(setRemoteJsep(jsepp))
          Logger(
            `${LOG_NS} VideoRoomHandle", '-----------updated--------', evtdata`
          );
        }
      );

      // custom videoroom publisher/manager events

      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_DESTROYED,
        (evtdata: any) => {
          Logger(`${LOG_NS} VideoRoomHandle", 'destroyed', evtdata`);
        }
      );

      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_PUB_LIST,
        (evtdata: any) => {
          //subscribeToNewFeed([{ feed: evtdata.publishers[0].feed }])
          Logger(`${LOG_NS} VideoRoomHandle", 'feed-list', evtdata`);
        }
      );

      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_PUB_PEER_JOINED,
        (evtdata: any) => {
          //subscribe({ vrh_sub: videoRoomContext.vrh_sub, streams: [{ feed: evtdata.feed }] })

          Logger(`${LOG_NS} VideoRoomHandle", 'feed-joined', evtdata`);
        }
      );

      handlePub.on(
        VideoRoomHandle.EVENT.VIDEOROOM_UNPUBLISHED,
        (evtdata: any) => {
          //unsubscribe({ vrh_sub: videoRoomContext.vrh_sub, streams : [{ feed: evtdata.feed }] })

          Logger(`${LOG_NS} VideoRoomHandle: 'unpublished'`);
        }
      );

      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_LEAVING,
        async (evtdata: any) => {
          //if (pubHandle.feed === evtdata.feed) {
          //    await msHandles.detachPubHandle();
          //}
          Logger(`${LOG_NS} VideoRoomHandle: 'leaving'`);
        }
      );

      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_DISPLAY,
        (evtdata: any) => {
          Logger(`${LOG_NS} VideoRoomHandle:  'display'`);
        }
      );

      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_TALKING,
        (evtdata: any) => {
          Logger(`${LOG_NS} VideoRoomHandle: talking`);
        }
      );

      handlePub.once(
        VideoRoomHandle.EVENT.VIDEOROOM_KICKED,
        async (evtdata: any) => {
          Logger(`${LOG_NS} VideoRoomHandle", 'kicked', evtdata`);
        }
      );
    } catch (e) {
      Logger(e);
    }
  }
}
