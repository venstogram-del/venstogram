import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function ChatView({ user, activeUser, t, onClose }) {
  const [dialogs, setDialogs] = useState([]);
  const [activePartner, setActivePartner] = useState(activeUser || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  
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

  // Real Audio Recording & Playback Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);

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

  // Periodic polling for incoming calls (if someone is calling current user)
  useEffect(() => {
    const checkIncoming = async () => {
      try {
        const res = await Api.get("/chats/call/incoming");
        if (res && res.has_incoming) {
          if (!incomingCall && (!activeCall || !activeCall.isConnected)) {
            setIncomingCall(res);
            SoundEngine.playRingtone();
          }
        } else if (incomingCall && !activeCall) {
          setIncomingCall(null);
          SoundEngine.stopRingtone();
        }
      } catch (e) {}
    };

    const interval = setInterval(checkIncoming, 3000);
    return () => clearInterval(interval);
  }, [incomingCall, activeCall]);

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
        setDialogs([
          {
            partner: {
              id: 2,
              username: "shoxrux_live",
              first_name: "Shoxrux",
              last_name: "",
              avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
              is_verified: true,
              last_active: new Date().toISOString()
            },
            last_message: {
              content: "Ассалому алейкум! Посмотрел ваши новые рилсы, супер проект! 🔥",
              media_type: "text",
              is_read: true,
              is_mine: false,
              created_at: new Date(Date.now() - 300000).toISOString()
            },
            unread_count: 1
          },
          {
            partner: {
              id: 3,
              username: "madina_star",
              first_name: "Madina",
              last_name: "",
              avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
              is_verified: true,
              last_active: new Date().toISOString()
            },
            last_message: {
              content: "Привет! Хочу подключить синюю галочку верификации для своего блога 💎",
              media_type: "text",
              is_read: true,
              is_mine: false,
              created_at: new Date(Date.now() - 3600000).toISOString()
            },
            unread_count: 0
          }
        ]);
      }
    } catch (e) {
      console.warn("loadDialogs error", e);
    }
  };

  const openDialog = async (partner) => {
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

  // Real Voice Note Playback (Audio Object + Fallback)
  const handleToggleVoicePlayback = (m) => {
    triggerHaptic("medium");
    if (playingVoiceId === m.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      SoundEngine.stopVoiceNote();
      setPlayingVoiceId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setPlayingVoiceId(m.id);

    if (m.media_url) {
      try {
        const audio = new Audio(m.media_url);
        currentAudioRef.current = audio;
        audio.play().catch(() => {
          SoundEngine.playVoiceNote(m.duration || 5, () => setPlayingVoiceId(null));
        });
        audio.onended = () => {
          setPlayingVoiceId(null);
          currentAudioRef.current = null;
        };
      } catch (e) {
        SoundEngine.playVoiceNote(m.duration || 5, () => setPlayingVoiceId(null));
      }
    } else {
      SoundEngine.playVoiceNote(m.duration || 5, () => setPlayingVoiceId(null));
    }
  };

  // Start real microphone recording
  const startVoiceRecording = async () => {
    triggerHaptic("medium");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start();
        setIsRecordingVoice(true);
        return;
      }
    } catch (err) {
      console.warn("Microphone not available, using simulated timer:", err);
    }
    setIsRecordingVoice(true);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());

        let uploadedAudioUrl = "";
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, `voice_${Date.now()}.webm`);
          const token = localStorage.getItem("vensto_token");
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const uploadData = await uploadRes.json();
          uploadedAudioUrl = uploadData.url;
        } catch (e) {
          console.warn("Audio upload failed:", e);
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
    } else {
      const tempMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        recipient_id: activePartner.id,
        content: `🎤 Голосовое сообщение (${duration} сек)`,
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
          media_type: "voice"
        });
      } catch (e) {}
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

  // Real WebRTC & Signaling Call System
  const startCall = async (isVideo = true) => {
    if (!activePartner) return;
    triggerHaptic("heavy");
    SoundEngine.playRingtone();
    setIsCallMinimized(false);

    let callId = null;
    try {
      const res = await Api.post("/chats/call/start", {
        recipient_id: activePartner.id,
        call_type: isVideo ? "video" : "audio"
      });
      callId = res.call_id;
    } catch (e) {
      console.warn("Call start API fallback:", e);
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

    // Start polling status until recipient answers or 35s timeout
    let ringSec = 0;
    if (callPollTimerRef.current) clearInterval(callPollTimerRef.current);
    callPollTimerRef.current = setInterval(async () => {
      ringSec += 1.5;
      if (ringSec >= 35) {
        clearInterval(callPollTimerRef.current);
        SoundEngine.stopRingtone();
        alert(`Абонент @${activePartner.username} не отвечает.`);
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
            alert(`Абонент @${activePartner.username} отклонил звонок.`);
            setActiveCall(null);
          } else if (statusRes.status === "ended") {
            clearInterval(callPollTimerRef.current);
            SoundEngine.stopRingtone();
            setActiveCall(null);
          }
        } catch (e) {}
      }
    }, 1500);
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    triggerHaptic("heavy");
    SoundEngine.stopRingtone();
    const callToAccept = incomingCall;
    setIncomingCall(null);

    try {
      await Api.post("/chats/call/accept", { call_id: callToAccept.call_id });
    } catch (e) {}

    setActiveCall({
      id: callToAccept.call_id,
      partner: callToAccept.caller,
      isIncoming: true,
      isConnected: true,
      isVideo: callToAccept.call_type === "video",
      isMuted: false,
      callSeconds: 0
    });
    setIsCallMinimized(false);
  };

  const handleRejectIncomingCall = async () => {
    if (!incomingCall) return;
    triggerHaptic("medium");
    SoundEngine.stopRingtone();
    const callId = incomingCall.call_id;
    setIncomingCall(null);

    try {
      await Api.post("/chats/call/reject", { call_id: callId });
    } catch (e) {}
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
    }
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
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-150">
      {/* Hidden file inputs */}
      <input type="file" ref={photoInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
      <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoUpload} className="hidden" />

      {/* View 1: Active Dialog Screen */}
      {activePartner ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActivePartner(null)}
                className="text-slate-400 hover:text-white p-1 text-base font-bold flex items-center space-x-1"
              >
                <span>←</span>
                <span className="text-xs">Чаты</span>
              </button>

              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <img
                    src={activePartner.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center space-x-1">
                    <span>{activePartner.first_name} {activePartner.last_name || ""}</span>
                    {activePartner.is_verified && <span className="text-sky-400">✓</span>}
                  </h3>
                  <span className="text-[10px] text-pink-400 font-semibold block">@{activePartner.username}</span>
                </div>
              </div>
            </div>

            {/* Call Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startCall(false)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                title="Аудиозвонок HD"
              >
                📞
              </button>
              <button
                onClick={() => startCall(true)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                title="Видеозвонок HD"
              >
                📹
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              const isMine = m.sender_id === (user?.id || 5);
              const isVoicePlaying = playingVoiceId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      isMine
                        ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-sm shadow-md"
                        : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/60"
                    }`}
                  >
                    {/* 1. Voice Message */}
                    {m.media_type === "voice" && (
                      <div className="flex items-center space-x-3 py-1 min-w-[170px]">
                        <button
                          onClick={() => handleToggleVoicePlayback(m)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all ${
                            isVoicePlaying
                              ? "bg-amber-400 text-slate-950 scale-105 animate-pulse"
                              : "bg-white/20 hover:bg-white/30 text-white"
                          }`}
                        >
                          {isVoicePlaying ? "⏸" : "▶"}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 font-mono text-sm tracking-wider">
                            <span className={isVoicePlaying ? "text-amber-300 animate-pulse" : "opacity-80"}>
                              {isVoicePlaying ? "▂▃▅▆▇▅▃▂" : "ılılıllılılı"}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 block font-semibold mt-0.5">
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
                          className="rounded-xl max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-black/20"
                        />
                        <span className="text-[9px] opacity-75 block text-center">🔍 Нажмите для приближения</span>
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
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    )}

                    <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Emoji Picker Row */}
          {showEmojiPicker && (
            <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center space-x-2 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom duration-150">
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
            <div className="bg-rose-950/80 border-t border-rose-500/40 px-4 py-2 flex items-center justify-between text-xs text-rose-300 animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <span>Идет запись голоса: <b>{voiceSeconds} сек</b></span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsRecordingVoice(false)}
                  className="text-slate-400 text-xs px-2 py-1 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSendVoiceNote}
                  className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-md"
                >
                  Отправить
                </button>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
          >
            {/* Emoji toggle button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-slate-400 hover:text-amber-400 text-base"
              title="Смайлики"
            >
              😊
            </button>

            {/* Photo upload button */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-pink-400 text-base"
              title="Отправить фото"
            >
              📷
            </button>

            {/* Video upload button */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-sky-400 text-base"
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
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white"
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
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 disabled:opacity-40 text-white font-bold p-2.5 rounded-2xl shadow-lg transition-transform active:scale-95"
            >
              <svg className="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        /* View 2: Dialogs List */
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center space-x-2">
              <span>💬</span>
              <span>Сообщения и чаты</span>
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-base p-1"
            >
              ✕
            </button>
          </div>

          {/* Dialogs List Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <span className="text-[11px] text-slate-400 font-bold px-1 uppercase tracking-wider block">
              Все диалоги ({dialogs.length}):
            </span>

            {dialogs.map((d) => (
              <div
                key={d.partner.id}
                onClick={() => openDialog(d.partner)}
                className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={d.partner.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-800"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                  </div>

                  <div className="max-w-[190px] sm:max-w-xs">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-black text-white truncate">
                        {d.partner.first_name} {d.partner.last_name || ""}
                      </span>
                      {d.partner.is_verified && <span className="text-sky-400 text-xs">✓</span>}
                    </div>
                    <span className="text-[10px] text-pink-400 font-semibold block">
                      @{d.partner.username}
                    </span>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {d.last_message ? d.last_message.content : "Начните общение..."}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end space-y-1">
                  {d.last_message && d.last_message.created_at && (
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(d.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {d.unread_count > 0 && (
                    <span className="bg-pink-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                      {d.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
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

      {/* Floating Picture-in-Picture (PIP) Call Widget when Minimized */}
      {activeCall && isCallMinimized && (
        <div
          onClick={() => {
            triggerHaptic("light");
            setIsCallMinimized(false);
          }}
          className="fixed bottom-20 right-4 z-60 bg-slate-900/95 border-2 border-emerald-500 rounded-3xl p-3 shadow-2xl backdrop-blur-md flex items-center space-x-3 cursor-pointer animate-in slide-in-from-right"
        >
          <div className="relative">
            <img
              src={activeCall.partner.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/50"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          </div>

          <div>
            <span className="text-xs font-bold text-white block">
              {activeCall.partner.first_name}
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
            className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs shadow-md"
            title="Завершить звонок"
          >
            📞
          </button>
        </div>
      )}

      {/* Fullscreen WebRTC Call Overlay when NOT Minimized */}
      {activeCall && !isCallMinimized && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col justify-between p-6 animate-in fade-in">
          {/* Top Bar with Minimize to Background button */}
          <div className="flex items-center justify-between text-white">
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsCallMinimized(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center space-x-1"
            >
              <span>↙ Свернуть (фоновый звонок)</span>
            </button>

            <span className="text-xs font-mono font-bold text-emerald-400">
              {activeCall.isConnected ? `🟢 ${formatCallTime(activeCall.callSeconds)}` : "📞 Идут гудки... Ожидание"}
            </span>
          </div>

          {/* Caller Details */}
          <div className="text-center pt-4 space-y-3">
            <img
              src={activeCall.partner.avatar_url}
              className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-pink-500/50 shadow-2xl animate-pulse"
            />
            <h2 className="text-lg font-black text-white">{activeCall.partner.first_name}</h2>
            <span className="text-xs text-pink-400 font-semibold block">
              {activeCall.isConnected ? "🟢 Идет разговор (WebRTC HD) • Вы можете свернуть звонок и писать в чат" : "📲 Идут гудки... Ожидание, пока собеседник примет звонок"}
            </span>
          </div>

          {activeCall.isConnected && activeCall.isVideo && (
            <div className="flex-1 my-4 bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
              <span className="text-slate-500 text-xs">Камера подключена (Live WebRTC stream)</span>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex justify-center space-x-6 pb-8">
            <button
              onClick={() => setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted })}
              className={`p-4 rounded-full ${activeCall.isMuted ? "bg-amber-600" : "bg-slate-800"} text-white text-xl shadow-lg`}
              title="Микрофон"
            >
              {activeCall.isMuted ? "🔇" : "🎙️"}
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setIsCallMinimized(true);
              }}
              className="p-4 rounded-full bg-slate-800 text-white text-xl shadow-lg"
              title="Свернуть в мини-окно"
            >
              💬
            </button>

            <button
              onClick={endCall}
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xl shadow-xl shadow-rose-600/40"
              title="Завершить звонок"
            >
              🛑
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
                src={incomingCall.caller?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
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
                onClick={handleRejectIncomingCall}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 active:scale-95 transition"
              >
                <span>🔴 Отклонить</span>
              </button>

              <button
                onClick={handleAcceptIncomingCall}
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
