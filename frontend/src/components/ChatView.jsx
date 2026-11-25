import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
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

  // WebRTC Audio & Video Media Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const queuedIceCandidatesRef = useRef([]);
  const queuedRemoteOfferRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState("user");
  const [isCameraOff, setIsCameraOff] = useState(false);

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

  const RTC_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" }
    ]
  };

  const sendCallSignal = async (signalType, payload, targetUserId, callId) => {
    if (!targetUserId) return;
    try {
      if (window.__vensto_socket) {
        window.__vensto_socket.send({
          type: signalType,
          signal_type: signalType,
          target_user_id: targetUserId,
          call_id: callId,
          payload: payload
        });
      }
    } catch (e) {}

    try {
      await Api.post("/chats/call/signal", {
        target_user_id: targetUserId,
        call_id: callId,
        signal_type: signalType,
        payload: payload
      });
    } catch (err) {
      console.warn("[Signaling send fallback]", err);
    }
  };

  const cleanupMediaCall = () => {
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
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    queuedIceCandidatesRef.current = [];
    queuedRemoteOfferRef.current = null;
  };

  const applyRemoteOffer = async (offer, pc, targetUserId, callId) => {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      while (queuedIceCandidatesRef.current.length > 0) {
        const cand = queuedIceCandidatesRef.current.shift();
        try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendCallSignal("call_answer", answer, targetUserId, callId);
    } catch (err) {
      console.error("[applyRemoteOffer error]", err);
    }
  };

  const handleRemoteOffer = async (offer, fromUserId, callId) => {
    const pc = peerConnectionRef.current;
    if (pc && pc.signalingState !== "closed") {
      await applyRemoteOffer(offer, pc, fromUserId, callId);
    } else {
      queuedRemoteOfferRef.current = { offer, fromUserId, callId };
    }
  };

  const handleRemoteAnswer = async (answer) => {
    const pc = peerConnectionRef.current;
    if (pc && pc.signalingState !== "closed") {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        while (queuedIceCandidatesRef.current.length > 0) {
          const cand = queuedIceCandidatesRef.current.shift();
          try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
        }
      } catch (err) {
        console.error("[setRemoteDescription Answer error]", err);
      }
    }
  };

  const handleRemoteCandidate = async (candidate) => {
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
            call_type: data.call_type || "video",
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

    const interval = setInterval(checkIncomingAndSignals, 1800);
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

  // Handle Camera Flip
  const handleFlipCamera = async () => {
    if (!localStreamRef.current || !activeCall?.isVideo) return;
    const newFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(newFacing);
    try {
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      localStreamRef.current.addTrack(newVideoTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      const pc = peerConnectionRef.current;
      if (pc) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.warn("Camera flip failed:", err);
    }
  };

  // Real WebRTC & Signaling Call System
  const startCall = async (isVideo = true) => {
    if (!activePartner || !activePartner.id) return;

    // Protection: Nobody can call the Founder, but Founder can call anyone!
    const isPartnerFounder = activePartner.role === "director" ||
      activePartner.telegram_id === 1477103854 ||
      activePartner.telegram_id === 8787674425 ||
      ["sherzodbek", "director", "admin", "venstogram"].includes(activePartner.username?.toLowerCase());

    const isCallerFounder = user?.role === "director" ||
      user?.telegram_id === 1477103854 ||
      user?.telegram_id === 8787674425 ||
      ["sherzodbek", "director", "admin", "venstogram"].includes(user?.username?.toLowerCase());

    if (isPartnerFounder && !isCallerFounder) {
      alert("Основатель Venstogram принимает звонки только по личному приглашению. Вы можете написать в чат.");
      return;
    }

    triggerHaptic("heavy");
    SoundEngine.playRingtone();
    setIsCallMinimized(false);
    setIsCameraOff(false);

    // 1. Acquire Local Microphone & Optional Camera
    let localStream = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: isVideo ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false
      });
      localStreamRef.current = localStream;
    } catch (mediaErr) {
      console.error("[startCall media error]", mediaErr);
      SoundEngine.stopRingtone();
      alert("Не удалось включить микрофон или камеру. Пожалуйста, разрешите доступ в настройках браузера.");
      return;
    }

    let callId = null;
    try {
      const res = await Api.post("/chats/call/start", {
        recipient_id: activePartner.id,
        call_type: isVideo ? "video" : "audio"
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
      isVideo,
      isMuted: false,
      callSeconds: 0
    });

    // Attach local stream to preview element
    setTimeout(() => {
      if (localVideoRef.current && isVideo && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }, 100);

    // 2. Initialize RTCPeerConnection
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;
    queuedIceCandidatesRef.current = [];

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      track.enabled = true;
      pc.addTrack(track, localStream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("[Caller ontrack] Remote stream track received:", event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          try { remoteVideoRef.current.play().catch(() => {}); } catch(e) {}
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          try { remoteAudioRef.current.play().catch(() => {}); } catch(e) {}
        }
      }
      setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
      SoundEngine.stopRingtone();
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const targetPid = activePartner?.id || activePartnerRef.current?.id;
        if (targetPid && callId) {
          sendCallSignal("ice_candidate", event.candidate, targetPid, callId);
        }
      }
    };

    // 3. Create SDP Offer and dispatch
    try {
      const offer = await pc.createOffer();
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
    const isVideo = callToAccept.call_type === "video";
    const partnerUser = callToAccept.caller || activePartner || {
      id: callToAccept.caller_id || 1,
      username: "user",
      first_name: "Собеседник",
      avatar_url: null
    };
    const targetUserId = partnerUser?.id || callToAccept.caller_id;
    setIsCameraOff(false);

    try {
      await Api.post("/chats/call/accept", { call_id: callToAccept.call_id });
    } catch (e) {}

    setActiveCall({
      id: callToAccept.call_id,
      partner: partnerUser,
      isIncoming: true,
      isConnected: true,
      isVideo,
      isMuted: false,
      callSeconds: 0
    });
    setIsCallMinimized(false);

    // 1. Acquire Receiver Local Media
    let localStream = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: isVideo ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false
      });
      localStreamRef.current = localStream;
    } catch (mediaErr) {
      console.error("[Accept media error]", mediaErr);
    }

    setTimeout(() => {
      if (localVideoRef.current && isVideo && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }, 100);

    // 2. Initialize RTCPeerConnection
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      console.log("[Receiver ontrack] Remote stream track received:", event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          try { remoteVideoRef.current.play().catch(() => {}); } catch(e) {}
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          try { remoteAudioRef.current.play().catch(() => {}); } catch(e) {}
        }
      }
      setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
      SoundEngine.stopRingtone();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUserId && callToAccept.call_id) {
        sendCallSignal("ice_candidate", event.candidate, targetUserId, callToAccept.call_id);
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

            {/* Call Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startCall(false)}
                className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors shadow-sm"
                title="Аудиозвонок HD"
              >
                📞
              </button>
              <button
                onClick={() => startCall(true)}
                className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors shadow-sm"
                title="Видеозвонок HD"
              >
                📹
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

      {/* Hidden WebRTC Audio Playback Element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Floating Picture-in-Picture (PIP) Call Widget when Minimized */}
      {activeCall && isCallMinimized && (
        <div
          onClick={() => {
            triggerHaptic("light");
            setIsCallMinimized(false);
          }}
          className="fixed bottom-20 right-4 z-60 bg-slate-900/95 border-2 border-emerald-500 rounded-3xl p-3 shadow-2xl backdrop-blur-md flex items-center space-x-3 cursor-pointer animate-in slide-in-from-right"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-500/50 bg-slate-950 flex items-center justify-center">
            {activeCall.isVideo && remoteStreamRef.current ? (
              <video
                ref={(el) => {
                  if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                    el.srcObject = remoteStreamRef.current;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeCall?.partner?.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"}
                className="w-full h-full object-cover"
              />
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

      {/* Fullscreen WebRTC Call Overlay when NOT Minimized */}
      {activeCall && !isCallMinimized && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden animate-in fade-in select-none">
          {/* State 1: Outgoing Call Ringing (Waiting for Recipient to Answer) */}
          {!activeCall.isConnected ? (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center space-y-6 p-6 text-center z-10">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-44 h-44 rounded-full bg-pink-500/15 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-rose-500/25 animate-pulse" />
                <img
                  src={activeCall?.partner?.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-pink-500 shadow-2xl relative z-10"
                />
              </div>
              <div className="space-y-1 relative z-10">
                <h2 className="text-2xl font-black text-white">{activeCall?.partner?.first_name || "Собеседник"}</h2>
                <p className="text-xs text-pink-400 font-mono">@{activeCall?.partner?.username || "user"}</p>
                <div className="pt-3">
                  <span className="inline-flex items-center space-x-2 bg-slate-900/90 border border-pink-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-pink-300 animate-pulse">
                    <span>{activeCall.isVideo ? "📹 Видеовызов..." : "📞 Аудиовызов..."}</span>
                    <span>Идут гудки</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* State 2: Active Connected Call */
            activeCall.isVideo ? (
              <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStreamRef.current && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3 p-6 text-center">
                    <img
                      src={activeCall?.partner?.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                      className="w-28 h-28 rounded-full object-cover ring-4 ring-pink-500/80 shadow-2xl animate-pulse"
                    />
                    <h2 className="text-xl font-black text-white">{activeCall?.partner?.first_name || "Собеседник"}</h2>
                    <p className="text-xs text-pink-400 font-semibold animate-pulse">
                      🟢 Подключение видеопотока HD...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center space-y-5 p-6 text-center">
                <div className="relative">
                  <img
                    src={activeCall?.partner?.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-emerald-500 shadow-2xl"
                  />
                  <span className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{activeCall?.partner?.first_name || "Собеседник"}</h2>
                  <span className="text-xs text-pink-400 font-mono">@{activeCall?.partner?.username || "user"}</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold block mt-2">
                    🟢 Идет аудиоразговор ({formatCallTime(activeCall.callSeconds)})
                  </span>
                </div>
              </div>
            )
          )}

          {/* Floating Local Camera Video Preview (PIP in corner) - ONLY WHEN CONNECTED */}
          {activeCall.isVideo && activeCall.isConnected && (
            <div className="absolute top-16 right-4 z-20 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-pink-500/80 shadow-2xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
              />
              <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                Вы
              </div>
            </div>
          )}

          {/* Top Bar with Call Timer & Minimize */}
          <div className="relative z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsCallMinimized(true);
              }}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold py-2 px-3.5 rounded-2xl flex items-center space-x-1.5 border border-slate-700/60 backdrop-blur-md shadow-lg"
            >
              <span>↙ Свернуть</span>
            </button>

            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 text-xs font-mono font-bold text-emerald-400 shadow-lg">
              {activeCall.isConnected ? `🟢 ${formatCallTime(activeCall.callSeconds)}` : "📞 Вызов..."}
            </div>
          </div>

          {/* Bottom Call Controls */}
          <div className="relative z-30 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center space-x-5">
            {activeCall.isConnected && (
              <>
                {/* Mute Mic */}
                <button
                  onClick={() => {
                    triggerHaptic("medium");
                    const willMute = !activeCall.isMuted;
                    if (localStreamRef.current) {
                      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !willMute));
                    }
                    setActiveCall({ ...activeCall, isMuted: willMute });
                  }}
                  className={`p-4 rounded-full text-xl shadow-xl transition-all active:scale-90 ${
                    activeCall.isMuted ? "bg-amber-600 text-white" : "bg-slate-800/90 text-white border border-slate-700"
                  }`}
                  title={activeCall.isMuted ? "Включить микрофон" : "Выключить микрофон"}
                >
                  {activeCall.isMuted ? "🔇" : "🎙️"}
                </button>

                {/* Video Flip (if video call) */}
                {activeCall.isVideo && (
                  <button
                    onClick={() => {
                      triggerHaptic("medium");
                      handleFlipCamera();
                    }}
                    className="p-4 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white text-xl shadow-xl border border-slate-700 transition active:scale-90"
                    title="Переключить камеру (передняя/задняя)"
                  >
                    🔄
                  </button>
                )}

                {/* Camera Off/On (if video call) */}
                {activeCall.isVideo && (
                  <button
                    onClick={() => {
                      triggerHaptic("medium");
                      const willBeOff = !isCameraOff;
                      setIsCameraOff(willBeOff);
                      if (localStreamRef.current) {
                        localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !willBeOff));
                      }
                    }}
                    className={`p-4 rounded-full text-xl shadow-xl transition active:scale-90 ${
                      isCameraOff ? "bg-rose-600 text-white" : "bg-slate-800/90 text-white border border-slate-700"
                    }`}
                    title={isCameraOff ? "Включить камеру" : "Выключить камеру"}
                  >
                    {isCameraOff ? "🚫" : "📹"}
                  </button>
                )}
              </>
            )}

            {/* End Call */}
            <button
              onClick={endCall}
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
              <img
                src={incomingCall.caller?.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
                alt="Caller"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500 animate-pulse shadow-xl"
              />
              <span className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white shadow-md">
                📞
              </span>
            </div>

            <div>
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block animate-pulse">
                Входящий {incomingCall.call_type === "video" ? "видеозвонок" : "аудиозвонок"}...
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
                <span>🟢 Принять</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
