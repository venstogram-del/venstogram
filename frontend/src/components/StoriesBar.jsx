import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function StoriesBar({ storiesGroups = [], currentUserId, onStoryCreated, t }) {
  const [activeViewerGroup, setActiveViewerGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [storyMuted, setStoryMuted] = useState(false);
  const [storyReplyText, setStoryReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const progressTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const isVideoStory = (url, mediaType) => {
    if (mediaType === "video") return true;
    if (!url) return false;
    const clean = url.split("?")[0].toLowerCase();
    return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov") || clean.endsWith(".m4v") || clean.endsWith(".ogg") || clean.includes("/video");
  };

  const handleStoryFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setUploadModalOpen(true);
  };

  const handleUploadStory = async (isCloseFriends) => {
    if (!pendingFile) return;
    setUploadModalOpen(false);
    setUploadingStory(true);
    triggerHaptic("medium");

    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      const uploadRes = await Api.post("/upload", formData);

      const isVideo = pendingFile.type.startsWith("video");
      await Api.post("/stories", {
        media_url: uploadRes.url,
        media_type: isVideo ? "video" : "image",
        caption: "",
        is_close_friends: isCloseFriends
      });

      SoundEngine.playFanfare();
      triggerHaptic("success");
      alert(isCloseFriends ? "💚 История для близких друзей опубликована!" : "История успешно опубликована!");
      if (onStoryCreated) onStoryCreated();
    } catch (err) {
      triggerHaptic("error");
      alert("Ошибка загрузки истории: " + (err.message || "Не удалось загрузить файл"));
    } finally {
      setUploadingStory(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendStoryReply = async (e) => {
    if (e) e.preventDefault();
    if (!storyReplyText.trim() || !activeViewerGroup) return;
    triggerHaptic("medium");
    const partnerId = activeViewerGroup.user.id;
    const currentStory = activeViewerGroup.stories[currentStoryIndex];
    try {
      await Api.post("/chats/send", {
        recipient_id: partnerId,
        content: `💬 Ответ на историю: "${storyReplyText}"`,
        media_url: currentStory?.media_url,
        media_type: "story_reply",
        shared_entity_id: currentStory?.id
      });
      setReplySent(true);
      setStoryReplyText("");
      setTimeout(() => setReplySent(false), 2500);
    } catch (err) {
      alert("Ошибка отправки ответа: " + err.message);
    }
  };

  // Story playback timer
  useEffect(() => {
    if (!activeViewerGroup) {
      setProgress(0);
      return;
    }

    if (isPaused) return;

    const interval = 50; // update every 50ms
    const step = 100 / (5000 / interval); // 5 seconds per story

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(progressTimerRef.current);
  }, [activeViewerGroup, currentStoryIndex, isPaused]);

  const handleNextStory = () => {
    if (!activeViewerGroup) return;
    if (currentStoryIndex < activeViewerGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const openStoryViewer = (group) => {
    triggerHaptic("light");
    setActiveViewerGroup(group);
    setCurrentStoryIndex(0);
    setProgress(0);

    // Mark current story as viewed
    if (group.stories[0]) {
      Api.post(`/stories/${group.stories[0].id}/view`, {}).catch(() => {});
    }
  };

  const closeStoryViewer = () => {
    setActiveViewerGroup(null);
    setCurrentStoryIndex(0);
    setProgress(0);
  };

  const handleReaction = async (emoji) => {
    triggerHaptic("medium");
    SoundEngine.playLike();
    const currentStory = activeViewerGroup?.stories[currentStoryIndex];
    if (currentStory) {
      await Api.post(`/stories/${currentStory.id}/react`, { reaction: emoji }).catch(() => {});
    }
  };

  return (
    <>
      {/* Horizontal Stories Carousel */}
      <div className="bg-white border-b border-slate-100 py-3 px-4 flex items-center space-x-3 overflow-x-auto no-scrollbar">
        {/* Add Story Button with photo & video upload */}
        <div
          onClick={() => {
            if (!uploadingStory) fileInputRef.current?.click();
          }}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            onChange={handleStoryFileSelect}
            className="hidden"
          />
          <div className="relative">
            <div className={`w-16 h-16 rounded-full p-[2px] bg-slate-100 border border-slate-200 flex items-center justify-center ${uploadingStory ? "animate-spin border-pink-500 border-2" : ""}`}>
              <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-slate-700">
                {uploadingStory ? (
                  <span className="text-xs">⏳</span>
                ) : (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm">
              +
            </div>
          </div>
          <span className="text-[11px] text-slate-600 font-medium mt-1 max-w-[64px] truncate">
            {uploadingStory ? (t?.uploading || "Загрузка...") : (t?.yourStory || "Ваша история")}
          </span>
        </div>

        {/* Stories list */}
        {storiesGroups.map((group, idx) => {
          const hasUnseen = group.has_unseen;
          const isCloseFriends = group.stories?.some((s) => s.is_close_friends);
          return (
            <div
              key={idx}
              onClick={() => openStoryViewer(group)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                  hasUnseen
                    ? isCloseFriends
                      ? "bg-gradient-to-tr from-emerald-400 via-green-500 to-teal-400 animate-pulse"
                      : "bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 animate-pulse"
                    : "bg-slate-200"
                }`}
              >
                <img
                  src={group.user.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
                  alt={group.user.first_name}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
              <span className="text-[11px] text-slate-800 font-medium mt-1 max-w-[64px] truncate">
                {group.user.first_name || group.user.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Stories Player Modal */}
      {activeViewerGroup && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none">
          {/* Top Progress Bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex space-x-1">
            {activeViewerGroup.stories.map((st, i) => (
              <div key={st.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      i < currentStoryIndex
                        ? "100%"
                        : i === currentStoryIndex
                        ? `${progress}%`
                        : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header Info */}
          <div className="absolute top-5 left-4 right-4 z-20 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <img
                src={activeViewerGroup.user.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
                className="w-8 h-8 rounded-full border border-white/40 object-cover"
              />
              <span className="text-xs font-bold drop-shadow">
                {activeViewerGroup.user.first_name || activeViewerGroup.user.username}
              </span>
              {activeViewerGroup.user.is_verified && <span className="text-blue-400 text-xs">✓</span>}
              {activeViewerGroup.stories[currentStoryIndex]?.is_close_friends && (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-md">
                  💚 Близкие друзья
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isVideoStory(
                activeViewerGroup.stories[currentStoryIndex]?.media_url,
                activeViewerGroup.stories[currentStoryIndex]?.media_type
              ) && (
                <button
                  onClick={() => setStoryMuted(!storyMuted)}
                  className="px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px] font-bold"
                >
                  {storyMuted ? "🔇" : "🔊"}
                </button>
              )}
              <button
                onClick={closeStoryViewer}
                className="p-1 rounded-full bg-black/40 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Media Content with Hold to Pause & Tap to Skip */}
          <div
            className="w-full h-full relative flex items-center justify-center bg-black"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {isVideoStory(
              activeViewerGroup.stories[currentStoryIndex]?.media_url,
              activeViewerGroup.stories[currentStoryIndex]?.media_type
            ) ? (
              <video
                src={activeViewerGroup.stories[currentStoryIndex]?.media_url}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                loop
                muted={storyMuted}
              />
            ) : (
              <img
                src={activeViewerGroup.stories[currentStoryIndex]?.media_url}
                className="w-full h-full object-contain"
                alt="Story"
              />
            )}

            {/* Left Tap to Prev */}
            <div
              className="absolute left-0 top-16 bottom-20 w-1/3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevStory();
              }}
            />

            {/* Right Tap to Next */}
            <div
              className="absolute right-0 top-16 bottom-20 w-2/3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleNextStory();
              }}
            />

            {/* Caption */}
            {activeViewerGroup.stories[currentStoryIndex]?.caption && (
              <div className="absolute bottom-20 left-4 right-4 text-center">
                <span className="inline-block px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-sm font-medium drop-shadow">
                  {activeViewerGroup.stories[currentStoryIndex]?.caption}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Quick Reactions & DM Reply Bar */}
          <div className="absolute bottom-3 left-3 right-3 z-20 space-y-2">
            <div className="flex items-center justify-around bg-slate-950/80 backdrop-blur-md py-1 px-3 rounded-full border border-slate-800/80">
              {["❤️", "🔥", "👏", "😂", "😍", "🎉"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:scale-125 active:scale-95 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSendStoryReply}
              className="flex items-center space-x-2 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-full border border-slate-800"
            >
              <input
                type="text"
                value={storyReplyText}
                onChange={(e) => setStoryReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder="Ответить автору в личные сообщения..."
                className="flex-1 bg-transparent px-3 py-1 text-xs text-white placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                disabled={!storyReplyText.trim()}
                className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 disabled:opacity-40 text-white rounded-full px-3 py-1 text-xs font-bold transition-all"
              >
                Отправить
              </button>
            </form>

            {replySent && (
              <div className="text-center text-[11px] font-bold text-emerald-400 bg-slate-900/90 py-1 rounded-full border border-emerald-500/40">
                ✓ Сообщение отправлено автору истории!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Story Audience Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-xs space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                <span>📸</span>
                <span>Опубликовать историю</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setUploadModalOpen(false);
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Выберите аудиторию для вашей новой истории:
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleUploadStory(false)}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-pink-600/30 transition-transform active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">🌐</span>
                  <div className="text-left">
                    <span className="block font-black">Для всех пользователей</span>
                    <span className="text-[10px] text-pink-200">Публичная история на 24 часа</span>
                  </div>
                </div>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => handleUploadStory(true)}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">💚</span>
                  <div className="text-left">
                    <span className="block font-black">Близкие друзья</span>
                    <span className="text-[10px] text-emerald-200">Зеленая рамка для избранных</span>
                  </div>
                </div>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
