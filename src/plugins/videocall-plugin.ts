import JanusMqttHandle from '../handle';
import type Session from '../session';

/**
 * This module contains the implementation of the VideoCall plugin (ref. {@link https://janus.conf.meetecho.com/docs/videocall.html}).
 *
 * Its just an ugly mimic of other plugin
 */

const PLUGIN_ID = 'janus.plugin.videocall';

/* These are the requests defined for the Janus RecordPlay API */
//const REQUEST_LIST = 'list';
const REQUEST_REGISTER = 'register';
const REQUEST_SET = 'set';
const REQUEST_CALL = 'call';
const REQUEST_ACCEPT = 'accept';
const REQUEST_HANGUP = 'hangup';

/* These are the events/responses that the Janode plugin will manage */
/* Some of them will be exported in the plugin descriptor */
const PLUGIN_EVENT = {
  LIST: 'videocall_list',
  REGISTRED: 'videocall_registered',
  CALLING: 'videocall_calling',
  INCOMMING: 'videocall_incomingcall',
  ACCEPTED: 'videocall_accepted',
  HANGUP: 'videocall_hangup',
  UPDATE: 'videocall_update',
  SET: 'videocall_set',
  SIMULCAST: 'videocall_simulcast',
  JSEP: 'videocall_jsep',
  TRICKLE: 'videocall_trickle',
  ERROR: 'videocall_error',
  ERROR_CODE: 'videocall_error_code',
  DETACHED: 'videocall_handle_detached',
};

/**
 * The class implementing the VideoCall plugin (ref. {@link https://janus.conf.meetecho.com/docs/videocall.html}).<br>
 *
 * It extends the base JanusMqttHandle class and overrides the base "handleMessage" method.<br>
 *
 * Moreover it defines many methods to support VideoCall operations
 */
class VideoCallHandle extends JanusMqttHandle {
  /**
   * Create a JanusMqtt VideoCall handle.
   *
   */

  constructor(session: Session, id: number) {
    super(session, id);
  }

  /**
   * The custom "handleMessage" needed for handling VideoCall messages.
   */
  _handleMessage(janus_message: any) {
    //console.log(janus_message)

    const { janus, plugindata, transaction } = janus_message;

    //handle events
    if (janus == 'event') {
      //hack event to handle error first
      const error_codee = janus_message.plugindata.data.error_code;
      if (typeof error_codee !== 'number') {
        //handle video call events
        if (plugindata.data.videocall) {
          //Got message
          const message_data = plugindata.data;

          /* Prepare an object for the output Janode event */
          //@ts-ignore
          const janode_event = this._newPluginEvent(janus_message);

          /* The plugin will emit an event only if the handle does not own the transaction */
          /* That means that a transaction has already been closed or this is an async event */
          //@ts-ignore
          const emit = this.ownsTransaction(transaction) === false;

          const result = message_data.result.event;
          if (typeof result !== undefined) {
            switch (result) {
              case 'list':
                janode_event.data.list = message_data.result.list;
                janode_event.event = PLUGIN_EVENT.LIST;
                console.log(
                  '---------videocall-plugin--events----list---check--------------'
                );
                break;
              case 'registered':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.REGISTRED;
                console.log(
                  '---------videocall-plugin--events----registered---check--------------'
                );
                break;
              case 'calling':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.CALLING;

                console.log(
                  '---------videocall-plugin--events----calling---check--------------'
                );
                break;
              case 'incomingcall':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.INCOMMING;

                console.log(janode_event.data.jsep);
                console.log(
                  '---------videocall-plugin--events----incomingcall---check--------------'
                );
                break;
              case 'accepted':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.ACCEPTED;
                console.log(
                  '---------videocall-plugin--events----accepted---check--------------'
                );
                break;
              case 'update':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.UPDATE;
                console.log(
                  '---------videocall-plugin--events----update---check--------------'
                );
                break;
              case 'set':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.SET;
                console.log(
                  '---------videocall-plugin--events----set---check--------------'
                );
                break;
              case 'hangup':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.HANGUP;
                console.log(
                  '---------videocall-plugin--events----hangup---check--------------'
                );
                break;
              case 'simulcast':
                janode_event.data.result = message_data.result;
                janode_event.event = PLUGIN_EVENT.SIMULCAST;
                console.log(
                  '---------videocall-plugin--events----simulcast---check--------------'
                );
                break;
              /* Generic events (error, notifications ...) */
              default:
                console.log(
                  '---------videocall-plugin--events----default---check--------------'
                );
                break;
            }
          }

          /* The event has been handled */
          if (janode_event.event) {
            /* Try to close the transaction */
            //@ts-ignore
            this.closeTransactionWithSuccess(transaction, janus_message);
            /* If the transaction was not owned, emit the event */
            //@ts-ignore
            if (emit) this.emit(janode_event.event, janode_event.data);
            console.log(janode_event);
            console.log(
              '----------videocall---events-----janode_event-----success-----'
            );
            return janode_event;
          }
        }
      } else {
        //handle all own and disowned errors
        //@ts-ignore
        const janode_event = this._newPluginEvent(janus_message);

        //@ts-ignore
        const emit = this.ownsTransaction(transaction) === false;

        /* Handle VideoCall Error */
        switch (error_codee) {
          //register a username before calling
          case 473:
            janode_event.data.error = janus_message.plugindata.data.error;
            janode_event.data.error_code =
              janus_message.plugindata.data.error_code;
            janode_event.event = PLUGIN_EVENT.ERROR;
            console.log(
              '---------videocall-plugin--events----error_code--473---check--------------'
            );
            break;
          //user name is taken when you want to register
          case 476:
            janode_event.data.error = janus_message.plugindata.data.error;
            janode_event.data.error_code =
              janus_message.plugindata.data.error_code;
            janode_event.event = PLUGIN_EVENT.ERROR;
            console.log(
              '---------videocall-plugin--events----error_code--476---check--------------'
            );
            break;

          //user name doesnt exist when you try to call it
          case 478:
            janode_event.data.error = janus_message.plugindata.data.error;
            janode_event.data.error_code =
              janus_message.plugindata.data.error_code;
            janode_event.event = PLUGIN_EVENT.ERROR;
            console.log(
              '---------videocall-plugin--events----error_code--478---check--------------'
            );
            break;
        }

        /* The event has been handled */
        if (janode_event.event) {
          /* Try to close the transaction */
          //@ts-ignore
          this.closeTransactionWithSuccess(transaction, janus_message);
          /* If the transaction was not owned, emit the event */
          //@ts-ignore
          if (emit) this.emit(janode_event.event, janode_event.data);
          console.log(janode_event);
          console.log(
            '----------videocall---events-----janode_event--error-----'
          );
          return janode_event;
        }
      }
    }

    //handle trickle
    if (janus == 'trickle') {
      /* Prepare an object for the output Janode event */
      //@ts-ignore
      const janode_event = this._newPluginEvent(janus_message);
      const { completed, sdpMid, sdpMLineIndex, candidate } =
        janus_message.candidate;
      /* The plugin will emit an event only if the handle does not own the transaction */
      /* That means that a transaction has already been closed or this is an async event */
      //@ts-ignore
      const emit = this.ownsTransaction(transaction) === false;

      if (!completed) {
        janode_event.data.sdpMid = sdpMid;
        janode_event.data.sdpMLineIndex = sdpMLineIndex;
        janode_event.data.candidate = candidate;
      } else {
        janode_event.data.complete = true;
      }

      janode_event.event = PLUGIN_EVENT.TRICKLE;

      /* The event has been handled */
      if (janode_event.event) {
        /* Try to close the transaction */
        //@ts-ignore
        this.closeTransactionWithSuccess(transaction, janus_message);
        /* If the transaction was not owned, emit the event */
        //@ts-ignore
        if (emit) this.emit(janode_event.event, janode_event.data);
        console.log(janode_event);
        console.log(
          '----------videocall---events-----janode_event--trickleeeeeee---success-----'
        );
        return janode_event;
      }
    }

    //handle dettached
    if (janus == 'detached') {
      /* Prepare an object for the output Janode event */
      //@ts-ignore
      const janode_event = this._newPluginEvent(janus_message);
      const { session_id, sender } = janus_message;
      /* The plugin will emit an event only if the handle does not own the transaction */
      /* That means that a transaction has already been closed or this is an async event */
      //@ts-ignore
      const emit = this.ownsTransaction(transaction) === false;

      janode_event.event = PLUGIN_EVENT.DETACHED;
      janode_event.data.session_id = session_id;
      janode_event.data.handle_id = sender;

      /* The event has been handled */
      if (janode_event.event) {
        /* Try to close the transaction */
        //@ts-ignore
        this.closeTransactionWithSuccess(transaction, janus_message);
        /* If the transaction was not owned, emit the event */
        //@ts-ignore
        if (emit) this.emit(janode_event.event, janode_event.data);
        console.log(janode_event);
        console.log(
          '----------videocall---events-----janode_event--detached---success-----'
        );
        return janode_event;
      }
    }

    /* The event has not been handled, return a falsy value */
    return null;
  }

  /* These are the APIs that users need to work with the videocall plugin */

  /**
   * Register user.
   */
  async register(user_id: string) {
    const body = {
      request: REQUEST_REGISTER,
      username: user_id,
    };
    //@ts-ignore
    const response = await this.message(body);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);

    if (event === PLUGIN_EVENT.REGISTRED || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  /**
   * Start a call.
   */
  async call(user_id: string, jsep: any) {
    const body = {
      request: REQUEST_CALL,
      username: user_id,
    };
    //@ts-ignore
    const response = await this.message(body, jsep);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.CALLING || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async setAudio(audio: boolean) {
    const body = {
      request: REQUEST_SET,
      audio: audio,
    };
    //@ts-ignore
    const response = await this.message(body);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SET || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async setVideo(video: boolean) {
    const body = {
      request: REQUEST_SET,
      video: video,
    };
    //@ts-ignore
    const response = await this.message(body);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SET || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async record(record: boolean, filepath: string) {
    const body = {
      request: REQUEST_SET,
      record: record,
      filename: filepath,
    };
    //@ts-ignore
    const response = await this.message(body);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SET || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async update(jsep: any) {
    const body = {
      request: REQUEST_SET,
    };
    //@ts-ignore
    const response = await this.message(body, jsep);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SET || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async tricklee(candidate: any) {
    //@ts-ignore
    const response = await this.trickle(candidate);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.TRICKLE || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${candidate} request`);
    throw error;
  }

  async trickleeComplete() {
    //@ts-ignore
    const response = await this.trickleComplete();
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.TRICKLE || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${null} request`);
    throw error;
  }

  async accept(jsep: any) {
    const body = {
      request: REQUEST_ACCEPT,
    };
    //@ts-ignore
    const response = await this.message(body, jsep);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.ACCEPTED || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async hangup() {
    const body = {
      request: REQUEST_HANGUP,
    };
    //@ts-ignore
    const response = await this.message(body);
    //@ts-ignore
    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.HANGUP || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }
}

export default {
  id: PLUGIN_ID,
  Handle: VideoCallHandle,

  EVENT: {
    VIDEOCALL_LIST: PLUGIN_EVENT.LIST,
    VIDEOCALL_REGISTRED: PLUGIN_EVENT.REGISTRED,
    VIDEOCALL_CALLING: PLUGIN_EVENT.CALLING,
    VIDEOCALL_INCOMMING: PLUGIN_EVENT.INCOMMING,
    VIDEOCALL_TRICKLE: PLUGIN_EVENT.TRICKLE,
    VIDEOCALL_ACCEPTED: PLUGIN_EVENT.ACCEPTED,
    VIDEOCALL_HANGUP: PLUGIN_EVENT.HANGUP,
    VIDEOCALL_UPDATE: PLUGIN_EVENT.UPDATE,
    VIDEOCALL_SIMULCAST: PLUGIN_EVENT.SIMULCAST,
    VIDEOCALL_ERROR: PLUGIN_EVENT.ERROR,
    VIDEOCALL_DETACHED: PLUGIN_EVENT.DETACHED,
  },
};
