import JanusMqttHandle from '../handle';
import type Session from '../session';

/**
 * This module contains the implementation of the VideoCall plugin (ref. {@link https://janus.conf.meetecho.com/docs/videocall.html}).
 *
 * Its just an ugly mimic of other plugins
 */

const PLUGIN_ID = 'janus.plugin.videocall';

/* These are the requests defined for the Janus VideoCall API */
//const REQUEST_LIST = 'list';
const REQUEST_REGISTER = 'register';
const REQUEST_SET = 'set';
const REQUEST_CALL = 'call';
const REQUEST_ACCEPT = 'accept';
const REQUEST_HANGUP = 'hangup';

/* These are the events/responses that the VideoCall plugin will manage */
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

          /* Prepare an object for the output JanusMqtt event */

          const janusmqtt_event = this._newPluginEvent(janus_message);

          /* The plugin will emit an event only if the handle does not own the transaction */
          /* That means that a transaction has already been closed or this is an async event */

          const emit = this.ownsTransaction(transaction) === false;

          const result = message_data.result.event;
          if (typeof result !== undefined) {
            switch (result) {
              case 'list':
                janusmqtt_event.data.list = message_data.result.list;
                janusmqtt_event.event = PLUGIN_EVENT.LIST;
                break;
              case 'registered':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.REGISTRED;
                break;
              case 'calling':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.CALLING;
                break;
              case 'incomingcall':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.INCOMMING;
                break;
              case 'accepted':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.ACCEPTED;
                break;
              case 'update':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.UPDATE;
                break;
              case 'set':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.SET;
                break;
              case 'hangup':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.HANGUP;
                break;
              case 'simulcast':
                janusmqtt_event.data.result = message_data.result;
                janusmqtt_event.event = PLUGIN_EVENT.SIMULCAST;
                break;
            }
          }

          /* The event has been handled */
          if (janusmqtt_event.event) {
            /* Try to close the transaction */

            this.closeTransactionWithSuccess(transaction, janus_message);
            /* If the transaction was not owned, emit the event */

            if (emit) this.emit(janusmqtt_event.event, janusmqtt_event.data);
            return janusmqtt_event;
          }
        }
      } else {
        //handle all own and disowned errors

        const janusmqtt_event = this._newPluginEvent(janus_message);

        const emit = this.ownsTransaction(transaction) === false;

        /* Handle VideoCall Error */
        switch (error_codee) {
          //register a username before calling
          case 473:
            janusmqtt_event.data.error = janus_message.plugindata.data.error;
            janusmqtt_event.data.error_code =
              janus_message.plugindata.data.error_code;
            janusmqtt_event.event = PLUGIN_EVENT.ERROR;
            break;

          //user name is taken when you want to register
          case 476:
            janusmqtt_event.data.error = janus_message.plugindata.data.error;
            janusmqtt_event.data.error_code =
              janus_message.plugindata.data.error_code;
            janusmqtt_event.event = PLUGIN_EVENT.ERROR;
            break;

          //user name doesnt exist when you try to call it
          case 478:
            janusmqtt_event.data.error = janus_message.plugindata.data.error;
            janusmqtt_event.data.error_code =
              janus_message.plugindata.data.error_code;
            janusmqtt_event.event = PLUGIN_EVENT.ERROR;
            break;
        }

        /* The event has been handled */
        if (janusmqtt_event.event) {
          /* Try to close the transaction */
          this.closeTransactionWithSuccess(transaction, janus_message);
          /* If the transaction was not owned, emit the event */
          if (emit) this.emit(janusmqtt_event.event, janusmqtt_event.data);
          return janusmqtt_event;
        }
      }
    }

    //handle trickle
    if (janus == 'trickle') {
      /* Prepare an object for the output JanusMqtt event */
      const janusmqtt_event = this._newPluginEvent(janus_message);
      const { completed, sdpMid, sdpMLineIndex, candidate } =
        janus_message.candidate;
      /* The plugin will emit an event only if the handle does not own the transaction */
      /* That means that a transaction has already been closed or this is an async event */
      const emit = this.ownsTransaction(transaction) === false;

      if (!completed) {
        janusmqtt_event.data.sdpMid = sdpMid;
        janusmqtt_event.data.sdpMLineIndex = sdpMLineIndex;
        janusmqtt_event.data.candidate = candidate;
      } else {
        janusmqtt_event.data.complete = true;
      }

      janusmqtt_event.event = PLUGIN_EVENT.TRICKLE;

      /* The event has been handled */
      if (janusmqtt_event.event) {
        /* Try to close the transaction */
        this.closeTransactionWithSuccess(transaction, janus_message);
        /* If the transaction was not owned, emit the event */
        if (emit) this.emit(janusmqtt_event.event, janusmqtt_event.data);
        return janusmqtt_event;
      }
    }

    //handle dettached
    if (janus == 'detached') {
      /* Prepare an object for the output JanusMqtt event */

      const janusmqtt_event = this._newPluginEvent(janus_message);
      const { session_id, sender } = janus_message;
      /* The plugin will emit an event only if the handle does not own the transaction */
      /* That means that a transaction has already been closed or this is an async event */

      const emit = this.ownsTransaction(transaction) === false;

      janusmqtt_event.event = PLUGIN_EVENT.DETACHED;
      janusmqtt_event.data.session_id = session_id;
      janusmqtt_event.data.handle_id = sender;

      /* The event has been handled */
      if (janusmqtt_event.event) {
        /* Try to close the transaction */

        this.closeTransactionWithSuccess(transaction, janus_message);
        /* If the transaction was not owned, emit the event */

        if (emit) this.emit(janusmqtt_event.event, janusmqtt_event.data);

        return janusmqtt_event;
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

    const response = await this.message(body);

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

    const response = await this.message(body, jsep);

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

    const response = await this.message(body);

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

    const response = await this.message(body);

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

    const response = await this.message(body);

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SET || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async update(jsep: any) {
    const body = {
      request: REQUEST_SET,
    };

    const response = await this.message(body, jsep);

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.SET || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async tricklee(candidate: any) {
    const response = await this.trickle(candidate);

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.TRICKLE || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${candidate} request`);
    throw error;
  }

  async trickleeComplete() {
    const response = await this.trickleComplete();

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.TRICKLE || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${null} request`);
    throw error;
  }

  async accept(jsep: any) {
    const body = {
      request: REQUEST_ACCEPT,
    };

    const response = await this.message(body, jsep);

    const { event, data: evtdata } = this._getPluginEvent(response);
    if (event === PLUGIN_EVENT.ACCEPTED || PLUGIN_EVENT.ERROR) return evtdata;
    const error = new Error(`unexpected response to ${body.request} request`);
    throw error;
  }

  async hangup() {
    const body = {
      request: REQUEST_HANGUP,
    };

    const response = await this.message(body);

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
