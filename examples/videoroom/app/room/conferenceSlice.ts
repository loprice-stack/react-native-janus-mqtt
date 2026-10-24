import { createSlice } from '@reduxjs/toolkit'



export type StreamsObject = {
    remotestream: any, feed: number, display: string, room: number
}



export type SubscriptionsObject = {
    remotestream: any, feed: number, display: string, room: number
}


// Define the TS type for the counter slice's state
export interface ConferenceState {


    create_conference_d_open: boolean
    goto_conference_room_d_open: boolean


    //
    private_id: number //local publisher pvt_id
    feed_: number //local publisher feed
    stream_title: string //room description
    stream_room: number | undefined //room
    stream_room_display: string //localstream publisher display
    stream_room_display_d_open: boolean
    remote_candidate: [] //candidates havested from remote server during negotiation

    pub_localstream: any //local stream of a publisher handle
    sub_remotestream: [] //remote streams subscribed from subscriber handle
    sub_remotestream_rsv: [] //remote streams reserved subscribed from subscriber handle
    subscriptions: [] // list of publishers we are interested in the room and that we can subscribe to
    participants: [], //list of all people in the room
    remote_jsep: any





}


// Define the initial value for the slice state
const initialState: ConferenceState = {

    create_conference_d_open: false,
    goto_conference_room_d_open: false,

    //
    private_id: 0,
    feed_: 0,
    stream_title: "",
    stream_room: undefined,
    stream_room_display: "",
    stream_room_display_d_open: false,
    remote_candidate: [],

    pub_localstream: null,
    sub_remotestream: [],
    sub_remotestream_rsv: [],
    subscriptions: [],
    participants: [],
    remote_jsep: null,


}


// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const conferenceSlice = createSlice({
    name: 'conference',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {

        ////////////////////////////////////stream//////////////////////////////////////
        setCreateConferenceDialogyOpen: (state, action) => {
            state.create_conference_d_open = action.payload
            //console.log(state.live_stream_d_open)
        },

    

        setPrivateId: (state, action) => {
            state.private_id = action.payload
            //console.log(state.record_stream_d_open)
        },

        setFeed: (state, action) => {
            state.feed_ = action.payload
            //console.log(state.record_stream_d_open)
        },

        setStreamTitle: (state, action) => {
            state.stream_title = action.payload
            //console.log(state.record_stream_d_open)
        },

        setStreamRoom: (state, action) => {
            state.stream_room = action.payload
            //console.log(state.record_stream_d_open)
        },

        setStreamRoomDisplay: (state, action) => {
            state.stream_room_display = action.payload
            //console.log(state.record_stream_d_open)
        },

        setGoToConferenceDialogyOpen: (state, action) => {
            state.goto_conference_room_d_open = action.payload
            //console.log(state.goto_conference_room_d_open)
        },

        setStreamRoomRemoteCandidate: (state, action) => {
            state.remote_candidate = action.payload
            //console.log(state.live_stream_d_open)
        },

        setPubLocalStream: (state, action) => {
            state.pub_localstream = action.payload
            //console.log(state.live_stream_d_open)
        },

        setSubRemoteStream: (state, action) => {

            state.sub_remotestream = action.payload
            console.log(state.sub_remotestream)
            console.log("---------------------setSubRemoteStream---------------------------------")

        },

        pushSubRemoteStream: (state, action) => {

            //@ts-ignore
            state.sub_remotestream = [...state.sub_remotestream, action.payload]
            console.log(state.sub_remotestream)
            console.log("---------------------pushSubRemoteStream------1---------------------------")

            state.sub_remotestream.map((stream, index) => {

                //check to see if this stream and sub have comonerity
                //@ts-ignore
                const strmid_sub = state.subscriptions[index].remotestream ? state.subscriptions[index].remotestream.id : undefined
                //@ts-ignore
                const strmid_sub_strm = stream.feed ? stream.feed : undefined

                console.log(typeof strmid_sub)
                console.log(typeof strmid_sub_strm)
                if ((typeof strmid_sub == 'undefined') && (typeof strmid_sub_strm == 'undefined')) {

                    //console.log(state.sub_remotestream)
                    console.log("-----------(typeof strmid_sub == undefined) && (typeof strmid_sub_strm == undefined)----------------")

                    //swap values for subscriptions which in our
                    //  case only remote stream is undefined
                    //@ts-ignore
                    state.subscriptions[index].remotestream = stream.remotestream

                    //swap values for sub_remotestream which in our
                    //  case feed, display and room are undefined
                    //@ts-ignore
                    stream.feed = state.subscriptions[index].feed
                    //@ts-ignore
                    stream.display = state.subscriptions[index].display
                    //@ts-ignore
                    stream.room = state.subscriptions[index].room

                } else {

                    if (state.pub_localstream.id == strmid_sub) {

                    } else {

                    }
                }

            })
            console.log(state.sub_remotestream)
            console.log("---------------------pushSubRemoteStream-----2----------------------------")
        },

        swapSubRemoteStream: (state, action) => {

            state.sub_remotestream.map((stream, index) => {

                //check to see if this feed 
                const saved_feed_strm = action.payload.feed

                if (typeof saved_feed_strm !== 'undefined') {
                    console.log(saved_feed_strm)
                    console.log(stream)
                    console.log("------------(typeof saved_feed_strm !== 'undefined')---------------")

                    //@ts-ignore
                    if (saved_feed_strm == stream.feed) {
                        //swap values for subscriptions which in our
                        //  case only remote stream is undefined
                        //@ts-ignore
                        state.subscriptions.map((sub) => {

                            //@ts-ignore
                            const saved_feed_sb = sub.feed

                            if (typeof saved_feed_sb !== 'undefined') {
                                console.log("------------(typeof saved_feed_strm !== 'undefined')---------------")
                                //@ts-ignore
                                if (saved_feed_sb == stream.feed) {
                                    //@ts-ignore
                                    sub.remotestream = stream.remotestream
                                }
                            }
                        })
                    }
                }
            })
            console.log(state.sub_remotestream)
            console.log("---------------------swapSubRemoteStream-----sub_remotestream----------------------------")
            console.log(state.subscriptions)
            console.log("---------------------swapSubRemoteStream-----subscriptions----------------------------")
        },

        popSubRemoteStream: (state, action) => {

            //If we have existing feed for this user, remove it
            //@ts-ignore 

            // Create a new array without "Bob"
            const newsubstreams = state.sub_remotestream.filter(sub_r => sub_r.feed !== action.payload.feed);
            //@ts-ignore
            state.sub_remotestream = newsubstreams
            console.log(state.sub_remotestream)
            console.log("---------------------popSubRemoteStream---------sub_remotestream------------------------")

        },

        pushSubRemoteStreamReserve: (state, action) => {

            //@ts-ignore
            state.sub_remotestream_rsv = [...state.sub_remotestream_rsv, action.payload]
            console.log(state.sub_remotestream_rsv)
            console.log("---------------------pushSubRemoteStreamReserve---------------------------------")
        },

        findSubRemoteStreamReserve: (state, action) => {

            //If we have existing feed for this user, remove it
            //@ts-ignore 


            // Create a new array without "Bob"
            const newsubstreams = state.sub_remotestream.filter(sub_r => sub_r.display == action.payload.display);

            state.subscriptions.map((sub) => {

                //@ts-ignore
                const dspl = sub.display

                if (dspl == action.payload.display) {

                    //@ts-ignore
                    sub.remotestream = newsubstreams[0].remotestream
                }


            })
            console.log(state.subscriptions)
            console.log("---------------------findSubRemoteStreamReserve---------------------------------")

        },

        setPublishers: (state, action) => {
            console.log(action.payload)
            console.log("--------------action.payload-------------------------------")

            // Create a new array without "Bob"
            //@ts-ignore
            const newsubscriptions = action.payload.filter(sub => sub.feed !== state.feed_)
            //@ts-ignore
            state.subscriptions = newsubscriptions

            console.log(state.feed_)
            console.log("--------------this--------Publisher-------------------------------")
            console.log(state.subscriptions)
            console.log("----------------------setPublishers-------------------------------")
        },

        pushPublishers: (state, action) => {

            //If this subscription is our own feed which we published dont add it
            if (state.feed_ == action.payload.feed) {


            } else {

                //If we have existing feed for this user, remove it first
                //@ts-ignore

                // Create a new array without "Bob"
                const newsubscriptions = state.subscriptions.filter(sub => sub.display !== action.payload.display)
                //Add new feed
                //@ts-ignore
                state.subscriptions = [...newsubscriptions, action.payload]

            }

            console.log(state.sub_remotestream)
            console.log("----------------------sub_remotestream-------------------------------")
            console.log(state.subscriptions)
            console.log("----------------------pushPublishers-------------------------------")
        },

        popPublishers: (state, action) => {

            //If we have existing feed for this user, remove it
            //@ts-ignore

            // Create a new array without "Bob"
            const newsubscriptions = state.subscriptions.filter(sub => sub.display !== action.payload.display);
            //Add new feed
            //@ts-ignore
            state.subscriptions = newsubscriptions
            console.log(state.subscriptions)
            console.log("----------------------popPublishers-------------------------------")
        },

        setParticipants: (state, action) => {


            state.participants = action.payload
            console.log(state.participants)
            console.log("----------------------setParticipants-------------------------------")
        },

        setRemoteJsep: (state, action) => {

            state.remote_jsep = action.payload
            console.log(state.remote_jsep)
            console.log("----------------------setRemoteJsep-------------------------------")
        },


    }
})

// Export the generated action creators for use in components
export const {
    setCreateConferenceDialogyOpen,
    setPrivateId,
    setFeed,
    setStreamTitle,
    setStreamRoom,
    setStreamRoomDisplay,
    setGoToConferenceDialogyOpen,
    setStreamRoomRemoteCandidate,
    setPubLocalStream,
    setSubRemoteStream,
    pushSubRemoteStream,
    popSubRemoteStream,
    pushSubRemoteStreamReserve,
    findSubRemoteStreamReserve,
    setPublishers,
    pushPublishers,
    popPublishers,
    setParticipants,
    setRemoteJsep

} = conferenceSlice.actions

// Export the slice reducer for use in the store configuration
export default conferenceSlice.reducer