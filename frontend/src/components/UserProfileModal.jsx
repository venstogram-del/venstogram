import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { Api } from "../api.js";
import { FollowListModal } from "./FollowListModal.jsx";

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E";

export function UserProfileModal({
  userId,
  currentUser,
  onClose,
  onOpenChat,
  onSelectPost,
  onOpenProfile,
  t
}) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // posts | reels
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [followModal, setFollowModal] = useState(null); // { type, userId, title }

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [profRes, postsRes, reelsRes] = await Promise.all([
        Api.get(`/users/${userId}/profile`).catch(() => null),
        Api.get(`/users/${userId}/posts`).catch(() => []),
        Api.get(`/users/${userId}/reels`).catch(() => [])
      ]);

      if (profRes) {
        setProfile(profRes);
        setIsFollowing(Boolean(profRes.is_following));
        setFollowersCount(profRes.followers_count || 0);
      }
      setPosts(postsRes || []);
      setReels(reelsRes || []);
    } catch (err) {
      console.warn("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    triggerHaptic("medium");
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await Api.post(`/users/${userId}/follow`, {});
    } catch (e) {
      // Revert if error
      setIsFollowing(!nextState);
      setFollowersCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleCopyLink = () => {
    triggerHaptic("light");
    const username = profile?.username || `id${userId}`;
    const url = `https://t.me/venstogrambot?startapp=u_${username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleOpenChannel = (channel) => {
    triggerHaptic("light");
    let url = channel;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const cleaned = url.replace("@", "");
      url = `https://t.me/${cleaned}`;
    }
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const isMe = currentUser?.id === userId;

  // Compute total likes across posts and reels
  const totalLikes =
    (posts.reduce((acc, p) => acc + (p.likes_count || 0), 0)) +
    (reels.reduce((acc, r) => acc + (r.likes_count || 0), 0));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto animate-fadeIn">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="flex items-center space-x-1.5 text-slate-300 hover:text-white p-1 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs font-bold">Назад</span>
        </button>

        <div className="flex items-center space-x-1.5">
          <span className="text-sm font-black text-white">
            @{profile?.username || `user_${userId}`}
          </span>
          {profile?.is_verified && (
            <span
              className={`text-xs ${
                profile?.badge_type === "gold_founder" ? "text-amber-400" : "text-sky-400"
              }`}
              title={profile?.badge_type === "gold_founder" ? "Основатель" : "Верифицирован"}
            >
              ✓
            </span>
          )}
        </div>

        <button
          onClick={handleCopyLink}
          className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
          title="Поделиться профилем"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {copySuccess && (
        <div className="bg-emerald-500 text-black text-xs font-bold text-center py-1">
          ✓ Ссылка на профиль скопирована!
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Загрузка профиля...</span>
        </div>
      ) : (
        <div className="p-4 space-y-5 pb-20">
          {/* Avatar and Bio Section */}
          <div className="flex items-start space-x-4">
            <div className="relative">
              <img
                src={profile?.avatar_url || DEFAULT_AVATAR}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-pink-500/60 p-0.5 shadow-lg bg-slate-900"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              {profile?.is_verified && (
                <span className="absolute bottom-0 right-0 bg-sky-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
                  ✓
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black text-white truncate">
                {profile?.first_name} {profile?.last_name || ""}
              </h2>
              <p className="text-xs text-pink-400 font-bold">
                @{profile?.username}
              </p>
              {profile?.bio && (
                <p className="text-xs text-slate-300 mt-1.5 whitespace-pre-line leading-relaxed">
                  {profile?.bio}
                </p>
              )}
              {profile?.telegram_channel && (
                <button
                  onClick={() => handleOpenChannel(profile.telegram_channel)}
                  className="mt-2 inline-flex items-center space-x-1 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-lg text-[11px] text-sky-300 hover:text-white"
                >
                  <span>📢 Telegram: {profile.telegram_channel}</span>
                  <span className="text-[10px]">↗</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div>
              <span className="block text-sm font-black text-white">{posts.length}</span>
              <span className="text-[10px] text-slate-400 font-medium">Посты</span>
            </div>
            <div
              onClick={() => {
                triggerHaptic("light");
                setFollowModal({ type: "followers", userId, title: `Подписчики @${profile?.username}` });
              }}
              className="cursor-pointer active:scale-95 transition hover:opacity-80"
            >
              <span className="block text-sm font-black text-white">{followersCount}</span>
              <span className="text-[10px] text-pink-400 font-bold hover:underline">Подписчики</span>
            </div>
            <div
              onClick={() => {
                triggerHaptic("light");
                setFollowModal({ type: "following", userId, title: `Подписки @${profile?.username}` });
              }}
              className="cursor-pointer active:scale-95 transition hover:opacity-80"
            >
              <span className="block text-sm font-black text-white">{profile?.following_count || 0}</span>
              <span className="text-[10px] text-pink-400 font-bold hover:underline">Подписки</span>
            </div>
            <div>
              <span className="block text-sm font-black text-pink-400">❤️ {totalLikes}</span>
              <span className="text-[10px] text-slate-400 font-medium">Лайки</span>
            </div>
          </div>

          {/* Action Buttons: Follow & Direct Message */}
          {!isMe && (
            <div className="flex space-x-2">
              <button
                onClick={handleFollowToggle}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                  isFollowing
                    ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                    : "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-600/30 active:scale-95"
                }`}
              >
                {isFollowing ? "✓ В подписках" : "+ Подписаться"}
              </button>

              <button
                onClick={() => {
                  triggerHaptic("medium");
                  onOpenChat({
                    id: profile.id,
                    username: profile.username,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url,
                    is_verified: profile.is_verified
                  });
                  onClose();
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Написать</span>
              </button>
            </div>
          )}

          {/* Grid Tabs: Posts vs Reels */}
          <div className="flex border-b border-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab("posts");
              }}
              className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
                activeTab === "posts"
                  ? "border-pink-500 text-pink-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <span>📸 Публикации</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full">
                {posts.length}
              </span>
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab("reels");
              }}
              className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
                activeTab === "reels"
                  ? "border-pink-500 text-pink-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <span>🎬 Reels</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full">
                {reels.length}
              </span>
            </button>
          </div>

          {/* Content Grids */}
          {activeTab === "posts" && (
            <div>
              {posts.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl block">📷</span>
                  <p className="text-xs font-bold text-slate-400">Нет публикаций</p>
                  <p className="text-[11px] text-slate-500">
                    Пользователь пока не поделился фото или видео
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => {
                    const thumb =
                      (post.media_urls && post.media_urls[0]) || post.media_url || "";
                    const isVideo = post.media_type === "video";
                    return (
                      <div
                        key={post.id}
                        onClick={() => {
                          triggerHaptic("light");
                          if (onSelectPost) {
                            onSelectPost(post);
                          }
                        }}
                        className="relative aspect-square bg-slate-900 overflow-hidden cursor-pointer group"
                      >
                        {isVideo ? (
                          <video
                            src={thumb}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                          />
                        ) : (
                          <img
                            src={thumb || DEFAULT_AVATAR}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_AVATAR;
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white text-[11px] font-bold">
                          <span>❤️ {post.likes_count || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "reels" && (
            <div>
              {reels.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl block">🎬</span>
                  <p className="text-xs font-bold text-slate-400">Нет Reels</p>
                  <p className="text-[11px] text-slate-500">
                    Пользователь пока не загружал короткие видео
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => {
                        triggerHaptic("light");
                        if (onSelectPost) {
                          onSelectPost(reel);
                        }
                      }}
                      className="relative aspect-[9/16] bg-slate-900 overflow-hidden cursor-pointer group"
                    >
                      <video
                        src={reel.video_url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <div className="absolute bottom-1 left-1 flex items-center space-x-1 text-white text-[10px] font-bold drop-shadow-md">
                        <span>▶ {reel.views_count || reel.likes_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Follow / Following List Modal */}
      {followModal && (
        <FollowListModal
          userId={followModal.userId}
          type={followModal.type}
          title={followModal.title}
          currentUser={currentUser}
          onClose={() => setFollowModal(null)}
          onOpenProfile={(targetId) => {
            if (onOpenProfile) onOpenProfile(targetId);
            onClose();
          }}
          onFollowChanged={async () => {
            try {
              const prof = await Api.get(`/users/${userId}/profile`);
              if (prof) {
                setFollowersCount(prof.followers_count || 0);
                setIsFollowing(Boolean(prof.is_following));
              }
            } catch (e) {}
          }}
        />
      )}
    </div>
  );
}
