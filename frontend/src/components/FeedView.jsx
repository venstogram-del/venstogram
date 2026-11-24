import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic, tg } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function FeedView({ posts = [], setPosts, t, onOpenProfile, user }) {
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [animatingHeartPostId, setAnimatingHeartPostId] = useState(null);
  const [inspectPost, setInspectPost] = useState(null);
  const [ads, setAds] = useState([]);
  const commentInputRef = useRef(null);

  useEffect(() => {
    Api.get("/posts/ads/active")
      .then((data) => {
        if (Array.isArray(data)) setAds(data);
      })
      .catch((err) => console.log("Failed to load active ads:", err));
  }, []);

  const handleAdClick = (ad) => {
    triggerHaptic("medium");
    Api.post(`/posts/ads/${ad.id}/click`, {}).catch(() => {});
    if (ad.target_url) {
      if (ad.target_url.startsWith("https://t.me/") && window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(ad.target_url);
      } else {
        window.open(ad.target_url, "_blank");
      }
    }
  };

  const handleLike = async (post) => {
    triggerHaptic("medium");
    SoundEngine.playLike();

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      )
    );

    try {
      await Api.post(`/posts/${post.id}/like`, {});
    } catch (e) {
      // Revert if error
    }
  };

  const handleDoubleTap = (post) => {
    setAnimatingHeartPostId(post.id);
    setTimeout(() => setAnimatingHeartPostId(null), 800);
    if (!post.is_liked) {
      handleLike(post);
    } else {
      triggerHaptic("light");
      SoundEngine.playLike();
    }
  };

  const openComments = async (postId) => {
    triggerHaptic("light");
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await Api.get(`/posts/${postId}/comments`);
      setComments(res);
    } catch (e) {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentsPostId) return;

    triggerHaptic("light");
    const textToSend = newCommentText;
    setNewCommentText("");

    try {
      const newComment = await Api.post(`/posts/${activeCommentsPostId}/comments`, {
        text: textToSend
      });
      setComments((prev) => [...prev, newComment]);
      // Update comment count on post
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activeCommentsPostId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
    } catch (e) {}
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Вы действительно хотите удалить эту публикацию?")) return;
    triggerHaptic("heavy");
    try {
      await Api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (inspectPost && inspectPost.id === postId) {
        setInspectPost(null);
      }
      alert("Публикация успешно удалена!");
    } catch (err) {
      alert("Ошибка удаления публикации: " + err.message);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm("Удалить этот комментарий?")) return;
    triggerHaptic("medium");
    try {
      await Api.delete(`/posts/${postId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
        )
      );
    } catch (err) {
      alert("Ошибка удаления комментария: " + err.message);
    }
  };

  const handleReplyToComment = (authorUsername) => {
    triggerHaptic("light");
    if (!authorUsername) return;
    setNewCommentText(`@${authorUsername}, `);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);
  };

  const handleShare = (post) => {
    triggerHaptic("selection");
    try {
      if (window.Telegram?.WebApp?.switchInlineQuery) {
        window.Telegram.WebApp.switchInlineQuery(
          `Посмотри этот пост в Venstogram: @${post.author.username} - "${post.caption.slice(0, 50)}..."`
        );
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Ссылка на публикацию скопирована!");
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-4 pb-20">
      {posts.map((post, index) => (
        <React.Fragment key={post.id}>
          <article className="bg-slate-950 border-b border-slate-900 pb-3">
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div
                className="flex items-center space-x-2.5 cursor-pointer"
                onClick={() => onOpenProfile && onOpenProfile(post.author.id)}
              >
                <img
                  src={post.author.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={post.author.username}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/30"
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {post.author.username}
                    </span>
                    {post.author.badge_type === "gold_founder" ? (
                      <span className="text-amber-400 text-xs font-bold" title="Золотая Галочка Основателя">
                        👑
                      </span>
                    ) : post.author.is_verified ? (
                      <span className="text-sky-400 text-xs" title="Venstogram Verified">
                        ✓
                      </span>
                    ) : null}
                  </div>
                  {post.location && (
                    <span className="text-[10px] text-slate-400 block -mt-0.5">{post.location}</span>
                  )}
                </div>
              </div>

            <div className="flex items-center space-x-1">
              {(post.author?.id === user?.id || post.user_id === user?.id || user?.role === "director") && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost(post.id);
                  }}
                  className="text-rose-500 hover:text-rose-400 p-1 text-sm font-bold transition-transform active:scale-90"
                  title="Удалить публикацию"
                >
                  🗑️
                </button>
              )}
              <button className="text-slate-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="6" cy="12" r="1.5" />
                  <circle cx="18" cy="12" r="1.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Media Content with Double Tap / Click to Inspect */}
          <div
            className="relative w-full aspect-square bg-slate-900 overflow-hidden select-none cursor-pointer"
            onClick={() => setInspectPost(post)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDoubleTap(post);
            }}
          >
            {post.media_urls && post.media_urls[0] ? (
              <img
                src={post.media_urls[0]}
                alt="Post content"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <span>Медиа недоступно</span>
              </div>
            )}

            {/* Double Tap Heart Animation */}
            {animatingHeartPostId === post.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                <span className="text-7xl text-pink-500 drop-shadow-2xl">❤️</span>
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="px-4 pt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <button
                onClick={() => handleLike(post)}
                className="flex items-center space-x-1 text-slate-300 hover:text-pink-500 transition-colors"
              >
                <svg
                  className={`w-6 h-6 transition-transform active:scale-125 ${
                    post.is_liked ? "text-pink-500 fill-pink-500" : "fill-none stroke-currentColor"
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
              </button>

              {/* Comment Button */}
              <button
                onClick={() => openComments(post.id)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>

              {/* Share via Telegram switchInlineQuery */}
              <button
                onClick={() => handleShare(post)}
                className="text-slate-300 hover:text-sky-400 transition-colors"
              >
                <svg className="w-6 h-6 -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Bookmark */}
            <button className="text-slate-400 hover:text-amber-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          {/* Likes Count */}
          <div className="px-4 mt-2">
            <span className="text-xs font-bold text-white">
              {post.likes_count.toLocaleString()} {t.likes}
            </span>
          </div>

          {/* Caption & Hashtags */}
          <div className="px-4 mt-1 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white mr-1.5">{post.author.username}</span>
            <span>{post.caption}</span>
          </div>

          {/* Comments Link */}
          {post.comments_count > 0 && (
            <button
              onClick={() => openComments(post.id)}
              className="px-4 mt-1 text-[11px] text-slate-400 hover:text-slate-200 block"
            >
              Посмотреть все {post.comments_count} {t.comments}
            </button>
          )}
          </article>

          {/* Sponsored Ad Injection */}
          {ads.length > 0 && (index === 0 || (index + 1) % 3 === 0) && (
            <div className="mx-3 my-2 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Реклама / Спонсировано
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">@{ads[index % ads.length].advertiser_name}</span>
              </div>

              {ads[index % ads.length].image_url && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950">
                  <img
                    src={ads[index % ads.length].image_url}
                    alt={ads[index % ads.length].title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-white">{ads[index % ads.length].title}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {ads[index % ads.length].description}
                </p>
              </div>

              <button
                onClick={() => handleAdClick(ads[index % ads.length])}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1 active:scale-98"
              >
                <span>{ads[index % ads.length].cta_text || "Перейти ↗"}</span>
              </button>
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Comments Drawer / Bottom Sheet */}
      {activeCommentsPostId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">{t.comments}</span>
              <button
                onClick={() => setActiveCommentsPostId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingComments ? (
                <div className="text-center py-6 text-slate-400 text-xs">Загрузка комментариев...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Комментариев пока нет. Будьте первыми!</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start space-x-2.5">
                    <img
                      src={c.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-bold text-white">@{c.author?.username}</span>
                          {c.author?.is_verified && <span className="text-sky-400 text-[10px]">✓</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleReplyToComment(c.author?.username)}
                            className="text-[10px] text-sky-400 hover:underline font-bold"
                          >
                            Ответить
                          </button>
                          {(c.author?.id === user?.id || c.user_id === user?.id || user?.role === "director") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(activeCommentsPostId, c.id)}
                              className="text-[10px] text-rose-500 hover:text-rose-400"
                              title="Удалить комментарий"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={submitComment} className="p-3 border-t border-slate-800 flex items-center space-x-2 bg-slate-950">
              <input
                type="text"
                ref={commentInputRef}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={t.writeComment}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-full transition-all"
              >
                {t.post}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Full Post Inspection Modal */}
      {inspectPost && (
        <PostModal
          post={inspectPost}
          currentUser={user}
          onClose={() => setInspectPost(null)}
          onPostUpdated={(updated) => {
            setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
          }}
          onPostDeleted={(deletedId) => {
            setPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setInspectPost(null);
          }}
        />
      )}
    </div>
  );
}
