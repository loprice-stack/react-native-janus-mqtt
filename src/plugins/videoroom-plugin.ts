import Handle from './../handle';
import type Session from './../session';

/* The plugin ID exported in the plugin descriptor */
const PLUGIN_ID = 'janus.plugin.videoroom';

/* These are the requests defined for the Janus VideoRoom API */
const REQUEST_JOIN = 'join';
const REQUEST_CONFIGURE = 'configure';
const REQUEST_JOIN_CONFIGURE = 'joinandconfigure';
const REQUEST_LIST_PARTICIPANTS = 'listparticipants';
const REQUEST_ENABLE_RECORDING = 'enable_recording';
const REQUEST_KICK = 'kick';
const REQUEST_MODERATE = 'moderate';
const REQUEST_START = 'start';
const REQUEST_PAUSE = 'pause';
const REQUEST_SWITCH = 'switch';
const REQUEST_PUBLISH = 'publish';
const REQUEST_UNPUBLISH = 'unpublish';
const REQUEST_LEAVE = 'leave';
const REQUEST_UPDATE = 'update';

const REQUEST_EXISTS = 'exists';
const REQUEST_LIST_ROOMS = 'list';
const REQUEST_CREATE = 'create';
const REQUEST_DESTROY = 'destroy';
const REQUEST_ALLOW = 'allowed';

const REQUEST_RTP_FWD_START = 'rtp_forward';
const REQUEST_RTP_FWD_STOP = 'stop_rtp_forward';
const REQUEST_RTP_FWD_LIST = 'listforwarders';

const PTYPE_PUBLISHER = 'publisher';
const PTYPE_LISTENER = 'subscriber';

/* These are the events/responses that the VideoRoom plugin will manage */
/* Some of them will be exported in the plugin descriptor */
const PLUGIN_EVENT = {
  PUB_JOINED: 'videoroom_joined',
  SUB_JOINED: 'videoroom_subscribed',
  PUB_LIST: 'videoroom_publisher_list',
  PARTICIPANTS_LIST: 'videoroom_participants_list',
  PUB_PEER_JOINED: 'videoroom_publisher_joined',
  STARTED: 'videoroom_started',
  PAUSED: 'videoroom_paused',
  SWITCHED: 'videoroom_switched',
  CONFIGURED: 'videoroom_configured',
  SLOW_LINK: 'videoroom_slowlink',
  DISPLAY: 'videoroom_display',
  UNPUBLISHED: 'videoroom_unpublished',
  LEAVING: 'videoroom_leaving',
  UPDATED: 'videoroom_updated',
  KICKED: 'videoroom_kicked',
  MODERATED: 'videoroom_moderated',
  RECORDING_ENABLED_STATE: 'videoroom_recording_enabled_state',
  TALKING: 'videoroom_talking',
  SC_SUBSTREAM_LAYER: 'videoroom_sc_substream_layer',
  SC_TEMPORAL_LAYERS: 'videoroom_sc_temporal_layers',
  ALLOWED: 'videoroom_allowed',
  EXISTS: 'videoroom_exists',
  ROOMS_LIST: 'videoroom_list',
  CREATED: 'videoroom_created',
  DESTROYED: 'videoroom_destroyed',
  RTP_FWD_STARTED: 'videoroom_rtp_fwd_started',
  RTP_FWD_STOPPED: 'videoroom_rtp_fwd_stopped',
  RTP_FWD_LIST: 'videoroom_rtp_fwd_list',
  SUCCESS: 'videoroom_success',
  ERROR: 'videoroom_error',
  TRICKLE: 'videoroom_trickle',
};

export type StopRtpForwarder = {
  room: number | string;
  feed: number | string;
  stream: number | string;
  secret: string;
  admin_key: string;
};

export type StartForward = {
  room: number | string;
  feed: number | string;
  host: string;
  streams: [];
  audio_port: number;
  audio_rtcp_port: number;
  audio_ssrc: number;
  video_port: number;
  video_rtcp_port: number;
  video_ssrc: number;
  video_port_2: number;
  video_ssrc_2: number;
  video_port_3: number;
  video_ssrc_3: number;
  data_port: number;
  secret: string;
  admin_key: string;
};

export type Allow = {
  room: number | string;
  action: 'enable' | 'disable' | 'add' | 'remove';
  list: string[];
  secret: string;
};

export type Destroy = {
  room: number | string;
  permanent: boolean;
  secret: string;
};

export type CreateNewRoom = {
  room: number | string;
  description: string;
  max_publishers: number;
  permanent: boolean;
  is_private: boolean;
  secret: string | undefined;
  pin: string | undefined;
  admin_key: string | undefined;
  bitrate: number;
  bitrate_cap: boolean;
  fir_freq: number;
  audiocodec: string;
  videocodec: string;
  talking_events: boolean;
  talking_level_threshold: number;
  talking_packets_threshold: number;
  require_pvtid: boolean;
  notify_joining: boolean;
  require_e2ee: boolean;
  record: boolean;
  rec_dir: string;
  videoorient: boolean;
  h264_profile: string;
  vp9_profile: string;
  threads: number;
};

export type Moderate = {
  room: number | string;
  feed: string;
  mID: string;
  mute: boolean;
  secret: string;
};

export type Kick = {
  room: number | string;
  feed: string;
  secret: string;
};

export type EnableRecording = {
  room: number | string;
  secret: string;
  record: boolean;
};

export type ListParticipants = {
  room: number | string;
  secret: string;
};

export type Update = {
  subscribe: [];
  unsubscribe: [];
};

export type SwitchFeed = {
  to_feed: number | string;
  audio: boolean;
  video: boolean;
  data: boolean;
  streams: [];
};

export type StartStream = {
  jsep: any;
  e2ee: boolean;
};

export type joinSubscriber = {
  room: number | string;
  feed: number | string | undefined;
  audio: boolean;
  video: boolean;
  data: boolean;
  offer_audio: boolean;
  offer_video: boolean;
  offer_data: boolean;
  private_id: number | undefined;
  sc_substream_layer: number | undefined;
  sc_substream_fallback_ms: number;
  sc_temporal_layers: number | undefined;
  streams: [];
  autoupdate: boolean;
  use_msid: boolean;
  token: string | undefined;
  pin: string | undefined;
};

export type PublishFeed = {
  audio: boolean;
  video: boolean;
  data: boolean;
  bitrate: number;
  record: boolean;
  filename: string;
  display: string;
  descriptions: [];
  e2ee: boolean;
  jsep: any;
};

export type ConfigurePubOrSubHandle = {
  audio: boolean;
  video: boolean;
  data: boolean;
  bitrate: number;
  record: boolean;
  filename: string;
  display: string;
  restart: boolean;
  update: boolean;
  streams: [];
  descriptions: [];
  sc_substream_layer: number;
  sc_substream_fallback_ms: number;
  sc_temporal_layers: number;
  e2ee: boolean;
  jsep: any;
  keyframe: boolean;
};

export type JoinConfigurePublisherHandle = {
  room: number | string;
  feed: number | string | undefined;
  audio: boolean;
  video: boolean;
  data: boolean;
  bitrate: number;
  record: boolean;
  filename: string;
  display: string;
  token: string | undefined;
  pin: string | undefined;
  e2ee: boolean;
  descriptions: [];
  jsep: any;
};

/**
 * The class implementing the VideoRoom plugin (ref. { https://janus.conf.meetecho.com/docs/videoroom.html}).<br>
 *
 * It extends the base JanusMqtt Handle class and overrides the "handleMessage" method.<br>
 *
 * Moreover it defines many methods to support VideoRoom operations.<br>
 *
 */
class VideoRoomHandle extends Handle {
  feed: number | string | null;

  streams: [] | null;

  room: number | string | null;
  /**
   * Create a JanusMqtt VideoRoom handle.
   */
  constructor(session: Session, id: number) {
    super(session, id);

    /**
     * Either the feed identifier assigned to this publisher handle or the publisher's feed in case this handle is a subscriber.
     */
    this.feed = null;

    /**
     * [multistream]
     * Either the streams assigned to this publisher handle or the streams subscribed to in case this handle is a subscriber.
     *
     */
    this.streams = null;

    /**
     * The identifier of the videoroom the handle has joined.
     *
     */
    this.room = null;
  }

  /**
   * The custom "handleMessage" needed for handling VideoRoom messages.
   *
   * returns A falsy value for unhandled events, a truthy value for handled events
   */
  _handleMessage(janus_message: any) {
    const { plugindata, transaction } = janus_message;
    if (plugindata && plugindata.data && plugindata.data.videoroom) {
      const message_data = plugindata.data;
      const { videoroom, error, error_code, room } = message_data;

      /* Prepare an object for the output JanusMqtt event */
      const janusmqtt_event = this._newPluginEvent(janus_message);

      /* Add room information if available */
      if (room) janusmqtt_event.data.room = room;

      /* The plugin will emit an event only if the handle does not own the transaction */
      /* That means that a transaction has already been closed or this is an async event */
      const emit = this.ownsTransaction(transaction) === false;

      switch (videoroom) {
        /* Success response */
        case 'success':
          /* Room exists API */
          if (typeof message_data.exists !== 'undefined') {
            janusmqtt_event.data.exists = message_data.exists;
            janusmqtt_event.event = PLUGIN_EVENT.EXISTS;
            break;
          }
          /* Room list API */
          if (typeof message_data.list !== 'undefined') {
            janusmqtt_event.data.list = message_data.list;
            janusmqtt_event.event = PLUGIN_EVENT.ROOMS_LIST;
            break;
          }
          /* Tokens management (add/remove/enable) */
          if (typeof message_data.allowed !== 'undefined') {
            janusmqtt_event.data.list = message_data.allowed;
            janusmqtt_event.event = PLUGIN_EVENT.ALLOWED;
            break;
          }
          /* Global recording enabled or disabled */
          if (typeof message_data.record !== 'undefined') {
            janusmqtt_event.data.record = message_data.record;
            janusmqtt_event.event = PLUGIN_EVENT.RECORDING_ENABLED_STATE;
            break;
          }

          /* Generic success event */
          janusmqtt_event.event = PLUGIN_EVENT.SUCCESS;
          break;

        /* Publisher joined */
        case 'joined':
          /* Store room and feed id */
          this.room = room;
          this.feed = message_data.id;

          janusmqtt_event.data.feed = message_data.id;
          janusmqtt_event.data.description = message_data.description;
          janusmqtt_event.data.private_id = message_data.private_id;
          janusmqtt_event.data.publishers = message_data.publishers.map(
            ({
              id,
              display,
              talking,
              audio_codec,
              video_codec,
              simulcast,
              streams,
            }: any) => {
              const pub: any = {
                feed: id,
                display,
              };
              if (typeof talking !== 'undefined') pub.talking = talking;
              if (typeof audio_codec !== 'undefined')
                pub.audiocodec = audio_codec;
              if (typeof video_codec !== 'undefined')
                pub.videocodec = video_codec;
              if (typeof simulcast !== 'undefined') pub.simulcast = simulcast;
              /* [multistream] add streams info for this participant */
              if (typeof streams !== 'undefined') pub.streams = streams;
              return pub;
            }
          );
          janusmqtt_event.event = PLUGIN_EVENT.PUB_JOINED;
          break;

        /* Subscriber joined */
        case 'attached':
          /* Store room and feed id */
          this.room = room;
          if (typeof message_data.id !== 'undefined') {
            this.feed = message_data.id;
            janusmqtt_event.data.feed = message_data.id;
            janusmqtt_event.data.display = message_data.display;
          }

          /* [multistream] add streams info to the subscriber joined event */
          if (typeof message_data.streams !== 'undefined') {
            this.streams = message_data.streams;
            janusmqtt_event.data.streams = message_data.streams;
          }

          janusmqtt_event.event = PLUGIN_EVENT.SUB_JOINED;
          break;

        /* Slow-link event */
        case 'slow_link':
          if (this.feed) janusmqtt_event.data.feed = this.feed;
          janusmqtt_event.data.bitrate = message_data['current-bitrate'];
          janusmqtt_event.event = PLUGIN_EVENT.SLOW_LINK;
          break;

        /* Participants list */
        case 'participants':
          janusmqtt_event.data.participants = message_data.participants.map(
            ({ id, display, publisher, talking }: any) => {
              const peer: any = {
                feed: id,
                display,
                publisher,
              };
              if (typeof talking !== 'undefined') peer.talking = talking;
              return peer;
            }
          );
          janusmqtt_event.event = PLUGIN_EVENT.PARTICIPANTS_LIST;
          break;

        /* Room created */
        case 'created':
          janusmqtt_event.event = PLUGIN_EVENT.CREATED;
          janusmqtt_event.data.permanent = message_data.permanent;
          break;

        /* Room destroyed */
        case 'destroyed':
          janusmqtt_event.event = PLUGIN_EVENT.DESTROYED;
          break;

        /* RTP forwarding started */
        case 'rtp_forward':
          janusmqtt_event.data.feed = message_data.publisher_id;
          if (message_data.rtp_stream) {
            const f = message_data.rtp_stream;
            const fwd: any = {
              host: f.host,
            };
            if (f.audio_stream_id) {
              fwd.audio_stream = f.audio_stream_id;
              fwd.audio_port = f.audio;
              if (typeof f.audio_rtcp === 'number') {
                fwd.audio_rtcp_port = f.audio_rtcp;
              }
            }
            if (f.video_stream_id) {
              fwd.video_stream = f.video_stream_id;
              fwd.video_port = f.video;
              if (typeof f.video_rtcp === 'number') {
                fwd.video_rtcp_port = f.video_rtcp;
              }
              if (f.video_stream_id_2) {
                fwd.video_stream_2 = f.video_stream_id_2;
                fwd.video_port_2 = f.video_2;
              }
              if (f.video_stream_id_3) {
                fwd.video_stream_3 = f.video_stream_id_3;
                fwd.video_port_3 = f.video_3;
              }
            }
            if (f.data_stream_id) {
              fwd.data_stream = f.data_stream_id;
              fwd.data_port = f.data;
            }

            janusmqtt_event.data.forwarder = fwd;
          }
          /* [multistream] */
          else if (message_data.forwarders) {
            janusmqtt_event.data.forwarders = message_data.forwarders.map(
              (f: any) => {
                const fwd: any = {
                  host: f.host,
                };
                if (f.type === 'audio') {
                  fwd.audio_stream = f.stream_id;
                  fwd.audio_port = f.port;
                  if (typeof f.remote_rtcp_port === 'number') {
                    fwd.audio_rtcp_port = f.remote_rtcp_port;
                  }
                }
                if (f.type === 'video') {
                  fwd.video_stream = f.stream_id;
                  fwd.video_port = f.port;
                  if (typeof f.remote_rtcp_port === 'number') {
                    fwd.video_rtcp_port = f.remote_rtcp_port;
                  }
                  if (typeof f.substream === 'number') {
                    fwd.sc_substream_layer = f.substream;
                  }
                }
                if (f.type === 'data') {
                  fwd.data_stream = f.stream_id;
                  fwd.data_port = f.port;
                }
                if (typeof f.ssrc === 'number') {
                  fwd.ssrc = f.ssrc;
                }
                if (typeof f.pt === 'number') {
                  fwd.pt = f.pt;
                }
                if (typeof f.srtp === 'boolean') {
                  fwd.srtp = f.srtp;
                }

                return fwd;
              }
            );
          }

          janusmqtt_event.event = PLUGIN_EVENT.RTP_FWD_STARTED;
          break;

        /* RTP forwarding stopped */
        case 'stop_rtp_forward':
          janusmqtt_event.data.feed = message_data.publisher_id;
          janusmqtt_event.data.stream = message_data.stream_id;
          janusmqtt_event.event = PLUGIN_EVENT.RTP_FWD_STOPPED;
          break;

        /* RTP forwarders list */
        case 'forwarders':
          if (message_data.rtp_forwarders) {
            janusmqtt_event.data.forwarders = message_data.rtp_forwarders.map(
              ({ publisher_id, rtp_forwarder }: any) => {
                const pub: any = {
                  feed: publisher_id,
                };

                pub.forwarders = rtp_forwarder.map((f: any) => {
                  const fwd: any = {
                    host: f.ip,
                  };
                  if (f.audio_stream_id) {
                    fwd.audio_stream = f.audio_stream_id;
                    fwd.audio_port = f.port;
                    if (typeof f.remote_rtcp_port === 'number') {
                      fwd.audio_rtcp_port = f.remote_rtcp_port;
                    }
                  }
                  if (f.video_stream_id) {
                    fwd.video_stream = f.video_stream_id;
                    fwd.video_port = f.port;
                    if (typeof f.remote_rtcp_port === 'number') {
                      fwd.video_rtcp_port = f.remote_rtcp_port;
                    }
                    if (typeof f.substream === 'number') {
                      fwd.sc_substream_layer = f.substream;
                    }
                  }
                  if (f.data_stream_id) {
                    fwd.data_stream = f.data_stream_id;
                    fwd.data_port = f.port;
                  }
                  if (typeof f.ssrc === 'number') {
                    fwd.ssrc = f.ssrc;
                  }
                  if (typeof f.pt === 'number') {
                    fwd.pt = f.pt;
                  }
                  if (typeof f.srtp === 'boolean') {
                    fwd.srtp = f.srtp;
                  }

                  return fwd;
                });

                return pub;
              }
            );
          }
          /* [multistream] */
          else if (message_data.publishers) {
            janusmqtt_event.data.forwarders = message_data.publishers.map(
              ({ publisher_id, forwarders }: any) => {
                const pub: any = {
                  feed: publisher_id,
                };

                pub.forwarders = forwarders.map((f: any) => {
                  const fwd: any = {
                    host: f.host,
                  };
                  if (f.type === 'audio') {
                    fwd.audio_stream = f.stream_id;
                    fwd.audio_port = f.port;
                    if (typeof f.remote_rtcp_port === 'number') {
                      fwd.audio_rtcp_port = f.remote_rtcp_port;
                    }
                  }
                  if (f.type === 'video') {
                    fwd.video_stream = f.stream_id;
                    fwd.video_port = f.port;
                    if (typeof f.remote_rtcp_port === 'number') {
                      fwd.video_rtcp_port = f.remote_rtcp_port;
                    }
                    if (typeof f.substream === 'number') {
                      fwd.sc_substream_layer = f.substream;
                    }
                  }
                  if (f.type === 'data') {
                    fwd.data_stream = f.stream_id;
                    fwd.data_port = f.port;
                  }
                  if (typeof f.ssrc === 'number') {
                    fwd.ssrc = f.ssrc;
                  }
                  if (typeof f.pt === 'number') {
                    fwd.pt = f.pt;
                  }
                  if (typeof f.srtp === 'boolean') {
                    fwd.srtp = f.srtp;
                  }
                  return fwd;
                });

                return pub;
              }
            );
          }

          janusmqtt_event.event = PLUGIN_EVENT.RTP_FWD_LIST;
          break;

        /* Talking events */
        case 'talking':
        case 'stopped-talking':
          janusmqtt_event.data.feed = message_data.id;
          janusmqtt_event.data.talking = videoroom === 'talking';
          /* [multistream] */
          if (typeof message_data.mid !== 'undefined')
            janusmqtt_event.data.mid = message_data.mid;
          janusmqtt_event.data.audio_level =
            message_data['audio-level-dBov-avg'];
          janusmqtt_event.event = PLUGIN_EVENT.TALKING;
          break;

        /* [multistream] updated event */
        case 'updated':
          janusmqtt_event.data.streams = message_data.streams;
          janusmqtt_event.event = PLUGIN_EVENT.UPDATED;
          break;

        /* [multistream] updating event, sent when janus receives another "update" before getting a JSEP answer for the previous one */
        case 'updating':
          janusmqtt_event.data.streams = message_data.streams;
          janusmqtt_event.event = PLUGIN_EVENT.UPDATED;
          break;

        /* Generic events (error, notifications ...) */
        case 'event':
          /* VideoRoom Error */
          if (error) {
            janusmqtt_event.event = PLUGIN_EVENT.ERROR;
            janusmqtt_event.data = new Error(`${error_code} ${error}`);
            janusmqtt_event.data._code = error_code;
            /* In case of error, close a transaction */
            this.closeTransactionWithError(transaction, janusmqtt_event.data);
            break;
          }
          /* Participant joined notification (notify_joining) */
          if (message_data.joining) {
            janusmqtt_event.event = PLUGIN_EVENT.PUB_PEER_JOINED;
            janusmqtt_event.data.feed = message_data.joining.id;
            if (message_data.joining.display)
              janusmqtt_event.data.display = message_data.joining.display;
            break;
          }
          /* Publisher list notification */
          if (message_data.publishers) {
            janusmqtt_event.event = PLUGIN_EVENT.PUB_LIST;
            janusmqtt_event.data.publishers = message_data.publishers.map(
              ({
                id,
                display,
                talking,
                audio_codec,
                video_codec,
                simulcast,
                streams,
              }: any) => {
                const pub: any = {
                  feed: id,
                  display,
                };
                if (typeof talking !== 'undefined') pub.talking = talking;
                if (typeof audio_codec !== 'undefined')
                  pub.audiocodec = audio_codec;
                if (typeof video_codec !== 'undefined')
                  pub.videocodec = video_codec;
                if (typeof simulcast !== 'undefined') pub.simulcast = simulcast;
                /* [multistream] add streams info for this participant */
                if (typeof streams !== 'undefined') pub.streams = streams;
                return pub;
              }
            );
            break;
          }
          /* Configuration events (publishing, general configuration) */
          if (typeof message_data.configured !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.CONFIGURED;
            if (this.feed) janusmqtt_event.data.feed = this.feed;
            /* [multistream] add streams info */
            if (typeof message_data.streams !== 'undefined')
              janusmqtt_event.data.streams = message_data.streams;
            janusmqtt_event.data.configured = message_data.configured;
            break;
          }
          /* Subscribed feed started */
          if (typeof message_data.started !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.STARTED;
            if (this.feed) janusmqtt_event.data.feed = this.feed;
            janusmqtt_event.data.started = message_data.started;
            break;
          }
          /* Subscribed feed paused */
          if (typeof message_data.paused !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.PAUSED;
            if (this.feed) janusmqtt_event.data.feed = this.feed;
            janusmqtt_event.data.paused = message_data.paused;
            break;
          }
          /* Subscribed feed switched */
          if (typeof message_data.switched !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.SWITCHED;
            janusmqtt_event.data.switched = message_data.switched;
            if (message_data.switched === 'ok') {
              if (typeof message_data.id !== 'undefined') {
                janusmqtt_event.data.from_feed = this.feed;
                this.feed = message_data.id;
                janusmqtt_event.data.to_feed = this.feed;
                janusmqtt_event.data.display = message_data.display;
              }
              if (typeof message_data.streams !== 'undefined') {
                this.streams = message_data.streams;
                janusmqtt_event.data.streams = message_data.streams;
              }
            }
            break;
          }
          /* Unpublished own or other feed */
          if (typeof message_data.unpublished !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.UNPUBLISHED;
            janusmqtt_event.data.feed =
              message_data.unpublished === 'ok'
                ? this.feed
                : message_data.unpublished;
            if (message_data.display)
              janusmqtt_event.data.display = message_data.display;
            break;
          }
          /* Leaving confirmation */
          if (typeof message_data.leaving !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.LEAVING;
            janusmqtt_event.data.feed =
              message_data.leaving === 'ok' ? this.feed : message_data.leaving;
            if (message_data.reason)
              janusmqtt_event.data.reason = message_data.reason;
            if (message_data.display)
              janusmqtt_event.data.display = message_data.display;
            break;
          }
          /* Display name changed event */
          if (
            typeof message_data.display !== 'undefined' &&
            typeof message_data.switched === 'undefined'
          ) {
            janusmqtt_event.event = PLUGIN_EVENT.DISPLAY;
            janusmqtt_event.data.feed = message_data.id;
            janusmqtt_event.data.display = message_data.display;
            break;
          }
          /* Participant kicked out */
          if (typeof message_data.kicked !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.KICKED;
            janusmqtt_event.data.feed = message_data.kicked;
            break;
          }
          /* Participant left (for subscribers "leave") */
          if (typeof message_data.left !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.LEAVING;
            if (this.feed) janusmqtt_event.data.feed = this.feed;
            break;
          }
          /* Simulcast substream layer switch */
          if (typeof message_data.substream !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.SC_SUBSTREAM_LAYER;
            if (this.feed) janusmqtt_event.data.feed = this.feed;
            /* [multistream] */
            if (typeof message_data.mid !== 'undefined')
              janusmqtt_event.data.mid = message_data.mid;
            janusmqtt_event.data.sc_substream_layer = message_data.substream;
            break;
          }
          /* Simulcast temporal layers switch */
          if (typeof message_data.temporal !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.SC_TEMPORAL_LAYERS;
            if (this.feed) janusmqtt_event.data.feed = this.feed;
            /* [multistream] */
            if (typeof message_data.mid !== 'undefined')
              janusmqtt_event.data.mid = message_data.mid;
            janusmqtt_event.data.sc_temporal_layers = message_data.temporal;
            break;
          }
          /* Publisher moderated, i.e. a track has been muted or unmuted */
          if (typeof message_data.moderation !== 'undefined') {
            janusmqtt_event.event = PLUGIN_EVENT.MODERATED;
            janusmqtt_event.data.feed = message_data.id;
            janusmqtt_event.data.mid = message_data.mid;
            janusmqtt_event.data.moderation = message_data.moderation;
            break;
          }
      }

      /* The event has been handled */
      if (janusmqtt_event.event) {
        /* Try to close the transaction */
        this.closeTransactionWithSuccess(transaction, janus_message);
        /* If the transaction was not owned, emit the event */
        //@ts-ignore
        if (emit) this.emit(janusmqtt_event.event, janusmqtt_event.data);
        return janusmqtt_event;
      }
    }

    /* The event has not been handled, return a falsy value */
    return null;
  }

  /*----------*/
  /* USER API */
  /*----------*/

  /* These are the APIs that users need to work with the videoroom plugin */

  /**
   * Join a videoroom as publisher.
   *
   * room - The room to join to
   * feed - The feed identifier to use, if missing it is picked by Janus
   * audio - True to request audio relaying
   * video - True to request video relaying
   * data - True to request datachannel relaying
   * display - The display name to use
   * bitrate - Bitrate cap
   * token - The optional token needed to join the room
   * pin - The optional pin needed to join the room
   * record - Enable the recording
   * filename - If recording, the base path/file to use for the recording
   * descriptions - [multistream] The descriptions object, can define a description for the tracks separately e.g. track mid:0 'Video Camera', track mid:1 'Screen'
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_PUB_JOINED>
   */

  async joinPublisher({
    room,
    feed,
    audio,
    video,
    data,
    bitrate,
    record,
    filename,
    display,
    token,
    pin,
    descriptions,
  }: JoinConfigurePublisherHandle) {
    const body: any = {
      request: REQUEST_JOIN,
      ptype: PTYPE_PUBLISHER,
      room,
      id: feed,
      display: display,
      audio: audio,
      video: video,
      data: data,
      bitrate: bitrate,
      record: record,
      filename: filename,
      token: token,
      pin: pin,
    };

    /* [multistream] */
    if (descriptions.length > 0 && Array.isArray(descriptions))
      body.descriptions = descriptions;

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.PUB_JOINED) {
      if (body.display) evtdata.display = body.display;
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Join and configure videoroom handle as publisher.
   *
   * room - The room to join to
   * feed - The feed identifier to use, if missing it is picked by Janus
   * audio - True to request audio relaying
   * video - True to request video relaying
   * data - True to request datachannel relaying
   * display - The display name to use
   * bitrate - Bitrate cap
   * token - The optional token needed to join the room
   * pin - The optional pin needed to join the room
   * record - Enable the recording
   * filename - If recording, the base path/file to use for the recording
   * e2ee - True to notify end-to-end encryption for this connection
   * descriptions - [multistream] The descriptions object, can define a description for the tracks separately e.g. track mid:0 'Video Camera', track mid:1 'Screen'
   * jsep - The JSEP offer
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_PUB_JOINED>
   */

  async joinConfigurePublisher({
    room,
    feed,
    audio,
    video,
    data,
    bitrate,
    record,
    filename,
    display,
    token,
    pin,
    e2ee,
    descriptions,
    jsep,
  }: JoinConfigurePublisherHandle) {
    const body: any = {
      request: REQUEST_JOIN_CONFIGURE,
      ptype: PTYPE_PUBLISHER,
      room,

      //id: feed,
      display: display,
      audio: audio,
      video: video,
      data: data,
      bitrate: bitrate,
      record: record,
      filename: filename,
      //token: token,
      //pin: pin,
    };

    if (e2ee && jsep) jsep.e2ee = e2ee;
    if (!feed) body.id = feed;
    if (!token) body.token = token;
    if (!pin) body.pin = pin;

    /* [multistream] */
    if (descriptions.length > 0 && Array.isArray(descriptions))
      body.descriptions = descriptions;

    const response = await this.message(body, jsep).catch((e) => {
      /* Cleanup the WebRTC status in Janus in case of errors when publishing */
      /*
       *
       * JANUS_VIDEOROOM_ERROR_NO_SUCH_FEED       428
       * JANUS_VIDEOROOM_ERROR_MISSING_ELEMENT    429
       * JANUS_VIDEOROOM_ERROR_INVALID_ELEMENT    430
       * JANUS_VIDEOROOM_ERROR_INVALID_SDP_TYPE   431
       * JANUS_VIDEOROOM_ERROR_PUBLISHERS_FULL    432
       * JANUS_VIDEOROOM_ERROR_UNAUTHORIZED       433
       * JANUS_VIDEOROOM_ERROR_ALREADY_PUBLISHED  434
       * JANUS_VIDEOROOM_ERROR_NOT_PUBLISHED      435
       * JANUS_VIDEOROOM_ERROR_ID_EXISTS          436
       * JANUS_VIDEOROOM_ERROR_INVALID_SDP        437
       *
       */
      if (
        jsep &&
        e._code &&
        e._code >= 429 &&
        e._code <= 437 &&
        e._code !== 434
      )
        this.hangup().catch(() => {});
      throw e;
    });

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.PUB_JOINED) {
      if (body.display) evtdata.display = body.display;
      return evtdata;
    }
    const error = new Error(`Unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Configure a publisher or subscriber handle.<br>
   * Room is detected from the context since a handle must have joined before.<br>
   * Can also be used by publishers to publish a feed.<br>
   *
   * Use this API also to trigger ICE restarts. Publishers can omit the
   * restart/update flags, while subscribers need to use them to force
   * the operation.
   *
   * audio - True to request audio relaying
   * video - True to request video relaying
   * data - True to request datachannel relaying
   * display - The display name to use (publishers only)
   * bitrate - Bitrate cap (publishers only)
   * record - True to record the feed (publishers only)
   * filename - If recording, the base path/file to use for the recording (publishers only)
   * restart - Set to force a ICE restart
   * update - Set to force a renegotiation
   * streams - [multistream] The streams object, each stream includes mid, keyframe, send, min_delay, max_delay
   * descriptions - [multistream] The descriptions object, can define a description for the tracks separately e.g. track mid:0 'Video Camera', track mid:1 'Screen'
   * sc_substream_layer - Substream layer to receive (0-2), in case simulcasting is enabled (subscribers only)
   * sc_substream_fallback_ms - How much time in ms without receiving packets will make janus drop to the substream below (subscribers only)
   * sc_temporal_layers - Temporal layers to receive (0-2), in case VP8 simulcasting is enabled (subscribers only)
   * e2ee - True to notify end-to-end encryption for this connection
   * jsep - The JSEP offer (publishers only)
   * keyframe - True to request a keyframe (publishers only)
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_CONFIGURED>}
   */

  async configure({
    audio,
    video,
    data,
    bitrate,
    record,
    filename,
    display,
    restart,
    update,
    streams,
    descriptions,
    sc_substream_layer,
    sc_substream_fallback_ms,
    sc_temporal_layers,
    e2ee,
    jsep,
    keyframe,
  }: ConfigurePubOrSubHandle) {
    const body: any = {
      request: REQUEST_CONFIGURE,

      bitrate: bitrate,
      record: record,
      filename: filename,
      display: display,
      restart: restart,
      update: update,

      keyframe: keyframe,
    };

    if (e2ee && jsep) jsep.e2ee = e2ee;
    /* [multistream] */
    if (streams.length > 0 && Array.isArray(streams)) {
      body.streams = streams;
    } else {
      body.audio = audio;
      body.video = video;
      body.data = data;
      body.substream = sc_substream_layer;
      body.fallback = 1000 * sc_substream_fallback_ms;
      body.temporal = sc_temporal_layers;
    }

    /* [multistream] */
    if (descriptions.length > 0 && Array.isArray(descriptions))
      body.descriptions = descriptions;

    const response = await this.message(body, jsep).catch((e) => {
      /* Cleanup the WebRTC status in Janus in case of errors when publishing */
      /*
       *
       * JANUS_VIDEOROOM_ERROR_NO_SUCH_FEED       428
       * JANUS_VIDEOROOM_ERROR_MISSING_ELEMENT    429
       * JANUS_VIDEOROOM_ERROR_INVALID_ELEMENT    430
       * JANUS_VIDEOROOM_ERROR_INVALID_SDP_TYPE   431
       * JANUS_VIDEOROOM_ERROR_PUBLISHERS_FULL    432
       * JANUS_VIDEOROOM_ERROR_UNAUTHORIZED       433
       * JANUS_VIDEOROOM_ERROR_ALREADY_PUBLISHED  434
       * JANUS_VIDEOROOM_ERROR_NOT_PUBLISHED      435
       * JANUS_VIDEOROOM_ERROR_ID_EXISTS          436
       * JANUS_VIDEOROOM_ERROR_INVALID_SDP        437
       *
       */
      if (
        jsep &&
        e._code &&
        e._code >= 429 &&
        e._code <= 437 &&
        e._code !== 434
      )
        this.hangup().catch(() => {});
      throw e;
    });

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.CONFIGURED && evtdata.configured === 'ok') {
      if (body.display) evtdata.display = body.display;
      if (typeof body.request === 'boolean') evtdata.restart = body.restart;
      if (typeof body.update === 'boolean') evtdata.update = body.update;
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Publish a feed in the room.
   * Room is detected from the context since a handle must have joined before.
   *
   * audio - True to request audio relaying
   * video - True to request video relaying
   * data - True to request datachannel relaying
   * display - The display name to use
   * bitrate - Bitrate cap
   * record - True to record the feed
   * filename - If recording, the base path/file to use for the recording
   * descriptions - [multistream] The descriptions object, for each stream you can define description
   * e2ee - True to notify end-to-end encryption for this connection
   * jsep - The JSEP offer
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_CONFIGURED>
   */

  async publish({
    audio,
    video,
    data,
    bitrate,
    record,
    filename,
    display,
    descriptions,
    e2ee,
    jsep,
  }: PublishFeed) {
    if (typeof jsep === 'object' && jsep && jsep.type !== 'offer') {
      const error = new Error('jsep must be an offer');
      return Promise.reject(error);
    }
    const body: any = {
      request: REQUEST_PUBLISH,
      audio: audio,
      video: video,
      data: data,

      bitrate: bitrate,
      record: record,
      filename: filename,
      display: display,
    };

    if (e2ee && jsep) jsep.e2ee = e2ee;

    /* [multistream] */
    if (descriptions.length > 0 && Array.isArray(descriptions)) {
      body.descriptions = descriptions;
    }

    const response = await this.message(body, jsep).catch((e) => {
      /* Cleanup the WebRTC status in Janus in case of errors when publishing */
      /*
       *
       * JANUS_VIDEOROOM_ERROR_NO_SUCH_FEED       428
       * JANUS_VIDEOROOM_ERROR_MISSING_ELEMENT    429
       * JANUS_VIDEOROOM_ERROR_INVALID_ELEMENT    430
       * JANUS_VIDEOROOM_ERROR_INVALID_SDP_TYPE   431
       * JANUS_VIDEOROOM_ERROR_PUBLISHERS_FULL    432
       * JANUS_VIDEOROOM_ERROR_UNAUTHORIZED       433
       * JANUS_VIDEOROOM_ERROR_ALREADY_PUBLISHED  434
       * JANUS_VIDEOROOM_ERROR_NOT_PUBLISHED      435
       * JANUS_VIDEOROOM_ERROR_ID_EXISTS          436
       * JANUS_VIDEOROOM_ERROR_INVALID_SDP        437
       *
       */
      if (
        jsep &&
        e._code &&
        e._code >= 429 &&
        e._code <= 437 &&
        e._code !== 434
      )
        this.hangup().catch(() => {});
      throw e;
    });

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.CONFIGURED && evtdata.configured === 'ok') {
      if (body.display) evtdata.display = body.display;
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Unpublish a feed in the room.
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_UNPUBLISHED>
   */
  async unpublish() {
    const body = {
      request: REQUEST_UNPUBLISH,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.UNPUBLISHED) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Join a room as subscriber.
   *
   * room - The room to join
   * feed=0 - The feed the user wants to subscribe to
   * audio - Whether or not audio should be relayed
   * video - Whether or not video should be relayed
   * data - Whether or not data should be relayed
   * offer_audio - Whether or not audio should be negotiated
   * offer_video - Whether or not video should be negotiated
   * offer_data - Whether or not data should be negotiated
   * private_id - The private id to correlate with publisher
   * sc_substream_layer - Substream layer to receive (0-2), in case simulcasting is enabled
   * sc_substream_fallback_ms - How much time in ms without receiving packets will make janus drop to the substream below
   * sc_temporal_layers - Temporal layers to receive (0-2), in case VP8 simulcasting is enabled
   * streams - [multistream] The streams object, each stream includes feed, mid, send, ...
   * autoupdate - [multistream] Whether a new SDP offer is sent automatically when a subscribed publisher leaves
   * use_msid - [multistream] Whether subscriptions should include an msid that references the publisher
   * token - The optional token needed
   * pin - The optional password required to join the room
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_SUB_JOINED>}
   */

  async joinSubscriber({
    room,
    feed,
    audio,
    video,
    data,
    offer_audio,
    offer_video,
    offer_data,
    private_id,
    sc_substream_layer,
    sc_substream_fallback_ms,
    sc_temporal_layers,
    streams,
    autoupdate,
    use_msid,
    token,
    pin,
  }: joinSubscriber) {
    const body: any = {
      request: REQUEST_JOIN,
      ptype: PTYPE_LISTENER,
      room,
      //private_id: private_id,
      //token: token,
      //pin: pin,

      /* [multistream] */
      autoupdate: autoupdate,
      use_msid: use_msid,
    };

    if (!private_id) body.private_id = private_id;
    if (!token) body.token = token;
    if (!pin) body.pin = pin;

    /* [multistream] */
    if (!feed) {
      body.streams = streams;
    } else {
      body.feed = feed;
      body.audio = audio;
      body.video = video;
      body.data = data;
      body.offer_audio = offer_audio;
      body.offer_video = offer_video;
      body.offer_data = offer_data;
      if (!sc_substream_layer) body.substream = sc_substream_layer;
      body.fallback = 1000 * sc_substream_fallback_ms;
      if (!sc_temporal_layers) body.temporal = sc_temporal_layers;
    }

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SUB_JOINED) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Alias for "joinSubscriber".
   *
   * see module:videoroom-plugin~VideoRoomHandle#joinSubscriber
   */
  async joinListener({ params }: any) {
    return this.joinSubscriber(params);
  }

  /**
   * Start a subscriber stream.
   *
   * jsep - The JSEP answer
   * e2ee - True to hint an end-to-end encrypted negotiation
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_STARTED>}
   */

  async start({ jsep, e2ee }: StartStream) {
    const body: any = {
      request: REQUEST_START,
    };
    if (jsep) jsep.e2ee = typeof e2ee === 'boolean' ? e2ee : jsep.e2ee;

    const response = await this.message(body, jsep);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.STARTED && evtdata.started === 'ok')
      return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Pause a subscriber feed.
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_PAUSED>
   */
  async pause() {
    const body = {
      request: REQUEST_PAUSE,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.PAUSED && evtdata.paused === 'ok')
      return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Switch to another feed.
   *
   * to_feed - The feed id of the new publisher to switch to
   * audio - True to subscribe to the audio feed
   * video - True to subscribe to the video feed
   * data - True to subscribe to the datachannels of the feed
   * streams - [multistream] streams array containing feed, mid, sub_mid ...
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_SWITCHED>
   */

  async switch({ to_feed, audio, video, data, streams }: SwitchFeed) {
    const body: any = {
      request: REQUEST_SWITCH,
    };

    /* [multistream] */
    if (streams && Array.isArray(streams)) {
      body.streams = streams;
    } else {
      body.feed = to_feed;
      if (typeof audio === 'boolean') body.audio = audio;
      if (typeof video === 'boolean') body.video = video;
      if (typeof data === 'boolean') body.data = data;
    }

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SWITCHED && evtdata.switched === 'ok') {
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Leave a room.
   * Can be used by both publishers and subscribers.
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_LEAVING>
   */
  async leave() {
    const body = {
      request: REQUEST_LEAVE,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.LEAVING) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * [multistream] Update a subscription.
   *
   * subscribe - The array of streams to subscribe
   * unsubscribe - The array of streams to unsubscribe
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_UPDATED>
   */

  async update({ subscribe, unsubscribe }: Update) {
    const body: any = {
      request: REQUEST_UPDATE,
    };
    if (Array.isArray(subscribe) && subscribe.length > 0)
      body.subscribe = subscribe;
    if (Array.isArray(unsubscribe) && unsubscribe.length > 0)
      body.unsubscribe = unsubscribe;

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.UPDATED) {
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /*----------------*/
  /* Management API */
  /*----------------*/

  /* These are the APIs needed to manage videoroom resources (rooms, forwarders ...) */

  /**
   * List the participants inside a room.
   * room - The room where the list is being requested
   * secret - The optional secret for the operation
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_PARTICIPANTS_LIST>
   */
  async listParticipants({ room, secret }: ListParticipants) {
    const body: any = {
      request: REQUEST_LIST_PARTICIPANTS,
      room,
      secret: secret,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.PARTICIPANTS_LIST) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Enable or disable recording for all participants in a room while the conference is in progress.
   *
   * room - The room where the change of recording state is being requested
   * secret - The optional secret for the operation
   * record - True starts recording for all participants in an already running conference, false stops the recording
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_RECORDING_ENABLED_STATE>
   */
  async enable_recording({ room, secret, record }: EnableRecording) {
    const body: any = {
      request: REQUEST_ENABLE_RECORDING,
      room,
      record,
      secret: secret,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.RECORDING_ENABLED_STATE) {
      evtdata.room = body.room;
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Kick a publisher out from a room.
   *
   * room - The room where the kick is being requested
   * feed - The identifier of the feed to kick out
   * secret - The optional secret for the operation
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_KICKED>
   */
  async kick({ room, feed, secret }: Kick) {
    const body: any = {
      request: REQUEST_KICK,
      room,
      id: feed,
      secret: secret,
    };
    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SUCCESS) {
      evtdata.room = body.room;
      evtdata.feed = body.id;
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async moderate({ room, feed, mID, mute, secret }: Moderate) {
    const body = {
      request: REQUEST_MODERATE,
      room,
      id: feed,
      mid: mID,
      mute,
      secret: secret,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SUCCESS) {
      evtdata.room = body.room;
      evtdata.feed = body.id;
      evtdata.mid = body.mid;
      evtdata.mute = body.mute;
      return evtdata;
    }
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Check if a room exists.
   *
   * room - The room to check
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_EXISTS>
   */
  async exists({ room }: any) {
    const body = {
      request: REQUEST_EXISTS,
      room,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.EXISTS) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * List all the available rooms.
   *
   * admin_key - The admin key needed for invoking the API
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_LIST>
   */
  async list({ admin_key }: any = {}) {
    const body: any = {
      request: REQUEST_LIST_ROOMS,
    };
    if (typeof admin_key === 'string') body.admin_key = admin_key;

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.ROOMS_LIST) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Create a new room.
   *
   * room - The room identifier, if missing picked by janus
   * description - A textual description of the room
   * max_publishers - The max number of publishers allowed
   * permanent - True to make Janus persist the room on th config file
   * is_private - Make the room private (hidden from listing)
   * secret - The secret that will be used to modify the room
   * pin - The pin needed to access the room
   * admin_key - The admin key needed for invoking the API
   * bitrate - The bitrate cap that will be used for publishers
   * bitrate_cap - Make the bitrate cap an insormountable limit
   * fir_freq - The PLI interval in seconds
   * audiocodec - Comma separated list of allowed audio codecs
   * videocodec - Comma separated list of allowed video codecs
   * talking_events - True to enable talking events
   * talking_level_threshold - Audio level threshold for talking events in the range [0, 127
   * talking_packets_threshold - Audio packets threshold for talking events
   * require_pvtid - Whether subscriptions are required to provide a valid private_id
   * notify_joining - Whether to notify all participants when a new participant joins the room
   * require_e2ee - Whether all participants are required to publish and subscribe using e2e encryption
   * record - Wheter to enable recording of any publisher
   * rec_dir - Folder where recordings should be stored
   * videoorient - Whether the video-orientation RTP extension must be negotiated
   * h264_profile - H264 specific profile to prefer
   * vp9_profile - VP9 specific profile to prefer
   * threads - Number of threads to assist with the relaying of publishers in the room
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_CREATED>}
   */
  async create({
    room,
    description,
    max_publishers,
    permanent,
    is_private,
    secret,
    pin,
    admin_key,
    bitrate,
    bitrate_cap,
    fir_freq,
    audiocodec,
    videocodec,
    talking_events,
    talking_level_threshold,
    talking_packets_threshold,
    require_pvtid,
    notify_joining,
    require_e2ee,
    record,
    rec_dir,
    videoorient,
    h264_profile,
    vp9_profile,
    threads,
  }: CreateNewRoom) {
    const body: any = {
      request: REQUEST_CREATE,

      room: room,
      description: description,
      publishers: max_publishers,
      permanent: permanent,
      is_private: is_private,
      //secret: secret,
      //pin: pin,
      //admin_key: admin_key,
      bitrate: bitrate,
      bitrate_cap: bitrate_cap,
      fir_freq: fir_freq,
      audiocodec: audiocodec,
      videocodec: videocodec,
      audiolevel_event: talking_events,

      require_pvtid: require_pvtid,
      notify_joining: notify_joining,
      require_e2ee: require_e2ee,
      record: record,
      rec_dir: rec_dir,
      videoorient_ext: videoorient,
      h264_profile: h264_profile,
      vp9_profile: vp9_profile,
      threads: threads,
    };

    if (!secret) body.secret = secret;
    if (!pin) body.pin = pin;
    if (!admin_key) body.admin_key = admin_key;

    if (talking_level_threshold >= 0 && talking_level_threshold <= 127)
      body.audio_level_average = talking_level_threshold;
    if (talking_packets_threshold > 0)
      body.audio_active_packets = talking_packets_threshold;

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.CREATED) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Destroy a room.
   *
   *room - The room to destroy
   *permanent - True to remove the room from the Janus config file
   *secret - The secret needed to manage the room
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_DESTROYED>}
   */
  async destroy({ room, permanent, secret }: Destroy) {
    const body: any = {
      request: REQUEST_DESTROY,
      room,
    };
    if (typeof permanent === 'boolean') body.permanent = permanent;
    if (typeof secret === 'string') body.secret = secret;

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.DESTROYED) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Edit the ACL tokens for a room.
   *
   * room - The room where to change the acl
   * action - The action to execute on the acl
   * list - The list of tokens to execute the action onto
   * secret - The secret needed to manage the room
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_ALLOWED>
   */
  async allow({ room, action, list, secret }: Allow) {
    const body: any = {
      request: REQUEST_ALLOW,
      room,
      action,
      secret: secret,
    };
    if (list && list.length > 0) body.allowed = list;

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.ALLOWED) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Start a RTP forwarding in a room.
   *
   * room - The room where to start a forwarder
   * feed - The feed identifier to forward (must be published)
   * host - The target host for the forwarder
   * streams - [multistream] The streams array containing mid, port, rtcp_port, port_2 ...
   * audio_port - The target audio RTP port, if audio is to be forwarded
   * audio_rtcp_port - The target audio RTCP port, if audio is to be forwarded
   * audio_ssrc - The SSRC that will be used for audio RTP
   * video_port - The target video RTP port, if video is to be forwarded
   * video_rtcp_port - The target video RTCP port, if video is to be forwarded
   * video_ssrc - The SSRC that will be used for video RTP
   * video_port_2 - The target video RTP port for simulcast substream
   * video_ssrc_2 - The SSRC that will be used for video RTP substream
   * video_port_3 - The target video RTP port for simulcast substream
   * video_ssrc_3 - The SSRC that will be used for video RTP substream
   * data_port - The target datachannels port, if datachannels are to be forwarded
   * secret - The secret needed for managing the room
   * admin_key - The admin key needed for invoking the API
   *
   * returns Promise<module:videoroom-plugin~VIDEOROOM_EVENT_RTP_FWD_STARTED>
   */
  async startForward({
    room,
    feed,
    host,
    streams,
    audio_port,
    audio_rtcp_port,
    audio_ssrc,
    video_port,
    video_rtcp_port,
    video_ssrc,
    video_port_2,
    video_ssrc_2,
    video_port_3,
    video_ssrc_3,
    data_port,
    secret,
    admin_key,
  }: StartForward) {
    const body = {
      request: REQUEST_RTP_FWD_START,
      room,
      publisher_id: feed,
      host: host,
      streams: streams,
      audio_port: audio_port,
      audio_rtcp_port: audio_rtcp_port,
      audio_ssrc: audio_ssrc,
      video_port: video_port,
      video_rtcp_port: video_rtcp_port,
      video_ssrc: video_ssrc,
      video_port_2: video_port_2,
      video_ssrc_2: video_ssrc_2,
      video_port_3: video_port_3,
      video_ssrc_3: video_ssrc_3,
      data_port: data_port,
      secret: secret,
      admin_key: admin_key,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.RTP_FWD_STARTED) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   *Stop a RTP forwarder in a room.
   *room -The room where to stop a forwarder
   *feed -The feed identifier for the forwarder to stop (must be published)
   *stream -The forwarder identifier as returned by the start forward API
   *secret -The secret needed for managing the room
   *admin_key -The admin key needed for invoking the API
   */
  async stopForward({
    room,
    feed,
    stream,
    secret,
    admin_key,
  }: StopRtpForwarder) {
    const body = {
      request: REQUEST_RTP_FWD_STOP,
      room,
      publisher_id: feed,
      stream_id: stream,
      secret: secret,
      admin_key: admin_key,
    };

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.RTP_FWD_STOPPED) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * List the active forwarders in a room.
   */
  async listForward({ room, secret }: any) {
    const body: any = {
      request: REQUEST_RTP_FWD_LIST,
      room,
    };
    if (typeof secret === 'string') body.secret = secret;

    const response = await this.message(body);
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.RTP_FWD_LIST) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async tricklle(candidate: any) {
    const response = await this.trickle(candidate);

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.TRICKLE || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${candidate} request`);
    throw error;
  }

  async tricklleComplete() {
    const response = await this.trickleComplete();

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.TRICKLE || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${null} request`);
    throw error;
  }
}

/**
 * The exported plugin descriptor.
 */
export default {
  id: PLUGIN_ID,
  Handle: VideoRoomHandle,
  EVENT: {
    /**
     * A peer has joined theh room (notify-joining).
     *
     */
    VIDEOROOM_PUB_PEER_JOINED: PLUGIN_EVENT.PUB_PEER_JOINED,

    /**
     * Active publishers list updated.
     */
    VIDEOROOM_PUB_LIST: PLUGIN_EVENT.PUB_LIST,

    /**
     * The videoroom has been destroyed.
     */
    VIDEOROOM_DESTROYED: PLUGIN_EVENT.DESTROYED,

    /**
     * A feed has been unpublished.
     */
    VIDEOROOM_UNPUBLISHED: PLUGIN_EVENT.UNPUBLISHED,

    /**
     * A peer has left the room.
     */
    VIDEOROOM_LEAVING: PLUGIN_EVENT.LEAVING,

    /**
     * A participant has changed the display name.
     */
    VIDEOROOM_DISPLAY: PLUGIN_EVENT.DISPLAY,

    /**
     * A handle received a configured event.
     */
    VIDEOROOM_CONFIGURED: PLUGIN_EVENT.CONFIGURED,

    /**
     * A handle received a slow link notification.
     */
    VIDEOROOM_SLOWLINK: PLUGIN_EVENT.SLOW_LINK,

    /**
     * Notify if the current user is talking.
     */
    VIDEOROOM_TALKING: PLUGIN_EVENT.TALKING,

    /**
     * A feed has been kicked out.
     */
    VIDEOROOM_KICKED: PLUGIN_EVENT.KICKED,

    /**
     * A publisher has been moderated (muted or unmuted)
     */
    VIDEOROOM_MODERATED: PLUGIN_EVENT.MODERATED,

    /**
     * Conference recording has been enabled or disabled.
     */
    VIDEOROOM_RECORDING_ENABLED_STATE: PLUGIN_EVENT.RECORDING_ENABLED_STATE,

    /**
     * A switch to a different simulcast substream has been completed.
     */
    VIDEOROOM_SC_SUBSTREAM_LAYER: PLUGIN_EVENT.SC_SUBSTREAM_LAYER,

    /**
     * A switch to a different number of simulcast temporal layers has been completed.
     */
    VIDEOROOM_SC_TEMPORAL_LAYERS: PLUGIN_EVENT.SC_TEMPORAL_LAYERS,

    /**
     * A multistream subscription has been updated.
     */
    VIDEOROOM_UPDATED: PLUGIN_EVENT.UPDATED,

    /**
     * A generic videoroom error.
     */
    VIDEOROOM_ERROR: PLUGIN_EVENT.ERROR,
  },
};
