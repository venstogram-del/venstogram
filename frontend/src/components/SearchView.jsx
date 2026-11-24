import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { Api } from "../api.js";

export function SearchView({ currentUser, t, onOpenChat, onOpenProfile }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    if (!query.trim()) {
      loadRecommendations();
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await Api.get("/users/search?q=");
      setResults(res || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await Api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUser) => {
    triggerHaptic("medium");
    const isCurrentlyFollowing = followingMap[targetUser.id];
    setFollowingMap((prev) => ({ ...prev, [targetUser.id]: !isCurrentlyFollowing }));

    try {
      await Api.post(`/users/${targetUser.id}/follow`, {});
    } catch (err) {
      // Revert if error
      setFollowingMap((prev) => ({ ...prev, [targetUser.id]: isCurrentlyFollowing }));
    }
  };

  const handleOpenUserTelegramChannel = (channel) => {
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

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Search Bar Header */}
      <div className="sticky top-12 z-20 bg-slate-950/95 backdrop-blur-md pt-1 pb-2">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Найти друга по имени или @никнейму..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-10 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-inner"
          />
          <div className="absolute left-3.5 top-3.5 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {query && (
            <button
              onClick={() => {
                triggerHaptic("light");
                setQuery("");
              }}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Subheader */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>{query ? `Результаты поиска (${results.length}):` : "🔥 Рекомендованные друзья и авторы:"}</span>
        {loading && <span className="text-pink-400 text-[11px] animate-pulse">Поиск...</span>}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((u) => {
          const isFollowing = followingMap[u.id];
          const isMe = currentUser && currentUser.id === u.id;

          return (
            <div
              key={u.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex flex-col space-y-2.5 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  onClick={() => {
                    triggerHaptic("light");
                    if (onOpenProfile) onOpenProfile(u.id);
                  }}
                  className="flex items-center space-x-3 cursor-pointer hover:opacity-85 transition-opacity flex-1 min-w-0"
                >
                  <div className="relative">
                    <img
                      src={u.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
                      alt={u.username}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-800"
                    />
                    {u.is_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-black text-white">
                        {u.first_name} {u.last_name || ""}
                      </span>
                    </div>
                    <span className="text-[11px] text-pink-400 font-bold block">
                      @{u.username}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      👥 {u.followers_count || 0} подписчиков
                    </span>
                  </div>
                </div>

                {!isMe && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleFollowToggle(u)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isFollowing
                          ? "bg-slate-800 text-slate-300 border border-slate-700"
                          : "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-600/30"
                      }`}
                    >
                      {isFollowing ? "В подписках" : "+ Подписаться"}
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        onOpenChat(u);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl border border-slate-700"
                      title="Написать сообщение"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {u.bio && (
                <p className="text-[11px] text-slate-300 line-clamp-2 pl-1 leading-relaxed">
                  {u.bio}
                </p>
              )}

              {u.telegram_channel && (
                <button
                  onClick={() => handleOpenUserTelegramChannel(u.telegram_channel)}
                  className="w-full text-left bg-sky-950/40 border border-sky-800/40 rounded-xl px-2.5 py-1.5 text-[11px] text-sky-300 hover:text-sky-200 flex items-center justify-between"
                >
                  <span className="truncate">📢 Telegram: {u.telegram_channel}</span>
                  <span className="text-[9px] bg-sky-600/30 px-1 py-0.5 rounded text-sky-200 ml-1 shrink-0">
                    Открыть ↗
                  </span>
                </button>
              )}
            </div>
          );
        })}

        {!loading && results.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <span className="text-4xl block">🔍</span>
            <p className="text-xs font-bold text-slate-300">Никого не найдено</p>
            <p className="text-[11px] text-slate-500">
              Попробуйте ввести другой никнейм или имя вашего друга
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
