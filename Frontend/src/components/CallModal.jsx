import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { MdCall, MdCallEnd } from "react-icons/md";
import dp from "../assets/dp.png";
import ringtone from "../utils/ringtone";
import {
  callAccepted,
  endCallSession,
  incrementDuration,
  toggleMute,
  toggleVideo,
} from "../redux/call.Slice";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function formatCallTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function CallModal() {
  const dispatch = useDispatch();
  const {
    callState,
    callerInfo,
    receiverInfo,
    isVideoCall,
    incomingSignal,
    callDuration,
    isMuted,
    isVideoOff,
  } = useSelector((state) => state.call);

  const socket = useSelector((state) => state.socket?.socket);
  const { userData } = useSelector((state) => state.user);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const durationTimerRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(isVideoCall);
  const [facingMode, setFacingMode] = useState("user"); // 'user' or 'environment'
  const [callNotification, setCallNotification] = useState(null);
  const notificationTimerRef = useRef(null);

  const showCallNotification = (notification) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setCallNotification(notification);
    notificationTimerRef.current = setTimeout(() => {
      setCallNotification(null);
      notificationTimerRef.current = null;
    }, 4500);
  };

  const handleDismissNotification = () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setCallNotification(null);
  };

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  const currentUserId = (userData?._id || userData?.id)?.toString();
  const activePartner = callerInfo || receiverInfo;
  const partnerName = activePartner?.name || activePartner?.username || "User";
  const partnerUsername = activePartner?.username || "";
  const partnerImage = activePartner?.profileImage || dp;
  const partnerId = (activePartner?._id || activePartner?.id)?.toString();

  // Cleanup helper
  const cleanUpCall = () => {
    ringtone.stop();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    dispatch(endCallSession());
  };

  // 1. Caller starts outgoing call
  useEffect(() => {
    if (callState === "calling" && receiverInfo && socket) {
      ringtone.start();

      const initiatePeerCall = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideoCall ? { facingMode: "user" } : false,
          });
          localStreamRef.current = stream;

          if (localVideoRef.current && isVideoCall) {
            localVideoRef.current.srcObject = stream;
          }

          const pc = new RTCPeerConnection(ICE_SERVERS);
          peerConnectionRef.current = pc;

          // Add local tracks to peer connection
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          // Receive remote stream
          pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
              const stream = event.streams[0];
              remoteStreamRef.current = stream;
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
              }
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().catch(() => {});
              }
            }
          };

          // ICE candidate relay
          pc.onicecandidate = (event) => {
            if (event.candidate && partnerId) {
              socket.emit("iceCandidate", {
                to: partnerId,
                candidate: event.candidate,
              });
            }
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit("callUser", {
            userToCall: partnerId,
            signalData: offer,
            from: {
              _id: currentUserId,
              name: userData?.name,
              username: userData?.username,
              profileImage: userData?.profileImage,
            },
            isVideoCall,
          });
        } catch (err) {
          console.error("Error accessing camera/mic for call:", err);
          alert("Could not access camera/microphone. Please ensure permissions are allowed.");
          cleanUpCall();
        }
      };

      initiatePeerCall();
    }
  }, [callState, receiverInfo]);

  // 2. Ringing state for receiver
  useEffect(() => {
    if (callState === "incoming") {
      ringtone.start();
    }
  }, [callState]);

  // 3. Socket event listeners during call
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = async ({ signal }) => {
      ringtone.stop();
      dispatch(callAccepted());

      if (peerConnectionRef.current && signal) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.error("Error adding ice candidate:", err);
        }
      }
    };

    const handleCallEnded = (data) => {
      ringtone.stop();
      cleanUpCall();
      const enderName = data?.by?.name || data?.by?.username || partnerName || "User";
      showCallNotification({
        type: "ended",
        title: "Call Ended",
        message: `${enderName} ended the call`,
        image: data?.by?.profileImage || partnerImage,
      });
    };

    const handleCallRejected = (data) => {
      ringtone.stop();
      cleanUpCall();
      const declinerName = data?.by?.name || data?.by?.username || partnerName || "User";
      const declinerImage = data?.by?.profileImage || partnerImage;
      showCallNotification({
        type: "declined",
        title: "Call Declined",
        message: `${declinerName} declined the call`,
        image: declinerImage,
      });
    };

    const handleUserOffline = () => {
      ringtone.stop();
      cleanUpCall();
      showCallNotification({
        type: "offline",
        title: "User Unavailable",
        message: `${partnerName} is currently offline`,
        image: partnerImage,
      });
    };

    socket.on("callAccepted", handleCallAccepted);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callEnded", handleCallEnded);
    socket.on("callRejected", handleCallRejected);
    socket.on("callUserOffline", handleUserOffline);

    return () => {
      socket.off("callAccepted", handleCallAccepted);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callEnded", handleCallEnded);
      socket.off("callRejected", handleCallRejected);
      socket.off("callUserOffline", handleUserOffline);
    };
  }, [socket, partnerName]);

  // 4. Timer when call connects
  useEffect(() => {
    if (callState === "connected") {
      ringtone.stop();
      durationTimerRef.current = setInterval(() => {
        dispatch(incrementDuration());
      }, 1000);
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState, dispatch]);

  // Synchronize local and remote streams to media elements when call connects
  useEffect(() => {
    if (callState === "connected") {
      if (localVideoRef.current && localStreamRef.current && isVideoCall) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStreamRef.current && isVideoCall) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      if (remoteAudioRef.current && remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [callState, isVideoCall]);

  // Accept incoming call handler
  const handleAcceptCall = async () => {
    ringtone.stop();
    dispatch(callAccepted());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall ? { facingMode: "user" } : false,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current && isVideoCall) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          remoteStreamRef.current = stream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.play().catch(() => {});
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && partnerId) {
          socket.emit("iceCandidate", {
            to: partnerId,
            candidate: event.candidate,
          });
        }
      };

      if (incomingSignal) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answerCall", {
          to: partnerId,
          signal: answer,
        });
      }
    } catch (err) {
      console.error("Error accepting call:", err);
      alert("Could not access camera/microphone.");
      handleRejectCall();
    }
  };

  // Reject / Decline call
  const handleRejectCall = () => {
    ringtone.stop();
    if (socket && partnerId) {
      socket.emit("rejectCall", {
        to: partnerId,
        from: {
          _id: currentUserId,
          name: userData?.name,
          username: userData?.username,
          profileImage: userData?.profileImage,
        },
      });
    }
    cleanUpCall();
  };

  // End active call or cancel outgoing call
  const handleEndCall = () => {
    ringtone.stop();
    if (socket && partnerId) {
      socket.emit("endCall", {
        to: partnerId,
        from: {
          _id: currentUserId,
          name: userData?.name,
          username: userData?.username,
          profileImage: userData?.profileImage,
        },
      });
    }
    cleanUpCall();
  };

  // Toggle microphone
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle
        dispatch(toggleMute());
      }
    }
  };

  // Toggle camera video
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff; // Toggle
        dispatch(toggleVideo());
      }
    }
  };

  // Flip camera (mobile)
  const handleFlipCamera = async () => {
    if (!localStreamRef.current || !isVideoCall) return;
    const nextMode = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: true,
      });

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }

      if (oldVideoTrack) oldVideoTrack.stop();
      localStreamRef.current = newStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
      setFacingMode(nextMode);
    } catch (err) {
      console.error("Failed to switch camera:", err);
    }
  };

  if (callState === "idle" && !callNotification) return null;

  return (
    <>
      {/* -------------------- CALL NOTIFICATION POPUP (Toast Banner) -------------------- */}
      {callNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
          <div className="bg-[#18181b]/95 backdrop-blur-2xl border border-red-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-500/60 bg-gray-900">
                  <img
                    src={callNotification.image || dp}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                  <MdCallEnd size={12} />
                </div>
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs uppercase tracking-wider font-bold text-red-400">
                  {callNotification.title}
                </span>
                <span className="text-sm font-semibold text-white truncate">
                  {callNotification.message}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissNotification}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex-shrink-0"
              aria-label="Dismiss"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* -------------------- FULL SCREEN CALL MODAL -------------------- */}
      {callState !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
          {/* Dedicated audio element for remote stream playback during voice calls */}
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            muted={isVideoCall}
          />
      {/* -------------------- 1. INCOMING CALL DIALOG -------------------- */}
      {callState === "incoming" && (
        <div className="flex flex-col items-center justify-between p-8 w-full max-w-sm h-[480px] bg-gradient-to-b from-[#18181b] to-black rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center animate-in zoom-in-95">
          <div className="flex flex-col items-center mt-4">
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">
              {isVideoCall ? "Incoming Video Call" : "Incoming Voice Call"}
            </span>

            {/* Pulsing Avatar */}
            <div className="relative my-6">
              <div className="absolute -inset-3 rounded-full bg-indigo-500/20 animate-ping duration-1000" />
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500 shadow-2xl relative z-10 bg-gray-900">
                <img
                  src={partnerImage}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white leading-tight">
              {partnerName}
            </h3>
            <p className="text-sm text-gray-400">@{partnerUsername}</p>
          </div>

          {/* Action Buttons: Decline / Accept */}
          <div className="w-full flex items-center justify-around mb-2">
            {/* Decline */}
            <button
              type="button"
              onClick={handleRejectCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-600/30 transition-transform active:scale-90 cursor-pointer"
            >
              <MdCallEnd size={28} />
            </button>

            {/* Accept */}
            <button
              type="button"
              onClick={handleAcceptCall}
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-green-600/30 transition-transform active:scale-90 cursor-pointer animate-bounce"
            >
              <MdCall size={28} />
            </button>
          </div>
        </div>
      )}

      {/* -------------------- 2. CALLING / OUTGOING DIALOG -------------------- */}
      {callState === "calling" && (
        <div className="flex flex-col items-center justify-between p-8 w-full max-w-sm h-[480px] bg-gradient-to-b from-[#18181b] to-black rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center animate-in zoom-in-95">
          <div className="flex flex-col items-center mt-4">
            <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2">
              {isVideoCall ? "Video Calling..." : "Voice Calling..."}
            </span>

            {/* Pulsing Avatar */}
            <div className="relative my-6">
              <div className="absolute -inset-4 rounded-full bg-purple-500/20 animate-pulse duration-1000" />
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 shadow-2xl relative z-10 bg-gray-900">
                <img
                  src={partnerImage}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white leading-tight">
              {partnerName}
            </h3>
            <p className="text-sm text-gray-400">@{partnerUsername}</p>
            <p className="text-xs text-gray-500 mt-2 animate-pulse">Ringing...</p>
          </div>

          {/* End Call Button */}
          <div className="w-full flex items-center justify-center mb-2">
            <button
              type="button"
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-transform active:scale-90 cursor-pointer"
              title="Cancel call"
            >
              <MdCallEnd size={28} />
            </button>
          </div>
        </div>
      )}

      {/* -------------------- 3. ACTIVE CONNECTED CALL SCREEN -------------------- */}
      {callState === "connected" && (
        <div className="relative w-full h-full max-w-5xl max-h-screen sm:max-h-[90vh] bg-black sm:rounded-3xl overflow-hidden flex flex-col justify-between border border-gray-800 shadow-2xl">
          {/* Top Header Bar */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-gray-900">
                <img
                  src={partnerImage}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-white drop-shadow">
                  {partnerName}
                </span>
                <span className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {formatCallTime(callDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Main Remote Video or Audio Screen */}
          <div className="relative w-full h-full flex items-center justify-center bg-gray-950 overflow-hidden">
            {isVideoCall ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping duration-1000" />
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-indigo-500 bg-gray-900 shadow-2xl relative z-10">
                    <img
                      src={partnerImage}
                      alt={partnerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 h-6">
                  {[40, 75, 100, 60, 85, 45, 95, 70, 50, 90, 60].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Local Video Picture-in-Picture (Top-right floating window) */}
            {isVideoCall && (
              <div className="absolute top-16 right-4 sm:top-20 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-700/80 shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    facingMode === "user" ? "-scale-x-100" : ""
                  }`}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-gray-500 gap-1">
                    <FiVideoOff size={22} />
                    <span className="text-[10px] font-semibold">Camera Off</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Floating Controls Bar */}
          <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-4 px-4">
            <div className="bg-[#18181b]/90 backdrop-blur-xl border border-gray-700/70 rounded-full px-5 py-3 flex items-center gap-4 shadow-2xl">
              {/* Mute Mic Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition cursor-pointer ${
                  isMuted ? "bg-red-500" : "bg-gray-800 hover:bg-gray-700"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
              </button>

              {/* Video Camera Toggle */}
              {isVideoCall && (
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition cursor-pointer ${
                    isVideoOff ? "bg-red-500" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                  title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                </button>
              )}

              {/* Flip Camera (Mobile) */}
              {isVideoCall && (
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition cursor-pointer sm:hidden"
                  title="Flip Camera"
                >
                  <FiRefreshCw size={19} />
                </button>
              )}

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-red-600/40 cursor-pointer"
                title="End Call"
              >
                <MdCallEnd size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )}
    </>
  );
}

export default CallModal;