import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  callState: "idle", // 'idle' | 'calling' | 'incoming' | 'connected'
  callerInfo: null, // { id, name, username, profileImage }
  receiverInfo: null, // { id, name, username, profileImage }
  isVideoCall: true,
  incomingSignal: null,
  callDuration: 0,
  isMuted: false,
  isVideoOff: false,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startCall: (state, action) => {
      const { receiver, isVideoCall = true } = action.payload;
      state.callState = "calling";
      state.receiverInfo = receiver;
      state.callerInfo = null;
      state.isVideoCall = isVideoCall;
      state.incomingSignal = null;
      state.callDuration = 0;
      state.isMuted = false;
      state.isVideoOff = false;
    },
    setIncomingCall: (state, action) => {
      const { caller, signal, isVideoCall = true } = action.payload;
      state.callState = "incoming";
      state.callerInfo = caller;
      state.incomingSignal = signal;
      state.isVideoCall = isVideoCall;
      state.callDuration = 0;
      state.isMuted = false;
      state.isVideoOff = false;
    },
    callAccepted: (state) => {
      state.callState = "connected";
    },
    endCallSession: (state) => {
      state.callState = "idle";
      state.callerInfo = null;
      state.receiverInfo = null;
      state.incomingSignal = null;
      state.callDuration = 0;
      state.isMuted = false;
      state.isVideoOff = false;
    },
    incrementDuration: (state) => {
      state.callDuration += 1;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleVideo: (state) => {
      state.isVideoOff = !state.isVideoOff;
    },
  },
});

export const {
  startCall,
  setIncomingCall,
  callAccepted,
  endCallSession,
  incrementDuration,
  toggleMute,
  toggleVideo,
} = callSlice.actions;

export default callSlice.reducer;
