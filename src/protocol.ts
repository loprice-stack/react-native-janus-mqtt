/**
 * Janus protocol constants
 */
export const JANUS = {
  /**
   * Janus API requests
   */
  REQUEST: {
    /* connection level requests */
    SERVER_INFO: 'info',
    /* session level requests */
    CREATE_SESSION: 'create',
    KEEPALIVE: 'keepalive',
    DESTROY_SESSION: 'destroy',
    /* handle level requests */
    ATTACH_PLUGIN: 'attach',
    MESSAGE: 'message',
    TRICKLE: 'trickle',
    HANGUP: 'hangup',
    DETACH_PLUGIN: 'detach',
  },
  /**
   * Janus temporary response (ack)
   */
  ACK: 'ack',
  /**
   * Janus definitive responses
   */
  RESPONSE: {
    SUCCESS: 'success',
    SERVER_INFO: 'server_info',
    ERROR: 'error',
  },
  /**
   * Janus events
   */
  EVENT: {
    EVENT: 'event',
    DETACHED: 'detached',
    ICE_FAILED: 'ice-failed',
    HANGUP: 'hangup',
    MEDIA: 'media',
    TIMEOUT: 'timeout',
    WEBRTCUP: 'webrtcup',
    SLOWLINK: 'slowlink',
    TRICKLE: 'trickle',
  },
  /**
   * Janus Admin API requests
   */
  ADMIN: {
    LIST_SESSIONS: 'list_sessions',
    LIST_HANDLES: 'list_handles',
    HANDLE_INFO: 'handle_info',
    START_PCAP: 'start_pcap',
    STOP_PCAP: 'stop_pcap',
  },
};

/**
 * JanusMqtt protocol constants
 */
export const JANUSMQTT = {
  /**
   * Janode core events.
   */
  EVENT: {
    CONNECTION_CLOSED: 'connection_closed',
    SESSION_DESTROYED: 'session_destroyed',
    HANDLE_DETACHED: 'handle_detached',
    HANDLE_ICE_FAILED: 'handle_ice_failed',
    HANDLE_HANGUP: 'handle_hangup',
    HANDLE_MEDIA: 'handle_media',
    HANDLE_WEBRTCUP: 'handle_webrtcup',
    HANDLE_SLOWLINK: 'handle_slowlink',
    HANDLE_TRICKLE: 'handle_trickle',
    CONNECTION_ERROR: 'connection_error',
  },
};

/**
 * Check if a message from Janus is a definitive response.
 *
 * @private
 * @param {Object} data - The data from Janus
 * @returns {boolean} True if the check succeeds
 */
export const isResponseData = (data: any) => {
  if (typeof data === 'object' && data) {
    return Object.values(JANUS.RESPONSE).includes(data.janus);
  }
  return false;
};

/**
 * Check if a message from Janus is an event.
 *
 * @private
 * @param {Object} data - The data from Janus
 * @returns {boolean} True if the check succeeds
 */
export const isEventData = (data: any) => {
  if (typeof data === 'object' && data) {
    return data.janus === JANUS.EVENT.EVENT;
  }
  return false;
};

/**
 * Check if a message from Janus is an error.
 *
 * @private
 * @param {Object} data - The data from Janus
 * @returns {boolean} True if the check succeeds
 */
export const isErrorData = (data: any) => {
  if (typeof data === 'object' && data) {
    return data.janus === JANUS.RESPONSE.ERROR;
  }
  return false;
};

/**
 * Check if a message from Janus is a timeout notification.
 *
 * @private
 * @param {Object} data - The data from Janus
 * @returns {boolean} True if the check succeeds
 */
export const isTimeoutData = (data: any) => {
  if (typeof data === 'object' && data) {
    return data.janus === JANUS.EVENT.TIMEOUT;
  }
  return false;
};

/**
 * Check if a message from Janus is an ack.
 *
 * @private
 * @param {Object} data - The data from Janus
 * @returns {boolean} True if the check succeeds
 */
export const isAckData = (data: any) => {
  if (typeof data === 'object' && data) {
    return data.janus === JANUS.ACK;
  }
  return false;
};
