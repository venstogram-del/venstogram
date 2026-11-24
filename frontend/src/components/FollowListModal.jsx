import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { Api } from "../api.js";

var DEFAULT_AVATAR = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E";

export function FollowListModal({
  userId,
  type = "followers", // "followers" | "following"
  title,
  currentUser,
  onClose,
  onOpenProfile,
  onFollowChanged
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    loadList();
  }, [userId, type]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await Api.get(`/users/${userId}/${type}`);
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn("load follow list error", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetUser, e) => {
    e.stopPropagation();
    triggerHaptic("medium");
    setActionLoadingId(targetUser.id);

    const prevFollowing = targetUser.is_following;
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: !prevFollowing } : u))
    );

    try {
      const res = await Api.post(`/users/${targetUser.id}/follow`, {});
      if (res && typeof res.is_following === "boolean") {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: res.is_following } : u))
        );
      }
      if (onFollowChanged) {
        onFollowChanged(targetUser.id, res?.is_following ?? !prevFollowing);
      }
    } catch (err) {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: prevFollowing } : u))
      );
      alert("Не удалось изменить статус подписки.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
      (u.last_name && u.last_name.toLowerCase().includes(q))
    );
  });

  const displayTitle = title || (type === "followers" ? "Подписчики" : "Подписки");

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in select-none">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {type === "followers" ? "👥" : "✨"}
            </span>
            <h3 className="text-sm font-black text-white">
              {displayTitle}
            </h3>
            <span className="text-xs bg-slate-800 text-pink-400 font-bold px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск по имени или никнейму..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
            />
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="w-7 h-7 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Загрузка списка...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-12 text-slate-500 space-y-2">
              <span className="text-3xl block">📭</span>
              <p className="text-xs font-semibold">
                {searchQuery ? "Пользователи не найдены" : "Список пуст"}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  triggerHaptic("light");
                  if (onOpenProfile) onOpenProfile(u.id);
                  onClose();
                }}
                className="pt-2 flex items-center justify-between space-x-3 cursor-pointer hover:bg-slate-800/40 p-2 rounded-xl transition active:scale-99"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={u.avatar_url || DEFAULT_AVATAR}
                    alt={u.username}
                    className="w-11 h-11 rounded-full object-cover border border-slate-700"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-bold text-white truncate">
                        {u.first_name} {u.last_name || ""}
                      </span>
                      {u.is_verified && (
                        <span className="text-sky-400 text-[10px] font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-[11px] text-pink-400 font-semibold block truncate">
                      @{u.username}
                    </span>
                  </div>
                </div>

                {/* Follow / Unfollow button if not current user */}
                {!u.is_me && (
                  <button
                    onClick={(e) => handleToggleFollow(u, e)}
                    disabled={actionLoadingId === u.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                      u.is_following
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                        : "bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-500 hover:to-rose-500 shadow-pink-600/30"
                    }`}
                  >
                    {actionLoadingId === u.id ? (
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : u.is_following ? (
                      "Подписки ✓"
                    ) : (
                      "+ Подписаться"
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
