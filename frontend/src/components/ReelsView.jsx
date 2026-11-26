import React, { useState, useRef, useEffect } from "react";
import { triggerHaptic, safeConfirm } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";
import { ShareModal } from "./ShareModal.jsx";

var DEFAULT_AVATAR = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E";

export function ReelsView({ reels = [], setReels, t, user, onOpenProfile }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [commentsReelId, setCommentsReelId] = useState(null);
  const [reelComments, setReelComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyToReelComment, setReplyToReelComment] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [deletingReel, setDeletingReel] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [videoBuffering, setVideoBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const [showReelOptionsMenu, setShowReelOptionsMenu] = useState(false);

  const formatCompactCount = (num) => {
    if (!num || num <= 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
  };

  const touchStartY = useRef(0);
  const lastTapRef = useRef(0);
  const videoRef = useRef(null);
  const reelCommentInputRef = useRef(null);

  const currentReel = reels[currentIndex];

  useEffect(() => {
    setCaptionExpanded(false);
    setVideoError(false);
    setVideoBuffering(false);
  }, [currentIndex]);

  // Real-time Reels auto-discovery: auto-fetch on mount and live WebSocket broadcast
  useEffect(() => {
    Api.get("/reels").then((fresh) => {
      if (fresh && Array.isArray(fresh) && fresh.length > 0) {
        setReels(fresh);
      }
    }).catch(() => {});

    const handleReelWs = (data) => {
      if (data && data.event === "new_reel" && data.reel) {
        setReels((prev) => {
          if (prev.some((r) => r.id === data.reel.id)) return prev;
          return [data.reel, ...prev];
        });
      }
    };

    let unsub = null;
    if (window.__vensto_socket) {
      unsub = window.__vensto_socket.addListener(handleReelWs);
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  };

  const handleDeleteReel = async (reelId) => {
    const confirmed = await safeConfirm("Вы действительно хотите навсегда удалить этот Reel?");
    if (!confirmed) return;
    setDeletingReel(true);
    triggerHaptic("heavy");
    try {
      try {
        await Api.delete(`/reels/${reelId}`);
      } catch (e) {
        await Api.delete(`/posts/${reelId}`);
      }
      showToast("✓ Reels успешно удален");
      setReels((prev) => prev.filter((r) => r.id !== reelId));
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } catch (err) {
      alert("Ошибка удаления Reels: " + err.message);
    } finally {
      setDeletingReel(false);
    }
  };

  const handleDeleteReelComment = async (reelId, commentId) => {
    if (!confirm("Удалить этот комментарий?")) return;
    triggerHaptic("medium");
    try {
      await Api.delete(`/reels/${reelId}/comments/${commentId}`);
      setReelComments((prev) => prev.filter((c) => c.id !== commentId));
      setReels((prev) =>
        prev.map((r) =>
          r.id === reelId ? { ...r, comments_count: Math.max(0, r.comments_count - 1) } : r
        )
      );
    } catch (err) {
      alert("Ошибка удаления комментария: " + err.message);
    }
  };

  const handleReplyToReelComment = (c) => {
    triggerHaptic("light");
    if (!c || !c.author?.username) return;
    setReplyToReelComment({ id: c.id, username: c.author.username });
    setCommentText(`@${c.author.username} `);
    setTimeout(() => {
      reelCommentInputRef.current?.focus();
    }, 50);
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    if (diffY > 50 && currentIndex < reels.length - 1) {
      triggerHaptic("medium");
      setCurrentIndex((prev) => prev + 1);
    } else if (diffY < -50 && currentIndex > 0) {
      triggerHaptic("medium");
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleVideoClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected -> Like!
      triggerHaptic("heavy");
      SoundEngine.playLike();
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 900);

      if (!currentReel?.is_liked) {
        setReels((prev) =>
          prev.map((r, i) =>
            i === currentIndex
              ? { ...r, is_liked: true, likes_count: (r.likes_count || 0) + 1 }
              : r
          )
        );
        Api.post(`/reels/${currentReel.id}/like`, {}).catch(() => {});
      }
    } else {
      // Single tap -> toggle sound
      setIsMuted(!isMuted);
      triggerHaptic("light");
    }
    lastTapRef.current = now;
  };

  const toggleLike = async () => {
    if (!currentReel) return;
    triggerHaptic("medium");
    SoundEngine.playLike();

    const nextLiked = !currentReel.is_liked;
    setReels((prev) =>
      prev.map((r, i) =>
        i === currentIndex
          ? {
              ...r,
              is_liked: nextLiked,
              likes_count: nextLiked
                ? (r.likes_count || 0) + 1
                : Math.max(0, (r.likes_count || 1) - 1)
            }
          : r
      )
    );

    try {
      await Api.post(`/reels/${currentReel.id}/like`, {});
    } catch (e) {}
  };

  const toggleSave = async () => {
    if (!currentReel) return;
    triggerHaptic("medium");

    const nextSaved = !currentReel.is_saved;
    setReels((prev) =>
      prev.map((r, i) =>
        i === currentIndex ? { ...r, is_saved: nextSaved } : r
      )
    );

    try {
      await Api.post(`/reels/${currentReel.id}/save`, {});
      showToast(nextSaved ? "✓ Сохранено в профиле" : "Удалено из сохраненного");
    } catch (e) {
      showToast("Ошибка сохранения");
    }
  };

  const handleCopyLink = () => {
    if (!currentReel) return;
    triggerHaptic("light");
    const link = `https://t.me/venstogrambot?startapp=reel_${currentReel.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    showToast("✓ Ссылка на Reels скопирована!");
  };

  const handleDownloadReel = () => {
    if (!currentReel?.video_url) return;
    triggerHaptic("medium");
    try {
      showToast("⏳ Сохранение видео...");
      const link = document.createElement("a");
      link.href = currentReel.video_url;
      link.download = `reel_${currentReel.id}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("✓ Видео скачивается на устройство!");
    } catch (e) {
      showToast("Ошибка скачивания видео");
    }
  };

  const handleShare = () => {
    if (!currentReel) return;
    triggerHaptic("light");
    setShareModalOpen(true);
  };

  const openComments = async () => {
    if (!currentReel) return;
    triggerHaptic("light");
    setCommentsReelId(currentReel.id);
    try {
      const res = await Api.get(`/reels/${currentReel.id}/comments`);
      setReelComments(Array.isArray(res) ? res : []);
    } catch (e) {
      setReelComments([]);
    }
  };

  const submitReelComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !commentsReelId) return;
    triggerHaptic("light");

    try {
      const newC = await Api.post(`/reels/${commentsReelId}/comments`, {
        text: commentText,
        parent_id: replyToReelComment?.id || null
      });
      setReelComments((prev) => [...prev, newC]);
      setCommentText("");
      setReplyToReelComment(null);
      setReels((prev) =>
        prev.map((r) =>
          r.id === commentsReelId ? { ...r, comments_count: (r.comments_count || 0) + 1 } : r
        )
      );
    } catch (e) {}
  };

  const handleFollowAuthor = async (e) => {
    e.stopPropagation();
    if (!currentReel?.author?.id || currentReel.author.id === user?.id) return;
    triggerHaptic("medium");
    try {
      const res = await Api.post(`/users/${currentReel.author.id}/follow`, {});
      showToast(res.is_following ? "✓ Вы подписались" : "Вы отписались");
      setReels((prev) =>
        prev.map((r) =>
          r.author?.id === currentReel.author.id
            ? { ...r, author: { ...r.author, is_following: res.is_following } }
            : r
        )
      );
    } catch (err) {}
  };

  if (!currentReel) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400 space-y-2 select-none">
        <span className="text-4xl">🎬</span>
        <span className="text-sm font-bold text-white">{t?.noReels || "Нет доступных Reels"}</span>
        <span className="text-xs text-slate-500">{t?.publishFirstPost || "Опубликуйте первое видео через кнопку + вверху"}</span>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 top-[52px] bottom-[58px] bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Instagram Header Overlay */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <span className="text-lg font-black tracking-wider text-white drop-shadow-md">
            Reels
          </span>
          <span className="text-[10px] bg-white/20 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-full border border-white/10">
            {currentIndex + 1}/{reels.length}
          </span>
        </div>

        {/* Audio Mute / Unmute Floating Pill */}
        <button
          onClick={() => {
            triggerHaptic("light");
            setIsMuted(!isMuted);
          }}
          className="pointer-events-auto bg-black/40 hover:bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs border border-white/15 flex items-center space-x-1.5 transition active:scale-95 shadow-lg"
        >
          <span>{isMuted ? "🔇" : "🔊"}</span>
          <span className="text-[10px] font-semibold">{isMuted ? (t?.soundOff || "Без звука") : (t?.soundOn || "Звук вкл")}</span>
        </button>
      </div>

      {/* Floating Center Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Double Tap Bursting Heart Animation */}
      {doubleTapHeart && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in zoom-in duration-200">
          <div className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.9)] animate-bounce">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      )}

      {/* Video Buffering Spinner (Slow Internet Resilience) */}
      {videoBuffering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-black/30 backdrop-blur-[2px]">
          <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin shadow-2xl" />
        </div>
      )}

      {/* Slow Internet Fallback / Error State */}
      {videoError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-3">
          <span className="text-4xl">📡</span>
          <p className="text-sm font-bold text-white">{t?.slowInternet || "Медленное интернет-соединение"}</p>
          <p className="text-xs text-slate-400 max-w-xs">
            {t?.slowInternetDesc || "Не удалось быстро загрузить видео. Нажмите кнопку ниже для повторной попытки."}
          </p>
          <button
            onClick={() => {
              setVideoError(false);
              setVideoBuffering(true);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition"
          >
            🔄 {t?.retryLoad || "Повторить загрузку"}
          </button>
        </div>
      ) : (
        /* Video Player Element with Poster & Metadata Preload */
        <video
          key={currentReel.id}
          ref={videoRef}
          src={currentReel.video_url}
          poster={currentReel.thumbnail_url}
          preload="metadata"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleVideoClick}
          onWaiting={() => setVideoBuffering(true)}
          onPlaying={() => setVideoBuffering(false)}
          onCanPlay={() => setVideoBuffering(false)}
          onError={() => {
            setVideoBuffering(false);
            setVideoError(true);
          }}
        />
      )}

      {/* Modern Sleek Instagram Reels Right Floating Action Bar */}
      <div className="absolute right-2.5 bottom-6 z-20 flex flex-col items-center space-y-3 pointer-events-auto">
        {/* Like Button */}
        <button
          onClick={toggleLike}
          className="flex flex-col items-center space-y-0.5 active:scale-125 transition-transform"
          title={t?.likes || "Нравится"}
        >
          <div className="p-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/10 shadow-lg">
            <svg
              className={`w-6 h-6 transition-colors ${
                currentReel.is_liked
                  ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                  : "text-white fill-none stroke-currentColor"
              }`}
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">
            {formatCompactCount(currentReel.likes_count || 0)}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={openComments}
          className="flex flex-col items-center space-y-0.5 active:scale-125 transition-transform"
          title={t?.comments || "Комментарии"}
        >
          <div className="p-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/10 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">
            {formatCompactCount(currentReel.comments_count || 0)}
          </span>
        </button>

        {/* Share / Direct Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center space-y-0.5 active:scale-125 transition-transform"
          title={t?.share || "Поделиться"}
        >
          <div className="p-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/10 shadow-lg">
            <svg className="w-6 h-6 text-white -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          {currentReel.shares_count > 0 && (
            <span className="text-white text-[10px] font-bold drop-shadow">
              {formatCompactCount(currentReel.shares_count)}
            </span>
          )}
        </button>

        {/* Bookmark / Save Reel Button */}
        <button
          onClick={toggleSave}
          className="flex flex-col items-center space-y-0.5 active:scale-125 transition-transform"
          title={currentReel.is_saved ? (t?.saved || "Сохранено") : (t?.save || "Сохранить")}
        >
          <div className="p-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/10 shadow-lg">
            <svg
              className={`w-6 h-6 transition-colors ${
                currentReel.is_saved
                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                  : "text-white fill-none stroke-currentColor"
              }`}
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        </button>

        {/* More Options Menu (Copy link & Delete) */}
        <div className="relative">
          <button
            onClick={() => setShowReelOptionsMenu(!showReelOptionsMenu)}
            className="p-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/10 text-white shadow-lg active:scale-125 transition-transform"
            title="Опции"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {showReelOptionsMenu && (
            <div className="absolute right-0 bottom-full mb-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-lg flex flex-col space-y-1 min-w-[160px] z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setShowReelOptionsMenu(false);
                  handleDownloadReel();
                }}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-xl text-xs text-white transition text-left"
              >
                <span>📥</span>
                <span>Сохранить видео</span>
              </button>
              <button
                onClick={() => {
                  setShowReelOptionsMenu(false);
                  handleCopyLink();
                }}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-xl text-xs text-white transition text-left"
              >
                <span>🔗</span>
                <span>{t?.copyLink || "Ссылка"}</span>
              </button>
              {(currentReel.author?.id === user?.id || currentReel.user_id === user?.id || user?.role === "director") && (
                <button
                  onClick={() => {
                    setShowReelOptionsMenu(false);
                    handleDeleteReel(currentReel.id);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs transition text-left"
                >
                  <span>🗑️</span>
                  <span>{t?.delete || "Удалить"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sleek Instagram Vinyl Music Disc */}
        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 p-0.5 animate-spin shadow-xl">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-black" />
          </div>
        </div>
      </div>

      {/* Bottom Instagram Author & Caption Overlay */}
      <div className="absolute left-3 right-16 bottom-3 z-20 text-white pointer-events-auto">
        {/* Author Line with Avatar */}
        <div
          className="flex items-center space-x-2 mb-1.5 cursor-pointer w-max"
          onClick={() => {
            triggerHaptic("light");
            if (onOpenProfile && currentReel?.author?.id) onOpenProfile(currentReel.author.id);
          }}
        >
          <img
            src={currentReel.author?.avatar_url || DEFAULT_AVATAR}
            alt="Author"
            className="w-8 h-8 rounded-full border border-white/30 object-cover shadow-md"
          />
          <span className="font-black text-xs tracking-wide text-white drop-shadow">
            @{currentReel.author?.username || "пользователь"}
          </span>
          {currentReel.author?.badge_type === "gold_founder" ? (
            <span className="text-amber-400 text-xs font-black drop-shadow" title="Золотая Галочка Основателя">👑</span>
          ) : currentReel.author?.is_verified ? (
            <span className="text-sky-400 text-xs font-bold drop-shadow">✓</span>
          ) : null}
          {currentReel.author?.id !== user?.id && !currentReel.author?.is_following && (
            <button
              onClick={handleFollowAuthor}
              className="text-[11px] font-bold text-pink-400 hover:text-pink-300 ml-1 bg-pink-500/10 border border-pink-500/30 px-2 py-0.5 rounded-lg transition active:scale-95"
            >
              {t?.follow || "Подписаться"}
            </button>
          )}
        </div>

        {/* Caption with Expand/Collapse */}
        <div className="text-xs text-slate-100 drop-shadow-md mb-2 max-w-sm">
          <p className={`${captionExpanded ? "" : "line-clamp-2"} leading-relaxed`}>
            {currentReel.caption}
          </p>
          {currentReel.caption && currentReel.caption.length > 80 && (
            <button
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="text-[11px] text-slate-400 hover:text-white font-bold ml-1"
            >
              {captionExpanded ? "свернуть" : "...ещё"}
            </button>
          )}
        </div>

        {/* Views & Demographics Pill */}
        <div
          onClick={() => setShowAnalyticsModal(true)}
          className="mb-2 flex items-center space-x-2 bg-black/50 backdrop-blur-md border border-white/15 hover:border-pink-500/80 rounded-full px-3 py-1 text-[11px] text-slate-200 cursor-pointer w-max transition-all shadow-lg active:scale-95"
        >
          <span className="text-pink-400 font-black">
            👁️ {currentReel.views_count?.toLocaleString() || 1}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300 font-bold">
            👥 {currentReel.analytics?.top_age_group || "18–24 года (46%)"}
          </span>
          <span className="text-sky-400 text-[10px] font-semibold">📊 Инфо</span>
        </div>

        {/* Instagram Audio Ticker with Equalizer Animation */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-200 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full w-max max-w-full border border-white/10 shadow-lg">
          <span className="animate-pulse">🎵</span>
          <span className="truncate max-w-[200px]">
            {currentReel.audio_title || "Original Sound - Venstogram"} • {currentReel.audio_author || "Vensto Music"}
          </span>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div
          onClick={() => setShowAnalyticsModal(false)}
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[75vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="text-sm font-black text-white">Статистика просмотров и аудитории</h3>
                  <span className="text-[11px] text-slate-400">Reels @{currentReel.author?.username}</span>
                </div>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-slate-400 hover:text-white p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Total Views Card */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Всего просмотров</span>
                <span className="text-2xl font-black text-white block mt-0.5">
                  {currentReel.views_count?.toLocaleString() || 1} 👁️
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Среднее удержание</span>
                <span className="text-base font-black text-emerald-400 block mt-0.5">
                  {currentReel.analytics?.avg_watch_time || "19.2 сек"}
                </span>
              </div>
            </div>

            {/* Age Breakdown */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">👥 Возраст зрителей:</h4>
                <span className="text-[10px] text-pink-400 font-semibold">ТОП: 18–24 года</span>
              </div>

              {(currentReel.analytics?.age_demographics || [
                { label: "18–24 года", percent: 46 },
                { label: "25–34 года", percent: 34 },
                { label: "35–44 года", percent: 14 },
                { label: "Младше 18 лет", percent: 6 }
              ]).map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{group.label}</span>
                    <span className="text-pink-400 font-black">{group.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${group.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Gender Demographics */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-around text-center text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">👨 Мужчины</span>
                <span className="font-black text-white text-base">52%</span>
              </div>
              <div className="w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 text-[11px] block">👩 Женщины</span>
                <span className="font-black text-pink-400 text-base">48%</span>
              </div>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              Закрыть статистику
            </button>
          </div>
        </div>
      )}

      {/* Comments Drawer */}
      {commentsReelId && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 rounded-t-3xl max-h-[70vh] flex flex-col border-t border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">{t.comments} ({reelComments.length})</span>
              <button onClick={() => setCommentsReelId(null)} className="text-slate-400">✕</button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {reelComments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Комментариев пока нет. Будьте первыми! ✨
                </div>
              ) : (
                reelComments.map((c) => {
                  const isNested = Boolean(c.parent_id);
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start space-x-2.5 transition-all ${
                        isNested ? "ml-5 pl-2 border-l-2 border-pink-500/50 bg-pink-950/10 rounded-r-xl" : ""
                      }`}
                    >
                      <img
                        src={c.author?.avatar_url || DEFAULT_AVATAR}
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="bg-slate-950 p-2.5 rounded-xl text-xs flex-1 border border-slate-800">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white block">@{c.author?.username}</span>
                            {isNested && (
                              <span className="text-[9px] text-pink-400 bg-pink-950/60 px-1 py-0.2 rounded font-semibold">
                                ↳ ответ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleReplyToReelComment(c)}
                              className="text-[10px] text-sky-400 hover:underline font-bold"
                            >
                              Ответить
                            </button>
                            {(c.author?.id === user?.id || c.user_id === user?.id || currentReel.author?.id === user?.id || user?.role === "director") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReelComment(commentsReelId, c.id)}
                                className="text-[10px] text-rose-500 hover:text-rose-400"
                                title="Удалить комментарий"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                        <span className="text-slate-300 mt-0.5 block">{c.text}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Banner */}
            {replyToReelComment && (
              <div className="bg-slate-800/90 px-4 py-1.5 flex items-center justify-between text-[11px] text-pink-300 border-t border-slate-700/60">
                <span>↳ Ответ для <strong className="text-white">@{replyToReelComment.username}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyToReelComment(null);
                    setCommentText("");
                  }}
                  className="text-slate-400 hover:text-white font-bold ml-2 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={submitReelComment} className="p-3 border-t border-slate-800 flex space-x-2 bg-slate-950">
              <input
                type="text"
                ref={reelCommentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.writeComment}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-white outline-none"
              />
              <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-full text-xs font-bold">
                {t.post}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Friend Share Modal */}
      {shareModalOpen && currentReel && (
        <ShareModal
          item={currentReel}
          type="reel"
          onClose={() => setShareModalOpen(false)}
          t={t}
        />
      )}
    </div>
  );
}
