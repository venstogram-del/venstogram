import React, { useState, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function ReelsView({ reels = [], setReels, t, user }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [commentsReelId, setCommentsReelId] = useState(null);
  const [reelComments, setReelComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [deletingReel, setDeletingReel] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const touchStartY = useRef(0);
  const reelCommentInputRef = useRef(null);

  const currentReel = reels[currentIndex];

  const handleDeleteReel = async (reelId) => {
    if (!confirm("Вы действительно хотите навсегда удалить этот Reel?")) return;
    setDeletingReel(true);
    triggerHaptic("heavy");
    try {
      await Api.delete(`/reels/${reelId}`);
      alert("Reels успешно удален!");
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

  const handleReplyToReelComment = (username) => {
    triggerHaptic("light");
    if (!username) return;
    setCommentText(`@${username}, `);
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
      // Swiped Up -> Next Reel
      triggerHaptic("medium");
      setCurrentIndex((prev) => prev + 1);
    } else if (diffY < -50 && currentIndex > 0) {
      // Swiped Down -> Prev Reel
      triggerHaptic("medium");
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleLike = async () => {
    if (!currentReel) return;
    triggerHaptic("medium");
    SoundEngine.playLike();

    setReels((prev) =>
      prev.map((r, i) =>
        i === currentIndex
          ? {
              ...r,
              is_liked: !r.is_liked,
              likes_count: r.is_liked ? r.likes_count - 1 : r.likes_count + 1
            }
          : r
      )
    );

    try {
      await Api.post(`/reels/${currentReel.id}/like`, {});
    } catch (e) {}
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
      setReelComments(res);
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
        text: commentText
      });
      setReelComments((prev) => [...prev, newC]);
      setCommentText("");
      setReels((prev) =>
        prev.map((r) =>
          r.id === commentsReelId ? { ...r, comments_count: r.comments_count + 1 } : r
        )
      );
    } catch (e) {}
  };

  if (!currentReel) {
    return (
      <div className="h-[80vh] flex items-center justify-center text-slate-400">
        Нет доступных видео
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 top-[52px] bottom-[58px] bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Content */}
      <video
        key={currentReel.id}
        src={currentReel.video_url}
        poster={currentReel.thumbnail_url}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
        onClick={() => setIsMuted(!isMuted)}
      />

      {/* Top Sound Mute Badge */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs flex items-center space-x-1"
      >
        <span>{isMuted ? "🔇 Звук выкл" : "🔊 Звук вкл"}</span>
      </button>

      {/* Right Floating Actions Bar */}
      <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center space-y-5">
        {/* Author Avatar with Follow button */}
        <div className="relative">
          <img
            src={currentReel.author.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
            className="w-12 h-12 rounded-full border-2 border-white object-cover"
          />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
            +
          </div>
        </div>

        {/* Like */}
        <button onClick={toggleLike} className="flex flex-col items-center space-y-1">
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md">
            <svg
              className={`w-7 h-7 ${
                currentReel.is_liked ? "text-pink-500 fill-pink-500" : "text-white fill-none stroke-currentColor"
              }`}
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold drop-shadow">
            {currentReel.likes_count}
          </span>
        </button>

        {/* Comment */}
        <button onClick={openComments} className="flex flex-col items-center space-y-1">
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold drop-shadow">
            {currentReel.comments_count}
          </span>
        </button>

        {/* Share via Telegram */}
        <button onClick={handleShare} className="flex flex-col items-center space-y-1">
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md">
            <svg className="w-7 h-7 text-white -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold drop-shadow">
            {currentReel.shares_count || t.share}
          </span>
        </button>

        {/* Delete Reel Button for Author or Director */}
        {(currentReel.author?.id === user?.id || currentReel.user_id === user?.id || user?.role === "director") && (
          <button
            onClick={() => handleDeleteReel(currentReel.id)}
            disabled={deletingReel}
            className="flex flex-col items-center space-y-1 text-rose-500 hover:text-rose-400 active:scale-125 transition-transform"
            title="Удалить Reel"
          >
            <div className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-rose-500/40">
              <span className="text-xl">🗑️</span>
            </div>
            <span className="text-white text-[11px] font-bold drop-shadow">Удалить</span>
          </button>
        )}

        {/* Music Disc Spin */}
        <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-700 p-1 animate-spin">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-500 to-amber-500" />
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute left-4 right-20 bottom-6 z-20 text-white">
        <div className="flex items-center space-x-1.5 mb-1.5">
          <span className="font-bold text-sm">@{currentReel.author.username}</span>
          {currentReel.author.badge_type === "gold_founder" ? (
            <span className="text-amber-400 text-xs font-bold" title="Золотая Галочка Основателя">👑</span>
          ) : currentReel.author.is_verified ? (
            <span className="text-sky-400 text-xs">✓</span>
          ) : null}
        </div>
        <p className="text-xs text-slate-200 line-clamp-2 drop-shadow mb-2">
          {currentReel.caption}
        </p>

        {/* Views & Age Demographics Pill */}
        <div
          onClick={() => setShowAnalyticsModal(true)}
          className="mb-2 flex items-center space-x-2 bg-black/60 backdrop-blur-md border border-slate-700 hover:border-pink-500 rounded-full px-3 py-1 text-[11px] text-slate-200 cursor-pointer w-max transition-all shadow-md active:scale-95"
        >
          <span className="text-pink-400 font-black">👁️ {currentReel.views_count?.toLocaleString() || 1} просмотров</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300 font-bold">
            👥 Возраст: {currentReel.analytics?.top_age_group || "18–24 года (46%)"}
          </span>
          <span className="text-sky-400 text-[10px] font-semibold">📊 Инфо</span>
        </div>

        {/* Audio Track Ticker */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-300 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full w-max max-w-full">
          <span>🎵</span>
          <span className="truncate">{currentReel.audio_title} - {currentReel.audio_author}</span>
        </div>
      </div>

      {/* Analytics Modal (сколько лет человек посмотрел, пол, удержание) */}
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
                  <span className="text-[11px] text-slate-400">Reels @{currentReel.author.username}</span>
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

            {/* Age Breakdown (сколько лет человек посмотрел) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">👥 Возраст зрителей (сколько лет):</h4>
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
                reelComments.map((c) => (
                  <div key={c.id} className="flex items-start space-x-2.5">
                    <img src={c.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                    <div className="bg-slate-950 p-2.5 rounded-xl text-xs flex-1 border border-slate-800">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-white block">@{c.author?.username}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleReplyToReelComment(c.author?.username)}
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
                ))
              )}
            </div>
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
