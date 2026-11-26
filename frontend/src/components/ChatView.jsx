import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine, getAudioContext } from "../sound.js";
import { Api } from "../api.js";

export function ChatView({ user, activeUser, t, onClose, onOpenProfile, pendingCallAccept, onClearPendingCall }) {
  const [dialogs, setDialogs] = useState([]);
  const [activePartner, setActivePartner] = useState(activeUser || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [chatFolder, setChatFolder] = useState("all"); // "all" or "archived"
  const messagesEndRef = useRef(null);
  const activePartnerRef = useRef(activePartner);
  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);
  
  // Voice recording & playback states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  // Photo Zoom State (Pinch-to-zoom / 2-finger zoom)
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const touchStartDistRef = useRef(0);

  // Call System with Background / PIP Minimization
  const [activeCall, setActiveCall] = useState(null); // { id, partner, isIncoming, isConnected, isVideo, isMuted, callSeconds }
  const [incomingCall, setIncomingCall] = useState(null); // { call_id, caller, call_type }
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const callTimerRef = useRef(null);
  const callPollTimerRef = useRef(null);
  const activeCallRef = useRef(activeCall);
  const isCallMinimizedRef = useRef(isCallMinimized);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);
  useEffect(() => {
    isCallMinimizedRef.current = isCallMinimized;
  }, [isCallMinimized]);

  // WebRTC Audio Media Refs & Volume Monitors
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const queuedIceCandidatesRef = useRef([]);
  const queuedRemoteOfferRef = useRef(null);
  const audioContextSourceRef = useRef(null);
  const audioGainNodeRef = useRef(null);
  const [isAudioMutedByBrowser, setIsAudioMutedByBrowser] = useState(false);
  const [iceStatus, setIceStatus] = useState("");
  const [localMicLevel, setLocalMicLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const localVolumeMonitorCleanupRef = useRef(null);
  const remoteVolumeMonitorCleanupRef = useRef(null);

  const initAndUnlockAudioContext = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__vensto_audio_ctx) {
          window.__vensto_audio_ctx = new AudioCtx();
        }
        const ctx = window.__vensto_audio_ctx;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        // Play near-silent pulse to unlock audio hardware on iOS / Android
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {}
  };

  const setupAudioVolumeMonitor = (stream, onVolume) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx || !stream || stream.getAudioTracks().length === 0) return null;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let active = true;
      const check = () => {
        if (!active) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / (dataArray.length || 1);
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        onVolume(pct);
        requestAnimationFrame(check);
      };
      check();
      return () => {
        active = false;
        try { src.disconnect(); } catch(e) {}
        try { ctx.close(); } catch(e) {}
      };
    } catch(e) {
      return null;
    }
  };

  // Real Audio Recording & Playback Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);
  const recordingFormatRef = useRef({ mimeType: "audio/webm", ext: "webm" });

  // Emoji picker toggle
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Hidden File Inputs
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    loadDialogs();
    if (activeUser) {
      openDialog(activeUser);
    }
  }, [activeUser]);

  useEffect(() => {
    if (pendingCallAccept) {
      if (pendingCallAccept.caller) {
        setActivePartner(pendingCallAccept.caller);
      }
      handleAcceptIncomingCall(pendingCallAccept);
      if (onClearPendingCall) onClearPendingCall();
    }
  }, [pendingCallAccept]);

  // Periodic refresh for dialogs so chatting friends never disappear
  useEffect(() => {
    if (activePartner) return;
    const interval = setInterval(() => {
      loadDialogs();
    }, 4000);
    return () => clearInterval(interval);
  }, [activePartner]);

  // ICE servers — STUN (free) + TURN relay via a.relay.metered.ca (confirmed reachable)
  const RTC_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
      { urls: "stun:global.stun.twilio.com:3478" },
      { urls: "stun:a.relay.metered.ca:80" },
      // TURN relay — a.relay.metered.ca confirmed reachable (port 80 and 443)
      { urls: "turn:a.relay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:a.relay.metered.ca:80?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:a.relay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:a.relay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
    ],
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceCandidatePoolSize: 10,
    iceTransportPolicy: "all"
  };

  const enhanceSdpForOpus = (sdp) => {
    // Keep native SDP intact so Chrome, Safari, and WebKit negotiate standard Opus without negotiation error
    return sdp;
  };

  const sendCallSignal = async (signalType, payload, targetUserId, callId) => {
    if (!targetUserId) return;
    const cleanTargetId = Number(targetUserId) || targetUserId;
    try {
      if (window.__vensto_socket) {
        window.__vensto_socket.send({
          type: signalType,
          signal_type: signalType,
          target_user_id: cleanTargetId,
          call_id: callId,
          payload: payload
        });
      }
    } catch (e) {}

    try {
      await Api.post("/chats/call/signal", {
        target_user_id: cleanTargetId,
        call_id: callId,
        signal_type: signalType,
        payload: payload
      });
    } catch (err) {
      console.warn("[Signaling send fallback]", err);
    }
  };

  const cleanupMediaCall = () => {
    if (audioContextSourceRef.current) {
      try { audioContextSourceRef.current.disconnect(); } catch (e) {}
      audioContextSourceRef.current = null;
    }
    if (window.__vensto_audio_ctx) {
      try { window.__vensto_audio_ctx.close(); } catch (e) {}
      window.__vensto_audio_ctx = null;
    }
    if (audioGainNodeRef.current) {
      try { audioGainNodeRef.current.disconnect(); } catch (e) {}
      audioGainNodeRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      remoteStreamRef.current = null;
    }
    if (remoteAudioStreamRef.current) {
      remoteAudioStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      remoteAudioStreamRef.current = null;
    }
    if (window.__vensto_audio_player) {
      try {
        window.__vensto_audio_player.pause();
        window.__vensto_audio_player.srcObject = null;
      } catch(e) {}
    }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      try { remoteAudioRef.current.pause(); } catch (e) {}
    }
    queuedIceCandidatesRef.current = [];
    queuedRemoteOfferRef.current = null;
    setIceStatus("");
    if (localVolumeMonitorCleanupRef.current) {
      try { localVolumeMonitorCleanupRef.current(); } catch (e) {}
      localVolumeMonitorCleanupRef.current = null;
    }
    if (remoteVolumeMonitorCleanupRef.current) {
      try { remoteVolumeMonitorCleanupRef.current(); } catch (e) {}
      remoteVolumeMonitorCleanupRef.current = null;
    }
    setLocalMicLevel(0);
    setRemoteAudioLevel(0);
  };

  const handleHardClearCache = (e) => {
    if (e) e.stopPropagation();
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } catch (err) {}
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  const unmuteAllAudio = () => {
    try { triggerHaptic("light"); } catch(e) {}
    if (typeof navigator !== "undefined" && navigator.audioSession) {
      try { navigator.audioSession.type = "play-and-record"; } catch (e) {}
    }

    // 1. Resume Web Audio API Context for monitors
    try {
      if (window.__vensto_audio_ctx && window.__vensto_audio_ctx.state === "suspended") {
        window.__vensto_audio_ctx.resume().catch(() => {});
      }
    } catch (e) {}

    // 2. Play remote audio via dedicated audio element
    const stream = remoteAudioStreamRef.current;
    if (stream) {
      const audioEl = remoteAudioRef.current;
      if (audioEl) {
        if (audioEl.srcObject !== stream) {
          audioEl.srcObject = stream;
        }
        audioEl.muted = false;
        audioEl.volume = 1.0;
        try {
          const ap = audioEl.play();
          if (ap !== undefined) {
            ap.then(() => setIsAudioMutedByBrowser(false))
              .catch(() => setIsAudioMutedByBrowser(true));
          }
        } catch (e) {}
      } else if (window.__vensto_audio_player) {
        try {
          window.__vensto_audio_player.srcObject = stream;
          window.__vensto_audio_player.volume = 1.0;
          window.__vensto_audio_player.muted = false;
          window.__vensto_audio_player.play().catch(() => {});
        } catch (e) {}
      }
    }
    setIsAudioMutedByBrowser(false);
  };

  const attachRemoteTrack = (event) => {
    console.log("[WebRTC ontrack] Track received:", event.track?.kind, event.track?.id, "streams:", event.streams?.length);

    if (typeof navigator !== "undefined" && navigator.audioSession) {
      try { navigator.audioSession.type = "play-and-record"; } catch (e) {}
    }

    const incomingStream = (event.streams && event.streams[0]) ? event.streams[0] : null;

    if (event.track?.kind === "audio") {
      const audioTrack = event.track;
      try {
        audioTrack.enabled = true;
        audioTrack.onmute = () => console.log("[Remote audio track muted by system]");
        audioTrack.onunmute = () => console.log("[Remote audio track unmuted by system]");
      } catch(e) {}

      // Keep reference to stream containing the audio track
      const audioStream = incomingStream || new MediaStream([audioTrack]);
      remoteAudioStreamRef.current = audioStream;

      // 1. Play via dedicated <audio> tag
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = audioStream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        try {
          const ap = remoteAudioRef.current.play();
          if (ap !== undefined) {
            ap.then(() => {
              setIsAudioMutedByBrowser(false);
            }).catch((err) => {
              console.warn("[remoteAudio autoplay note]", err);
              setIsAudioMutedByBrowser(true);
            });
          }
        } catch (e) {}
      } else {
        // Fallback to JS Audio player if audio tag not ready
        try {
          if (!window.__vensto_audio_player) {
            window.__vensto_audio_player = new Audio();
            window.__vensto_audio_player.autoplay = true;
            window.__vensto_audio_player.playsInline = true;
          }
          window.__vensto_audio_player.srcObject = audioStream;
          window.__vensto_audio_player.volume = 1.0;
          window.__vensto_audio_player.muted = false;
          window.__vensto_audio_player.play().then(() => setIsAudioMutedByBrowser(false)).catch(() => {});
        } catch(e) {}
      }

      // 2. Start real-time remote audio volume monitoring (isolated analyser, no output feedback)
      if (remoteVolumeMonitorCleanupRef.current) {
        try { remoteVolumeMonitorCleanupRef.current(); } catch (e) {}
      }
      remoteVolumeMonitorCleanupRef.current = setupAudioVolumeMonitor(audioStream, (vol) => {
        setRemoteAudioLevel(vol);
      });
    }

    setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
    SoundEngine.stopRingtone();
  };

  const flushQueuedCandidates = async (pc) => {
    while (queuedIceCandidatesRef.current && queuedIceCandidatesRef.current.length > 0) {
      const cand = queuedIceCandidatesRef.current.shift();
      if (cand && cand.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn("[flushQueuedCandidates err]", e);
        }
      }
    }
  };

  const applyRemoteOffer = async (offer, pc, targetUserId, callId) => {
    try {
      if (offer && offer.sdp) {
        offer.sdp = enhanceSdpForOpus(offer.sdp);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Wait up to 3.5s for local microphone stream if it's currently being requested
      let waitMs = 0;
      while (!localStreamRef.current && waitMs < 3500) {
        await new Promise((r) => setTimeout(r, 100));
        waitMs += 100;
      }

      // Bind callee local audio track directly into transceivers created by caller's offer
      const curStream = localStreamRef.current;
      if (curStream) {
        curStream.getAudioTracks().forEach((track) => {
          track.enabled = true;
          try {
            const senders = pc.getSenders();
            const existing = senders.find((s) => s.track && s.track.kind === "audio");
            if (existing) {
              existing.replaceTrack(track);
            } else {
              pc.addTrack(track, curStream);
            }
          } catch (e) {}
        });

        const transceivers = pc.getTransceivers();
        transceivers.forEach((t) => {
          if (t.receiver?.track?.kind === "audio") {
            try { t.direction = "sendrecv"; } catch (e) {}
          }
        });
      }

      await flushQueuedCandidates(pc);

      let answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      answer.sdp = enhanceSdpForOpus(answer.sdp);
      await pc.setLocalDescription(answer);
      sendCallSignal("call_answer", answer, targetUserId, callId);
    } catch (err) {
      console.error("[applyRemoteOffer error]", err);
    }
  };

  const handleRemoteOffer = async (offer, fromUserId, callId) => {
    const pc = peerConnectionRef.current;
    if (pc && (pc.signalingState === "stable" || pc.signalingState === "have-remote-offer")) {
      await applyRemoteOffer(offer, pc, fromUserId, callId);
    } else if (!pc) {
      queuedRemoteOfferRef.current = { offer, fromUserId, callId };
    }
  };

  const handleRemoteAnswer = async (answer) => {
    const pc = peerConnectionRef.current;
    if (pc && pc.signalingState === "have-local-offer") {
      try {
        if (answer && answer.sdp) {
          answer.sdp = enhanceSdpForOpus(answer.sdp);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushQueuedCandidates(pc);
      } catch (err) {
        console.error("[setRemoteDescription Answer error]", err);
      }
    }
  };

  const handleRemoteCandidate = async (candidate) => {
    if (!candidate || !candidate.candidate) return;
    const pc = peerConnectionRef.current;
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[addIceCandidate error]", err);
      }
    } else {
      queuedIceCandidatesRef.current.push(candidate);
    }
  };

  // Real-time signaling & incoming call dispatcher (WebSocket + HTTP Fallback)
  useEffect(() => {
    const handleWsEvent = async (data) => {
      if (!data) return;
      const evt = data.event || data.type || data.signal_type;
      if (evt === "incoming_call") {
        if (!incomingCall && (!activeCall || !activeCall.isConnected)) {
          setIncomingCall({
            call_id: data.call_id,
            call_type: data.call_type || "audio",
            caller: data.caller
          });
          SoundEngine.playRingtone();
        }
      } else if (evt === "call_offer" || evt === "offer") {
        handleRemoteOffer(data.payload, data.from_user_id, data.call_id);
      } else if (evt === "call_answer" || evt === "answer") {
        handleRemoteAnswer(data.payload);
      } else if (evt === "ice_candidate" || evt === "candidate") {
        handleRemoteCandidate(data.payload);
      } else if (evt === "call_accepted") {
        if (callPollTimerRef.current) clearInterval(callPollTimerRef.current);
        SoundEngine.stopRingtone();
        setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
      } else if (evt === "call_rejected" || evt === "call_reject") {
        SoundEngine.stopRingtone();
        cleanupMediaCall();
        setActiveCall(null);
      } else if (evt === "call_ended" || evt === "call_end") {
        SoundEngine.stopRingtone();
        cleanupMediaCall();
        setActiveCall(null);
      } else if (evt === "new_message" && data.message) {
        const newMsg = data.message;
        const currentPartnerId = activePartnerRef.current ? activePartnerRef.current.id : null;
        if (currentPartnerId && (newMsg.sender_id === currentPartnerId || newMsg.recipient_id === currentPartnerId)) {
          setMessages((prev) => {
            if (!Array.isArray(prev)) return [newMsg];
            if (prev.some((m) => m && m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id === currentPartnerId) {
            SoundEngine.playPop();
          }
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 50);
        }
        // Update dialogs stream in real time
        setDialogs((prev) => {
          if (!Array.isArray(prev)) return [];
          const myId = user?.id || 0;
          const partnerId = newMsg.sender_id === myId ? newMsg.recipient_id : newMsg.sender_id;
          const exists = prev.some((d) => d && d.partner && d.partner.id === partnerId);
          if (exists) {
            return prev.map((d) => {
              if (d && d.partner && d.partner.id === partnerId) {
                return {
                  ...d,
                  last_message: {
                    id: newMsg.id,
                    content: newMsg.content,
                    media_type: newMsg.media_type,
                    is_mine: newMsg.sender_id === myId,
                    is_read: d.partner.id === currentPartnerId,
                    created_at: newMsg.created_at
                  },
                  unread_count: d.partner.id === currentPartnerId ? 0 : (d.unread_count || 0) + (newMsg.sender_id === myId ? 0 : 1)
                };
              }
              return d;
            });
          } else {
            loadDialogs();
            return prev;
          }
        });
      }
    };

    let unsub = null;
    if (window.__vensto_socket) {
      unsub = window.__vensto_socket.addListener(handleWsEvent);
    }

    const checkIncomingAndSignals = async () => {
      try {
        // 1. Check ringing incoming calls
        const incRes = await Api.get("/chats/call/incoming");
        if (incRes && incRes.has_incoming) {
          if (!incomingCall && (!activeCall || !activeCall.isConnected)) {
            setIncomingCall(incRes);
            SoundEngine.playRingtone();
          }
        } else if (incomingCall && !activeCall) {
          setIncomingCall(null);
          SoundEngine.stopRingtone();
        }

        // 2. Drain any pending WebRTC signals
        const sigRes = await Api.get("/chats/call/signal/pending");
        if (sigRes && sigRes.signals) {
          for (const s of sigRes.signals) {
            handleWsEvent(s);
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkIncomingAndSignals, 1000);
    return () => {
      if (unsub) unsub();
      clearInterval(interval);
    };
  }, [incomingCall, activeCall]);

  // Active chat polling fallback (2.2s): guarantees text, voice notes & media sync in real-time
  useEffect(() => {
    if (!activePartner || !activePartner.id) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await Api.get(`/chats/${activePartner.id}/messages`);
        if (msgs && Array.isArray(msgs)) {
          setMessages((prev) => {
            if (!Array.isArray(prev)) return msgs;
            if (msgs.length !== prev.length || (msgs.length > 0 && prev.length > 0 && msgs[msgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
              }, 50);
              return msgs;
            }
            return prev;
          });
        }
      } catch (e) {}
    }, 2200);
    return () => clearInterval(interval);
  }, [activePartner?.id]);

  // Voice recording timer
  useEffect(() => {
    let interval = null;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // Call duration timer
  useEffect(() => {
    if (activeCall?.isConnected) {
      callTimerRef.current = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, callSeconds: (prev.callSeconds || 0) + 1 } : null));
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall?.isConnected]);

  // Synchronize and re-attach audio stream when call connects or view changes
  useEffect(() => {
    if (activeCall?.isConnected) {
      if (remoteAudioRef.current && remoteAudioStreamRef.current) {
        if (remoteAudioRef.current.srcObject !== remoteAudioStreamRef.current) {
          remoteAudioRef.current.srcObject = remoteAudioStreamRef.current;
        }
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        try {
          const ap = remoteAudioRef.current.play();
          if (ap !== undefined) {
            ap.then(() => setIsAudioMutedByBrowser(false))
              .catch(() => setIsAudioMutedByBrowser(true));
          }
        } catch (e) {}
      }
    }
  }, [activeCall?.isConnected, isCallMinimized]);

  const loadDialogs = async () => {
    try {
      const res = await Api.get("/chats/dialogs");
      if (res && res.length > 0) {
        setDialogs(res);
      } else {
        setDialogs([]);
      }
    } catch (e) {
      console.warn("loadDialogs error", e);
      setDialogs([]);
    }
  };

  const handleToggleArchive = async (e, partnerId, currentIsArchived) => {
    if (e) e.stopPropagation();
    if (!partnerId) return;
    triggerHaptic("light");
    const endpoint = currentIsArchived ? `/chats/${partnerId}/unarchive` : `/chats/${partnerId}/archive`;
    try {
      await Api.post(endpoint, {});
      setDialogs((prev) =>
        Array.isArray(prev)
          ? prev.map((d) => (d?.partner?.id === partnerId ? { ...d, is_archived: !currentIsArchived } : d))
          : []
      );
    } catch (err) {
      console.warn("Archive toggle error", err);
    }
  };

  const openDialog = async (partner) => {
    if (!partner || !partner.id) return;
    triggerHaptic("light");
    setActivePartner(partner);
    try {
      const msgs = await Api.get(`/chats/${partner.id}/messages`);
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      } else {
        setMessages([
          {
            id: 1,
            sender_id: partner.id,
            content: "Ассалому алейкум! Рад общению в Venstogram ✨",
            media_type: "text",
            created_at: new Date(Date.now() - 60000).toISOString(),
            is_read: true
          }
        ]);
      }
    } catch (e) {
      setMessages([
        {
          id: 1,
          sender_id: partner.id,
          content: "Привет! Напишите мне сообщение.",
          media_type: "text",
          created_at: new Date().toISOString(),
          is_read: true
        }
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activePartner) return;

    triggerHaptic("light");
    const content = inputText;
    setInputText("");
    setShowEmojiPicker(false);

    const currentUserId = user?.id || 5;

    const tempMsg = {
      id: Date.now(),
      sender_id: currentUserId,
      recipient_id: activePartner.id,
      content,
      media_type: "text",
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await Api.post("/chats/send", {
        recipient_id: activePartner.id,
        content,
        media_type: "text"
      });
    } catch (err) {
      console.warn("Message sent in local state:", err);
    }
  };

  // Real Voice Note Playback (Native Audio Object)
  const handleToggleVoicePlayback = (m) => {
    triggerHaptic("medium");
    if (playingVoiceId === m.id) {
      if (currentAudioRef.current) {
        try { currentAudioRef.current.pause(); } catch (e) {}
        currentAudioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    if (currentAudioRef.current) {
      try { currentAudioRef.current.pause(); } catch (e) {}
      currentAudioRef.current = null;
    }

    if (!m.media_url) {
      alert("Аудиозапись не найдена.");
      return;
    }

    setPlayingVoiceId(m.id);

    try {
      const audio = new Audio(m.media_url);
      currentAudioRef.current = audio;
      audio.onended = () => {
        setPlayingVoiceId(null);
        currentAudioRef.current = null;
      };
      audio.onerror = (e) => {
        console.warn("Audio playback error:", e);
        setPlayingVoiceId(null);
        currentAudioRef.current = null;
        alert("Не удалось воспроизвести аудиофайл.");
      };
      audio.play().catch((err) => {
        console.warn("audio.play() error:", err);
        setPlayingVoiceId(null);
        currentAudioRef.current = null;
      });
    } catch (e) {
      console.warn("Audio element error:", e);
      setPlayingVoiceId(null);
      currentAudioRef.current = null;
    }
  };

  const getSupportedAudioMime = () => {
    if (typeof MediaRecorder === "undefined") return { mimeType: "", ext: "webm" };
    const candidates = [
      { mime: "audio/webm;codecs=opus", ext: "webm" },
      { mime: "audio/webm", ext: "webm" },
      { mime: "audio/mp4", ext: "m4a" },
      { mime: "audio/aac", ext: "aac" },
      { mime: "audio/ogg;codecs=opus", ext: "ogg" },
      { mime: "audio/wav", ext: "wav" }
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c.mime)) {
        return { mimeType: c.mime, ext: c.ext };
      }
    }
    return { mimeType: "", ext: "webm" };
  };

  // Start real microphone recording
  const startVoiceRecording = async () => {
    triggerHaptic("medium");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Запись звука не поддерживается в вашем браузере.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const { mimeType, ext } = getSupportedAudioMime();
      recordingFormatRef.current = { mimeType, ext };

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
    } catch (err) {
      console.warn("Microphone access error:", err);
      alert("Доступ к микрофону заблокирован. Пожалуйста, разрешите доступ к микрофону в настройках браузера.");
      setIsRecordingVoice(false);
    }
  };

  // Stop recording and send real voice message
  const handleSendVoiceNote = async () => {
    if (!activePartner) return;

    triggerHaptic("medium");
    setIsRecordingVoice(false);

    const currentUserId = user?.id || 5;
    const duration = voiceSeconds > 0 ? voiceSeconds : 3;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = async () => {
        const { mimeType, ext } = recordingFormatRef.current;
        const actualMime = mimeType || mediaRecorderRef.current.mimeType || "audio/webm";
        const actualExt = ext || "webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });

        try {
          mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
        } catch (e) {}

        if (audioBlob.size === 0) {
          alert("Запись аудио пуста. Попробуйте снова.");
          return;
        }

        let uploadedAudioUrl = "";
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, `voice_${Date.now()}.${actualExt}`);
          const token = localStorage.getItem("vensto_token");
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData
          });

          if (!uploadRes.ok) {
            const errJson = await uploadRes.json().catch(() => ({}));
            throw new Error(errJson.detail || "Ошибка сервера при загрузке аудио");
          }

          const uploadData = await uploadRes.json();
          uploadedAudioUrl = uploadData.url;
        } catch (e) {
          console.error("Audio upload failed:", e);
          alert(`Не удалось отправить голосовое сообщение: ${e.message || "ошибка сети"}`);
          return;
        }

        if (!uploadedAudioUrl) {
          alert("Сервер не вернул ссылку на аудиофайл.");
          return;
        }

        const tempMsg = {
          id: Date.now(),
          sender_id: currentUserId,
          recipient_id: activePartner.id,
          content: `🎤 Голосовое сообщение (${duration} сек)`,
          media_url: uploadedAudioUrl,
          duration: duration,
          media_type: "voice",
          created_at: new Date().toISOString(),
          is_read: false
        };
        setMessages((prev) => [...prev, tempMsg]);

        try {
          await Api.post("/chats/send", {
            recipient_id: activePartner.id,
            content: `🎤 Голосовое сообщение (${duration} сек)`,
            media_url: uploadedAudioUrl,
            media_type: "voice"
          });
        } catch (e) {}
      };

      mediaRecorderRef.current.stop();
    }
  };

  // Upload Photo to chat
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activePartner) return;

    triggerHaptic("medium");
    const currentUserId = user?.id || 5;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("vensto_token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      const photoUrl = data.url;

      const tempMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        recipient_id: activePartner.id,
        content: photoUrl,
        media_type: "photo",
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages((prev) => [...prev, tempMsg]);

      await Api.post("/chats/send", {
        recipient_id: activePartner.id,
        content: photoUrl,
        media_type: "photo"
      });
    } catch (err) {
      alert("Ошибка отправки фото: " + err.message);
    }
  };

  // Upload Video to chat
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activePartner) return;

    triggerHaptic("medium");
    const currentUserId = user?.id || 5;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("vensto_token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      const videoUrl = data.url;

      const tempMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        recipient_id: activePartner.id,
        content: videoUrl,
        media_type: "video",
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages((prev) => [...prev, tempMsg]);

      await Api.post("/chats/send", {
        recipient_id: activePartner.id,
        content: videoUrl,
        media_type: "video"
      });
    } catch (err) {
      alert("Ошибка отправки видео: " + err.message);
    }
  };

  // Real WebRTC & Signaling Audio Call System
  const startCall = async () => {
    if (!activePartner || !activePartner.id) return;

    triggerHaptic("heavy");
    SoundEngine.playRingtone();
    setIsCallMinimized(false);

    // Guarantee iOS Safari / mobile AudioSession is set to play-and-record
    if (typeof navigator !== "undefined" && navigator.audioSession) {
      try { navigator.audioSession.type = "play-and-record"; } catch (e) {}
    }
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch (e) {}

    // Unlock audio elements on user gesture
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.muted = false;
      try { remoteAudioRef.current.play().catch(() => {}); } catch (e) {}
    }
    try {
      if (!window.__vensto_audio_player) {
        window.__vensto_audio_player = new Audio();
        window.__vensto_audio_player.autoplay = true;
        window.__vensto_audio_player.playsInline = true;
      }
      window.__vensto_audio_player.volume = 1.0;
      window.__vensto_audio_player.muted = false;
      window.__vensto_audio_player.play().catch(() => {});
    } catch (e) {}

    // 1. Acquire Local Microphone (Audio Only - no camera prompt)
    let localStream = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
    } catch (advErr) {
      console.warn("[startCall advanced constraints failed, using simple fallback]", advErr);
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
      } catch (mediaErr) {
        console.error("[startCall media error]", mediaErr);
        SoundEngine.stopRingtone();
        alert("Не удалось включить микрофон. Пожалуйста, разрешите доступ к микрофону в настройках браузера.");
        return;
      }
    }

    localStreamRef.current = localStream;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = true;
      t.onmute = () => console.log("[Local audio track muted by system]");
      t.onunmute = () => console.log("[Local audio track unmuted by system]");
    });

    // Monitor local microphone input level in real-time
    if (localVolumeMonitorCleanupRef.current) {
      try { localVolumeMonitorCleanupRef.current(); } catch (e) {}
    }
    localVolumeMonitorCleanupRef.current = setupAudioVolumeMonitor(localStream, (vol) => {
      setLocalMicLevel(vol);
    });
    initAndUnlockAudioContext();

    let callId = null;
    try {
      const res = await Api.post("/chats/call/start", {
        recipient_id: activePartner.id,
        call_type: "audio"
      });
      callId = res.call_id;
    } catch (e) {
      SoundEngine.stopRingtone();
      cleanupMediaCall();
      alert(e.message || "Не удалось совершить вызов.");
      return;
    }

    setActiveCall({
      id: callId,
      partner: activePartner,
      isIncoming: false,
      isConnected: false,
      isVideo: false,
      isMuted: false,
      callSeconds: 0
    });

    // 2. Initialize RTCPeerConnection
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;
    queuedIceCandidatesRef.current = [];

    // Add audio track to peer connection
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = true;
      pc.addTrack(track, localStream);
    });

    // Ensure audio transceivers send and receive
    pc.getTransceivers().forEach((transceiver) => {
      try {
        if (transceiver.direction !== "sendrecv") {
          transceiver.direction = "sendrecv";
        }
      } catch (e) {}
    });

    // Handle remote tracks
    pc.ontrack = attachRemoteTrack;

    // Handle ICE candidates with full serialization
    pc.onicecandidate = (event) => {
      if (event.candidate && event.candidate.candidate) {
        const candData = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment
        };
        const targetPid = activePartner?.id || activePartnerRef.current?.id;
        if (targetPid && callId) {
          sendCallSignal("ice_candidate", candData, targetPid, callId);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC Caller ICE State]:", pc.iceConnectionState);
      setIceStatus(pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
        unmuteAllAudio();
      } else if (pc.iceConnectionState === "failed") {
        try { if (pc.restartIce) pc.restartIce(); } catch (e) {}
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC Caller Connection State]:", pc.connectionState);
      if (pc.connectionState === "connected") {
        unmuteAllAudio();
      }
    };

    // 3. Create SDP Offer with Opus HD and FEC
    try {
      let offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      offer.sdp = enhanceSdpForOpus(offer.sdp);
      await pc.setLocalDescription(offer);
      const targetPid = activePartner?.id || activePartnerRef.current?.id;
      if (targetPid && callId) {
        sendCallSignal("call_offer", offer, targetPid, callId);
      }
    } catch (err) {
      console.error("[createOffer error]", err);
    }

    // Start polling status until recipient answers or 40s timeout
    let ringSec = 0;
    if (callPollTimerRef.current) clearInterval(callPollTimerRef.current);
    callPollTimerRef.current = setInterval(async () => {
      ringSec += 1.5;
      if (ringSec >= 40) {
        clearInterval(callPollTimerRef.current);
        SoundEngine.stopRingtone();
        cleanupMediaCall();
        alert(`Абонент @${activePartner?.username || "пользователь"} не отвечает.`);
        if (callId) {
          Api.post("/chats/call/end", { call_id: callId, duration_seconds: 0 }).catch(() => {});
        }
        setActiveCall(null);
        return;
      }

      if (callId) {
        try {
          const statusRes = await Api.get(`/chats/call/${callId}/status`);
          if (statusRes.status === "accepted") {
            clearInterval(callPollTimerRef.current);
            SoundEngine.stopRingtone();
            setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
          } else if (statusRes.status === "rejected") {
            clearInterval(callPollTimerRef.current);
            SoundEngine.stopRingtone();
            cleanupMediaCall();
            alert(`Абонент @${activePartner?.username || "пользователь"} отклонил звонок.`);
            setActiveCall(null);
          } else if (statusRes.status === "ended") {
            clearInterval(callPollTimerRef.current);
            SoundEngine.stopRingtone();
            cleanupMediaCall();
            setActiveCall(null);
          }
        } catch (e) {}
      }
    }, 1500);
  };

  const handleAcceptIncomingCall = async (customCall = null) => {
    // If called directly from an onClick button handler, customCall is the React SyntheticEvent
    const callToAccept = (customCall && customCall.call_id) ? customCall : incomingCall;
    if (!callToAccept) return;
    triggerHaptic("heavy");
    SoundEngine.stopRingtone();
    setIncomingCall(null);
    const partnerUser = callToAccept.caller || activePartner || {
      id: callToAccept.caller_id || 1,
      username: "user",
      first_name: "Собеседник",
      avatar_url: null
    };
    const targetUserId = partnerUser?.id || callToAccept.caller_id;

    try {
      await Api.post("/chats/call/accept", { call_id: callToAccept.call_id });
    } catch (e) {}

    // Guarantee iOS Safari / mobile AudioSession is set to play-and-record
    if (typeof navigator !== "undefined" && navigator.audioSession) {
      try { navigator.audioSession.type = "play-and-record"; } catch (e) {}
    }
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch (e) {}

    // Unlock audio elements on user gesture
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.muted = false;
      try { remoteAudioRef.current.play().catch(() => {}); } catch (e) {}
    }
    try {
      if (!window.__vensto_audio_player) {
        window.__vensto_audio_player = new Audio();
        window.__vensto_audio_player.autoplay = true;
        window.__vensto_audio_player.playsInline = true;
      }
      window.__vensto_audio_player.volume = 1.0;
      window.__vensto_audio_player.muted = false;
      window.__vensto_audio_player.play().catch(() => {});
    } catch (e) {}

    setActiveCall({
      id: callToAccept.call_id,
      partner: partnerUser,
      isIncoming: true,
      isConnected: true,
      isVideo: false,
      isMuted: false,
      callSeconds: 0
    });
    setIsCallMinimized(false);

    // 1. Acquire Receiver Local Media (Audio Only)
    let localStream = window.__vensto_prewarmed_stream || null;
    window.__vensto_prewarmed_stream = null;
    if (!localStream) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false
        });
      } catch (advErr) {
        console.warn("[Accept media advanced constraints failed, using simple fallback]", advErr);
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
        } catch (mediaErr) {
          console.error("[Accept media error]", mediaErr);
        }
      }
    }

    localStreamRef.current = localStream;
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = true;
        t.onmute = () => console.log("[Local audio track muted by system]");
        t.onunmute = () => console.log("[Local audio track unmuted by system]");
      });

      // Monitor local microphone input level in real-time
      if (localVolumeMonitorCleanupRef.current) {
        try { localVolumeMonitorCleanupRef.current(); } catch (e) {}
      }
      localVolumeMonitorCleanupRef.current = setupAudioVolumeMonitor(localStream, (vol) => {
        setLocalMicLevel(vol);
      });
    }

    // 2. Initialize RTCPeerConnection
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    // Immediately add local audio tracks to peer connection
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        try {
          pc.addTrack(track, localStream);
        } catch (e) {
          console.warn("[Callee addTrack error]", e);
        }
      });
    }

    // Handle remote tracks
    pc.ontrack = attachRemoteTrack;

    pc.onicecandidate = (event) => {
      if (event.candidate && event.candidate.candidate && targetUserId && callToAccept.call_id) {
        const candData = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment
        };
        sendCallSignal("ice_candidate", candData, targetUserId, callToAccept.call_id);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC Callee ICE State]:", pc.iceConnectionState);
      setIceStatus(pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
        unmuteAllAudio();
      } else if (pc.iceConnectionState === "failed") {
        try { if (pc.restartIce) pc.restartIce(); } catch (e) {}
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC Callee Connection State]:", pc.connectionState);
      if (pc.connectionState === "connected") {
        unmuteAllAudio();
      }
    };

    // 3. Process queued remote offer if received
    if (queuedRemoteOfferRef.current) {
      const { offer, fromUserId, callId } = queuedRemoteOfferRef.current;
      await applyRemoteOffer(offer, pc, fromUserId || targetUserId, callId || callToAccept.call_id);
      queuedRemoteOfferRef.current = null;
    }
  };

  const handleRejectIncomingCall = async () => {
    if (!incomingCall) return;
    triggerHaptic("medium");
    SoundEngine.stopRingtone();
    const callId = incomingCall.call_id;
    const partnerId = incomingCall.caller?.id;
    setIncomingCall(null);

    try {
      await Api.post("/chats/call/reject", { call_id: callId });
      if (partnerId) {
        sendCallSignal("call_reject", {}, partnerId, callId);
      }
    } catch (e) {}
    cleanupMediaCall();
  };

  const endCall = () => {
    triggerHaptic("medium");
    SoundEngine.stopRingtone();
    if (callPollTimerRef.current) clearInterval(callPollTimerRef.current);
    if (activeCall?.id) {
      Api.post("/chats/call/end", {
        call_id: activeCall.id,
        duration_seconds: activeCall.callSeconds || 0
      }).catch(() => {});
      if (activeCall?.partner?.id) {
        sendCallSignal("call_end", {}, activeCall.partner.id, activeCall.id);
      }
    }
    cleanupMediaCall();
    setActiveCall(null);
    setIsCallMinimized(false);
  };

  const formatCallTime = (totalSec = 0) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Touch Pinch-to-zoom handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      setZoomScale((prev) => Math.min(Math.max(prev * factor, 1), 4));
      touchStartDistRef.current = dist;
    }
  };

  const emojisList = ["❤️", "🔥", "😂", "👏", "🚀", "✨", "🎉", "👍", "😍", "💎", "🇺🇿", "🌸", "⭐", "💯"];

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col animate-in fade-in duration-150">
      {/* Hidden file inputs */}
      <input type="file" ref={photoInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
      <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoUpload} className="hidden" />

      {/* View 1: Active Dialog Screen */}
      {activePartner ? (
        <div className="flex-1 flex flex-col h-full bg-white">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActivePartner(null)}
                className="text-slate-600 hover:text-slate-900 p-1 text-base font-bold flex items-center space-x-1"
              >
                <span>←</span>
                <span className="text-xs">Чаты</span>
              </button>

              <div
                className="flex items-center space-x-2.5 cursor-pointer hover:opacity-85 transition-opacity"
                onClick={() => {
                  triggerHaptic("light");
                  if (onOpenProfile && activePartner?.id) onOpenProfile(activePartner.id);
                }}
              >
                <div className="relative">
                  <img
                    src={activePartner.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23f1f5f9'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23cbd5e1'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%23cbd5e1'/%3E%3C/svg%3E"}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23f1f5f9'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23cbd5e1'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%23cbd5e1'/%3E%3C/svg%3E";
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center space-x-1">
                    <span>{activePartner.first_name} {activePartner.last_name || ""}</span>
                    {activePartner.is_verified && <span className="text-sky-500 font-bold">✓</span>}
                  </h3>
                  <span className="text-[10px] text-pink-600 font-bold block">@{activePartner.username}</span>
                </div>
              </div>
            </div>

            {/* Video Call & Cache Reset Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleHardClearCache}
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-xs font-bold active:scale-95"
                title="Сбросить кэш и обновить приложение"
              >
                🔄
              </button>
              <button
                onClick={() => startCall()}
                className="px-3.5 py-2 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition"
                title="Позвонить"
              >
                <span className="text-base">📞</span>
                <span className="text-xs font-black">Позвонить</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
            {messages.map((m) => {
              const isMine = m.sender_id === (user?.id || 5);
              const isVoicePlaying = playingVoiceId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                      isMine
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-sm shadow-pink-500/10"
                        : "bg-white text-slate-900 rounded-bl-sm border border-slate-200 shadow-slate-200/50"
                    }`}
                  >
                    {/* 1. Voice Message */}
                    {m.media_type === "voice" && (
                      <div className="flex items-center space-x-3 py-1 min-w-[170px]">
                        <button
                          onClick={() => handleToggleVoicePlayback(m)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
                            isVoicePlaying
                              ? "bg-amber-400 text-slate-950 scale-105 animate-pulse"
                              : isMine ? "bg-white/20 hover:bg-white/30 text-white" : "bg-pink-500 text-white"
                          }`}
                        >
                          {isVoicePlaying ? "⏸" : "▶"}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 font-mono text-sm tracking-wider">
                            <span className={isVoicePlaying ? (isMine ? "text-amber-200 animate-pulse" : "text-pink-600 animate-pulse") : (isMine ? "opacity-80" : "text-slate-500")}>
                              {isVoicePlaying ? "▂▃▅▆▇▅▃▂" : "ılılıllılılı"}
                            </span>
                          </div>
                          <span className={`text-[10px] block font-semibold mt-0.5 ${isMine ? "opacity-90" : "text-slate-500"}`}>
                            {isVoicePlaying ? "Воспроизведение..." : `Голосовое (${m.duration || 6} сек)`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 2. Photo Message with Zoom */}
                    {m.media_type === "photo" && (
                      <div className="space-y-1">
                        <img
                          src={m.content}
                          alt="Фото"
                          onClick={() => {
                            triggerHaptic("light");
                            setZoomPhotoUrl(m.content);
                            setZoomScale(1);
                          }}
                          className="rounded-xl max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-black/10"
                        />
                        <span className={`text-[9px] block text-center ${isMine ? "opacity-80" : "text-slate-500"}`}>🔍 Нажмите для приближения</span>
                      </div>
                    )}

                    {/* 3. Video Message */}
                    {m.media_type === "video" && (
                      <div className="rounded-xl overflow-hidden max-h-64">
                        <video src={m.content} controls className="w-full h-auto rounded-xl" />
                      </div>
                    )}

                    {/* 4. Text Message */}
                    {m.media_type !== "voice" && m.media_type !== "photo" && m.media_type !== "video" && (
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                    )}

                    <span className={`text-[9px] block text-right mt-1 font-mono ${isMine ? "text-white/80" : "text-slate-400"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker Row */}
          {showEmojiPicker && (
            <div className="bg-white border-t border-slate-200 p-2 flex items-center space-x-2 overflow-x-auto no-scrollbar shadow-inner animate-in slide-in-from-bottom duration-150">
              {emojisList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    triggerHaptic("light");
                  }}
                  className="text-xl p-1.5 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Voice Recording Banner if Active */}
          {isRecordingVoice && (
            <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800 animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <span>Идет запись голоса: <b>{voiceSeconds} сек</b></span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsRecordingVoice(false)}
                  className="text-slate-500 text-xs px-2 py-1 hover:text-slate-800"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSendVoiceNote}
                  className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-sm"
                >
                  Отправить
                </button>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-2 shadow-sm"
          >
            {/* Emoji toggle button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-slate-500 hover:text-pink-600 text-base transition-colors"
              title="Смайлики"
            >
              😊
            </button>

            {/* Photo upload button */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-pink-600 text-base transition-colors"
              title="Отправить фото"
            >
              📷
            </button>

            {/* Video upload button */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-sky-600 text-base transition-colors"
              title="Отправить видео"
            >
              🎥
            </button>

            {/* Voice Record Button */}
            <button
              type="button"
              onClick={() => {
                if (isRecordingVoice) {
                  handleSendVoiceNote();
                } else {
                  startVoiceRecording();
                }
              }}
              className={`p-2 rounded-xl border transition-all ${
                isRecordingVoice
                  ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
              title={isRecordingVoice ? "Отправить голосовое" : "Записать голосовое"}
            >
              🎤
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-pink-500 focus:bg-white shadow-inner transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-40 text-white font-bold p-2.5 rounded-2xl shadow-md shadow-pink-500/20 transition-transform active:scale-95"
            >
              <svg className="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        /* View 2: Dialogs List */
        <div className="flex-1 flex flex-col h-full bg-white">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <span>💬</span>
              <span>Сообщения и чаты</span>
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-base p-1"
            >
              ✕
            </button>
          </div>

          {/* Folders Bar: All Chats vs Archive (Permanent for Fans & Old Messages) */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100/70 border-b border-slate-200 text-xs shrink-0">
            <button
              onClick={() => { triggerHaptic("light"); setChatFolder("all"); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                chatFolder === "all"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>💬 Все диалоги</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {dialogs.filter((d) => !d.is_archived).length}
              </span>
            </button>
            <button
              onClick={() => { triggerHaptic("light"); setChatFolder("archived"); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                chatFolder === "archived"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>📦 Архив</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {dialogs.filter((d) => d.is_archived).length}
              </span>
            </button>
          </div>

          {/* Dialogs List Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {(chatFolder === "archived" ? dialogs.filter((d) => d?.is_archived) : dialogs.filter((d) => !d?.is_archived)).length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">
                  {chatFolder === "archived" ? "📦" : "💬"}
                </span>
                <p className="text-xs font-semibold text-slate-600">
                  {chatFolder === "archived"
                    ? "В архиве пока пусто. Вы можете скрыть сюда сообщения поклонников, нажав 📦 на карточке любого диалога."
                    : "У вас пока нет активных диалогов. Найдите друзей через поиск!"}
                </p>
              </div>
            ) : (
              (chatFolder === "archived" ? dialogs.filter((d) => d?.is_archived) : dialogs.filter((d) => !d?.is_archived)).map((d) => {
                const partnerObj = d.partner || { id: Math.random(), first_name: "Пользователь", username: "user" };
                const partnerId = partnerObj.id;
                return (
                  <div
                    key={partnerId}
                    onClick={() => openDialog(partnerObj)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-pink-300 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={partnerObj.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23f1f5f9'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23cbd5e1'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%23cbd5e1'/%3E%3C/svg%3E"}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                      </div>

                      <div className="max-w-[170px] sm:max-w-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {partnerObj.first_name} {partnerObj.last_name || ""}
                          </span>
                          {partnerObj.is_verified && <span className="text-sky-500 font-bold text-xs">✓</span>}
                        </div>
                        <span className="text-[10px] text-pink-600 font-bold block">
                          @{partnerObj.username}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {d.last_message ? d.last_message.content : "Начните общение..."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right flex flex-col items-end space-y-1">
                        {d.last_message && d.last_message.created_at && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(d.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {d.unread_count > 0 && (
                          <span className="bg-pink-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                            {d.unread_count}
                          </span>
                        )}
                      </div>

                      {/* Quick Archive / Unarchive Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleArchive(e, partnerId, d.is_archived)}
                        title={d.is_archived ? "Вернуть из архива" : "Отправить в архив (для поклонников)"}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-slate-100 transition shrink-0"
                      >
                        <span className="text-sm">{d.is_archived ? "📥" : "📦"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Photo Zoom Viewer Modal with 2-Finger Pinch Support */}
      {zoomPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col justify-between select-none touch-none animate-in fade-in"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* Top Bar with Zoom controls and Close */}
          <div className="p-4 flex items-center justify-between text-white bg-slate-950/60 backdrop-blur-md">
            <span className="text-xs font-bold text-slate-300">
              Масштаб: {Math.round(zoomScale * 100)}% (сжимайте 2 пальцами)
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setZoomScale((prev) => Math.max(prev - 0.5, 1))}
                className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm"
              >
                −
              </button>
              <button
                onClick={() => setZoomScale((prev) => Math.min(prev + 0.5, 4))}
                className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm"
              >
                +
              </button>
              <button
                onClick={() => setZoomScale(1)}
                className="text-xs bg-slate-800 px-2 py-1 rounded-lg text-slate-300"
              >
                1:1
              </button>
              <button
                onClick={() => setZoomPhotoUrl(null)}
                className="w-8 h-8 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Zoomable Image Container */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden p-2"
            onDoubleClick={() => setZoomScale((prev) => (prev > 1.5 ? 1 : 2.5))}
          >
            <img
              src={zoomPhotoUrl}
              alt="Увеличенное фото"
              style={{
                transform: `scale(${zoomScale})`,
                transition: "transform 0.1s ease-out"
              }}
              className="max-h-[85vh] max-w-full object-contain rounded-xl"
            />
          </div>

          <div className="p-3 text-center text-slate-400 text-[11px] bg-slate-950/60 backdrop-blur-md">
            Двойной клик для быстрого приближения • Листайте или раздвигайте двумя пальцами
          </div>
        </div>
      )}

      {/* Dedicated WebRTC Audio Playback Element */}
      <audio
        ref={(el) => {
          remoteAudioRef.current = el;
          if (el && remoteAudioStreamRef.current && el.srcObject !== remoteAudioStreamRef.current) {
            el.srcObject = remoteAudioStreamRef.current;
            el.volume = 1.0;
            el.muted = false;
            try { el.play().catch(() => {}); } catch(e) {}
          }
        }}
        autoPlay
        playsInline
        style={{ position: "fixed", bottom: 0, left: 0, width: "1px", height: "1px", opacity: 0.01, pointerEvents: "none", zIndex: -1 }}
      />

      {/* Floating Call Widget when Minimized */}
      {activeCall && isCallMinimized && (
        <div
          onClick={() => {
            triggerHaptic("light");
            setIsCallMinimized(false);
          }}
          className="fixed bottom-20 right-4 z-60 bg-slate-900/95 border-2 border-emerald-500 rounded-3xl p-3 shadow-2xl backdrop-blur-md flex items-center space-x-3 cursor-pointer animate-in slide-in-from-right"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-500/50 bg-slate-950 flex items-center justify-center">
            {activeCall?.partner?.avatar_url && !activeCall.partner.avatar_url.includes("unsplash") ? (
              <img
                src={activeCall.partner.avatar_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white text-xs select-none">
                {(activeCall?.partner?.first_name || activeCall?.partner?.username || "U")[0].toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          </div>

          <div>
            <span className="text-xs font-bold text-white block">
              {activeCall?.partner?.first_name || "Собеседник"}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold block">
              🟢 {formatCallTime(activeCall.callSeconds)}
            </span>
            <span className="text-[9px] text-slate-400">Нажмите для возврата</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              endCall();
            }}
            className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs shadow-md active:scale-95 transition"
            title="Завершить звонок"
          >
            📞
          </button>
        </div>
      )}

      {/* Fullscreen Voice Call Screen */}
      {activeCall && !isCallMinimized && (
        <div
          onClick={() => {
            unmuteAllAudio();
          }}
          className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex flex-col justify-between overflow-hidden animate-in fade-in select-none text-white"
        >
          {/* Top Bar with Call Timer & Minimize */}
          <div className="relative z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic("light");
                setIsCallMinimized(true);
              }}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center space-x-1.5 border border-slate-700/60 backdrop-blur-md shadow-lg"
            >
              <span>↙ Свернуть</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHardClearCache();
                }}
                className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/50 text-[10px] font-bold px-2.5 py-1.5 rounded-2xl backdrop-blur-md shadow-lg active:scale-95 transition"
                title="Очистить кэш Telegram и перезагрузить"
              >
                🔄 Сброс кэша
              </button>
              <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 text-xs font-mono font-bold text-emerald-400 shadow-lg">
                {activeCall.isConnected ? `🟢 ${formatCallTime(activeCall.callSeconds)}` : "📞 Вызов..."}
              </div>
              {activeCall.isConnected && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    unmuteAllAudio();
                  }}
                  className="bg-emerald-950/90 active:scale-95 cursor-pointer backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-emerald-500/60 text-[10px] font-bold text-emerald-300 shadow-lg flex items-center space-x-1"
                  title="Нажмите для проверки динамика и звука"
                >
                  <span>🔊 HD Голос</span>
                  {iceStatus && (
                    <span className="text-[9px] opacity-80 font-mono">({iceStatus === "connected" || iceStatus === "completed" ? "OK" : iceStatus})</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center: Friend Avatar, Animated Audio Pulse & Real-time Volume Meters */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 text-center">
            {/* Avatar with Sound Waves */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring tied to remote voice volume */}
              <div
                className="absolute rounded-full bg-emerald-500/20 transition-all duration-100 pointer-events-none"
                style={{
                  width: `${160 + (remoteAudioLevel * 0.8)}px`,
                  height: `${160 + (remoteAudioLevel * 0.8)}px`,
                  opacity: activeCall.isConnected ? 0.3 + (remoteAudioLevel / 150) : 0.2
                }}
              />
              <div
                className="absolute rounded-full bg-teal-500/30 transition-all duration-100 pointer-events-none"
                style={{
                  width: `${140 + (remoteAudioLevel * 0.4)}px`,
                  height: `${140 + (remoteAudioLevel * 0.4)}px`,
                }}
              />
              {activeCall?.partner?.avatar_url && !activeCall.partner.avatar_url.includes("unsplash") ? (
                <img
                  src={activeCall.partner.avatar_url}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-emerald-500 shadow-2xl relative z-10"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center font-black text-white text-5xl shadow-2xl relative z-10 select-none">
                  {(activeCall?.partner?.first_name || activeCall?.partner?.username || "U")[0].toUpperCase()}
                </div>
              )}
              {activeCall.isConnected && (
                <span className="absolute bottom-1 right-2 z-20 w-5 h-5 bg-emerald-500 rounded-full ring-4 ring-slate-950 flex items-center justify-center text-[10px]">
                  📞
                </span>
              )}
            </div>

            {/* Partner Info */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-wide">
                {activeCall?.partner?.first_name || "Собеседник"} {activeCall?.partner?.last_name || ""}
              </h2>
              <p className="text-xs text-emerald-400 font-mono font-semibold">
                @{activeCall?.partner?.username || "user"}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center space-x-2 bg-slate-900/90 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-300">
                  {activeCall.isConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                      <span>Разговор идет • {formatCallTime(activeCall.callSeconds)}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-1" />
                      <span>{activeCall.isIncoming ? "Входящий звонок..." : "Идут гудки..."}</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Real-time Voice Volume Indicators */}
            {activeCall.isConnected && (
              <div className="w-full max-w-xs bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 backdrop-blur-md shadow-xl">
                {/* Remote voice meter */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <span>🔊</span>
                      <span>Собеседник:</span>
                    </span>
                    <span className="text-slate-400 font-mono">{remoteAudioLevel}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-75 rounded-full"
                      style={{ width: `${Math.max(4, remoteAudioLevel)}%` }}
                    />
                  </div>
                </div>

                {/* Local mic meter */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-cyan-400 flex items-center space-x-1">
                      <span>🎙️</span>
                      <span>Ваш микрофон:</span>
                    </span>
                    <span className="text-slate-400 font-mono">{activeCall.isMuted ? "ВЫКЛ" : `${localMicLevel}%`}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 rounded-full ${
                        activeCall.isMuted ? "bg-amber-600" : "bg-gradient-to-r from-cyan-500 to-blue-400"
                      }`}
                      style={{ width: activeCall.isMuted ? "0%" : `${Math.max(4, localMicLevel)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {isAudioMutedByBrowser && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  unmuteAllAudio();
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-full shadow-2xl font-bold text-xs flex items-center space-x-2 animate-bounce cursor-pointer border-2 border-white/80 active:scale-95 transition-transform"
              >
                <span className="text-base animate-pulse">🔊</span>
                <span>Нажмите сюда, чтобы включить звук</span>
              </div>
            )}
          </div>

          {/* Bottom Call Controls */}
          <div className="relative z-30 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center space-x-6">
            {activeCall.isConnected && (
              <>
                {/* Mute Mic */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic("medium");
                    const willMute = !activeCall.isMuted;
                    if (localStreamRef.current) {
                      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !willMute));
                    }
                    setActiveCall({ ...activeCall, isMuted: willMute });
                  }}
                  className={`p-4 rounded-full text-xl shadow-xl transition-all active:scale-90 ${
                    activeCall.isMuted ? "bg-amber-600 text-white" : "bg-slate-800/90 text-white border border-slate-700 hover:bg-slate-700"
                  }`}
                  title={activeCall.isMuted ? "Включить микрофон" : "Выключить микрофон"}
                >
                  {activeCall.isMuted ? "🔇" : "🎙️"}
                </button>

                {/* Speakerphone / Audio Boost */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    unmuteAllAudio();
                  }}
                  className="p-4 rounded-full text-xl shadow-xl bg-slate-800/90 text-white border border-slate-700 hover:bg-slate-700 active:scale-90"
                  title="Громкая связь / Усиление звука"
                >
                  🔊
                </button>
              </>
            )}

            {/* End Call */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                endCall();
              }}
              className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-2xl shadow-2xl shadow-rose-600/50 transition active:scale-90 ring-4 ring-rose-500/30"
              title="Завершить звонок"
            >
              📞
            </button>
          </div>
        </div>
      )}

      {/* Incoming Call Popup Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl shadow-emerald-500/20">
            <div className="relative w-24 h-24 mx-auto">
              {incomingCall.caller?.avatar_url && !incomingCall.caller.avatar_url.includes("unsplash") ? (
                <img
                  src={incomingCall.caller.avatar_url}
                  alt="Caller"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500 animate-pulse shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center font-black text-white text-3xl shadow-xl ring-4 ring-emerald-500 animate-pulse select-none">
                  {(incomingCall.caller?.first_name || incomingCall.caller?.username || "U")[0].toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white shadow-md">
                📞
              </span>
            </div>

            <div>
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block animate-pulse">
                Входящий звонок...
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {incomingCall.caller?.first_name}
              </h3>
              <span className="text-xs text-pink-400 font-mono">
                @{incomingCall.caller?.username}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRejectIncomingCall()}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 active:scale-95 transition"
              >
                <span>🔴 Отклонить</span>
              </button>

              <button
                onClick={() => handleAcceptIncomingCall()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 active:scale-95 animate-bounce transition"
              >
                <span>📞 Принять</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
