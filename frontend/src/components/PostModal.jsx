import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";
import { AudienceStatsModal } from "./AudienceStatsModal.jsx";
import { CityLocationModal } from "./CityLocationModal.jsx";

export function PostModal({ post, currentUser, onClose, onPostUpdated, onPostDeleted }) {
  const isVideoMedia = (url, mediaType) => {
    if (mediaType === "video") return true;
    if (!url) return false;
    const clean = url.split("?")[0].toLowerCase();
    return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov") || clean.endsWith(".m4v") || clean.endsWith(".ogg") || clean.includes("/video");
  };

  const [currentPost, setCurrentPost] = useState(post);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likers, setLikers] = useState([]);
  const [showLikers, setShowLikers] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Запрещенный контент / Порнография (Ст. 130 УК РУз)");
  const [isSaved, setIsSaved] = useState(post?.is_saved || false);
  const [deleting, setDeleting] = useState(false);
  const [replyToComment, setReplyToComment] = useState(null); // { id, username }
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const commentInputRef = useRef(null);

  useEffect(() => {
    if (post && post.id) {
      loadComments(post.id);
    }
  }, [post]);

  const loadComments = async (postId) => {
    try {
      const res = await Api.get(`/posts/${postId}/comments`);
      setComments(res || []);
    } catch (e) {
      setComments([]);
    }
  };

  const loadLikers = async (postId) => {
    triggerHaptic("light");
    try {
      const res = await Api.get(`/posts/${postId}/likers`);
      setLikers(res || []);
      setShowLikers(true);
    } catch (e) {
      setLikers([]);
      setShowLikers(true);
    }
  };

  const handleLike = async () => {
    triggerHaptic("medium");
    SoundEngine.playLike();

    const newLiked = !currentPost.is_liked;
    const newCount = newLiked ? currentPost.likes_count + 1 : Math.max(0, currentPost.likes_count - 1);

    const updated = {
      ...currentPost,
      is_liked: newLiked,
      likes_count: newCount
    };
    setCurrentPost(updated);
    if (onPostUpdated) onPostUpdated(updated);

    try {
      await Api.post(`/posts/${currentPost.id}/like`, {});
    } catch (e) {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    triggerHaptic("light");
    const text = newComment;
    setNewComment("");

    try {
      const added = await Api.post(`/posts/${currentPost.id}/comments`, {
        text,
        parent_id: replyToComment?.id || null
      });
      setComments((prev) => [...prev, added]);
      setReplyToComment(null);

      const updated = {
        ...currentPost,
        comments_count: (currentPost.comments_count || 0) + 1
      };
      setCurrentPost(updated);
      if (onPostUpdated) onPostUpdated(updated);
    } catch (e) {}
  };

  const handleReplyToComment = (c) => {
    triggerHaptic("light");
    if (!c || !c.author?.username) return;
    setReplyToComment({ id: c.id, username: c.author.username });
    setNewComment(`@${c.author.username} `);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Удалить этот комментарий?")) return;
    triggerHaptic("medium");
    try {
      await Api.delete(`/posts/${currentPost.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      const updated = {
        ...currentPost,
        comments_count: Math.max(0, (currentPost.comments_count || 1) - 1)
      };
      setCurrentPost(updated);
      if (onPostUpdated) onPostUpdated(updated);
    } catch (err) {
      alert("Ошибка удаления комментария: " + err.message);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Вы действительно хотите навсегда удалить эту публикацию?")) return;
    setDeleting(true);
    triggerHaptic("heavy");
    try {
      await Api.delete(`/posts/${currentPost.id}`);
      alert("Публикация успешно удалена!");
      if (onPostDeleted) onPostDeleted(currentPost.id);
      onClose();
    } catch (err) {
      alert("Ошибка удаления публикации: " + err.message);
      setDeleting(false);
    }
  };

  const handleShare = () => {
    triggerHaptic("selection");
    try {
      if (window.Telegram?.WebApp?.switchInlineQuery) {
        window.Telegram.WebApp.switchInlineQuery(
          `Посмотри публикацию @${currentPost.author?.username || 'user'} в VENSTOGRAM: ${currentPost.caption?.slice(0, 50)}...`
        );
      } else {
        navigator.clipboard?.writeText(window.location.href);
        alert("Ссылка на публикацию скопирована в буфер!");
      }
    } catch (e) {}
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    triggerHaptic("heavy");
    try {
      await Api.post(`/posts/${currentPost.id}/report`, { reason: reportReason });
      alert("Жалоба принята. Контент передан Директору и модераторам для проверки по законам РУз.");
      setReportModalOpen(false);
    } catch (err) {
      alert("Ошибка отправки жалобы: " + err.message);
    }
  };

  if (!currentPost) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img
              src={currentPost.author?.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-pink-500"
            />
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-black text-white">
                  {currentPost.author?.first_name} {currentPost.author?.last_name || ""}
                </span>
                {currentPost.author?.is_verified && <span className="text-sky-400 text-xs font-bold">✓</span>}
              </div>
              <span className="text-[10px] text-pink-400 font-semibold block">
                @{currentPost.author?.username}
              </span>
              {currentPost.location && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setLocationModalOpen(true);
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold block hover:underline text-left"
                >
                  📍 {currentPost.location.replace(/^📍\s*/, "")}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {(currentPost.author?.id === currentUser?.id || currentPost.user_id === currentUser?.id || currentUser?.role === "director") && (
              <button
                onClick={handleDeletePost}
                disabled={deleting}
                className="text-rose-500 hover:text-rose-400 p-1 text-sm font-bold transition-transform active:scale-90"
                title="Удалить публикацию"
              >
                {deleting ? "..." : "🗑️"}
              </button>
            )}
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-slate-500 hover:text-rose-400 p-1 text-xs"
              title="Пожаловаться"
            >
              🚩
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-base font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Media Container */}
        <div className="bg-black max-h-72 sm:max-h-80 flex items-center justify-center overflow-hidden relative">
          {isVideoMedia(currentPost.media_urls?.[0], currentPost.media_type) ? (
            <video
              src={currentPost.media_urls?.[0]}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={
                (currentPost.media_urls && currentPost.media_urls[0]) ||
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"
              }
              alt="Post media"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Action Bar (Like, Comment, Share, Save) */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 text-xs font-bold text-slate-300 hover:text-white transition-transform active:scale-125"
            >
              <span className={`text-xl ${currentPost.is_liked ? "text-rose-500 animate-pulse" : "text-slate-400"}`}>
                {currentPost.is_liked ? "❤️" : "🤍"}
              </span>
              <span onClick={(e) => { e.stopPropagation(); loadLikers(currentPost.id); }} className="hover:underline">
                {currentPost.likes_count || 0}
              </span>
            </button>

            {/* Comments Counter */}
            <div className="flex items-center space-x-1 text-xs font-bold text-slate-300">
              <span className="text-lg">💬</span>
              <span>{currentPost.comments_count || comments.length}</span>
            </div>

            {/* Repost / Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-xs font-bold text-slate-300 hover:text-pink-400"
              title="Поделиться"
            >
              <span className="text-lg">↗️</span>
              <span className="text-[11px]">Репост</span>
            </button>
          </div>

          {/* Views & Save Bookmark */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                triggerHaptic("light");
                setStatsModalOpen(true);
              }}
              className="text-[11px] text-slate-300 hover:text-cyan-400 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-full flex items-center space-x-1.5 transition-all border border-slate-700/60"
              title="Statistika va auditoriya yoshi"
            >
              <span>📊</span>
              <span className="font-semibold">{currentPost.views_count || 128}</span>
              <span className="text-[9px] text-cyan-400 font-bold uppercase">Auditoriya</span>
            </button>

            <button
              onClick={async () => {
                triggerHaptic("medium");
                const nextVal = !isSaved;
                setIsSaved(nextVal);
                try {
                  await Api.post(`/posts/${currentPost.id}/save`, {});
                } catch (e) {}
              }}
              className="text-base text-slate-400 hover:text-amber-400 transition"
              title={isSaved ? "Удалить из сохраненного" : "Сохранить публикацию"}
            >
              {isSaved ? "🔖" : "🏷️"}
            </button>
          </div>
        </div>

        {/* Caption & Hashtags */}
        {currentPost.caption && (
          <div className="px-4 py-2 bg-slate-950/40 text-xs text-slate-300 leading-relaxed border-b border-slate-800/60">
            <span className="font-bold text-white mr-1.5">@{currentPost.author?.username}</span>
            <span>{currentPost.caption}</span>
          </div>
        )}

        {/* Comments Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-48 bg-slate-950/60">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
            Комментарии ({comments.length}):
          </span>

          {comments.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-xs">
              Будьте первым, кто оставит комментарий! ✨
            </div>
          ) : (
            comments.map((c) => {
              const isNested = Boolean(c.parent_id);
              return (
                <div
                  key={c.id}
                  className={`flex items-start space-x-2 text-xs transition-all ${
                    isNested ? "ml-5 pl-2 border-l-2 border-pink-500/50 bg-pink-950/10 rounded-r-xl" : ""
                  }`}
                >
                  <img
                    src={c.author?.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-pink-400">@{c.author?.username}</span>
                        {isNested && (
                          <span className="text-[9px] text-pink-400/80 bg-pink-950/60 px-1 py-0.2 rounded font-semibold">
                            ↳ ответ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleReplyToComment(c)}
                          className="text-[10px] text-sky-400 hover:underline font-bold"
                        >
                          Ответить
                        </button>
                        {(c.author?.id === currentUser?.id || c.user_id === currentUser?.id || currentPost.author?.id === currentUser?.id || currentUser?.role === "director") && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-[10px] text-rose-500 hover:text-rose-400"
                            title="Удалить комментарий"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-200">{c.text}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Indicator Banner */}
        {replyToComment && (
          <div className="bg-slate-800/90 px-3 py-1.5 flex items-center justify-between text-[11px] text-pink-300 border-t border-slate-700/60">
            <span>↳ Ответ для <strong className="text-white">@{replyToComment.username}</strong></span>
            <button
              type="button"
              onClick={() => {
                setReplyToComment(null);
                setNewComment("");
              }}
              className="text-slate-400 hover:text-white font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Add Comment Input Bar */}
        <form onSubmit={handleAddComment} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Оставить комментарий..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all"
          >
            Отправить
          </button>
        </form>
      </div>

      {/* Likers Modal Sheet */}
      {showLikers && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 w-full max-w-xs space-y-3 max-h-72 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white">❤️ Кому понравилось ({likers.length}):</h4>
              <button onClick={() => setShowLikers(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            {likers.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-2">Список пока пуст</p>
            ) : (
              likers.map((u) => (
                <div key={u.id} className="flex items-center space-x-2 text-xs">
                  <img src={u.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"} className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <span className="font-bold text-white block">{u.first_name}</span>
                    <span className="text-[10px] text-pink-400">@{u.username}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <form onSubmit={handleSendReport} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-3">
            <h3 className="text-sm font-bold text-rose-400">🚩 Пожаловаться на публикацию</h3>
            <p className="text-[11px] text-slate-300">
              Материалы проверяются Директором. Нарушение законов Республики Узбекистан ведет к блокировке:
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
            >
              <option value="Порнография / Интимные материалы (Ст. 130 УК РУз)">🔞 Порнография / Секс (Ст. 130 УК РУз)</option>
              <option value="Оружие / Терроризм / Экстремизм (Ст. 244-1 УК РУз)">💣 Оружие / Экстремизм (Ст. 244-1 УК РУз)</option>
              <option value="Насилие / Побои / Жестокость (Ст. 12-1 Закона)">🩸 Насилие / Жестокость</option>
              <option value="Фальшивые чеки / Мошенничество">💳 Мошенничество / Фальшивый чек</option>
              <option value="Спам / Оскорбления">🚫 Спам или травля</option>
            </select>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Отправить жалобу
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audience Demographics & Stats Modal */}
      {statsModalOpen && (
        <AudienceStatsModal
          post={currentPost}
          onClose={() => setStatsModalOpen(false)}
        />
      )}

      {/* City Location Modal */}
      {locationModalOpen && currentPost.location && (
        <CityLocationModal
          locationName={currentPost.location}
          onClose={() => setLocationModalOpen(false)}
        />
      )}
    </div>
  );
}
