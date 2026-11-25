import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { Api } from "../api.js";

var DEFAULT_AVATAR = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return `${Math.floor(diff / 86400)} дн назад`;
  } catch (e) {
    return "";
  }
}

export function NotificationsModal({
  onClose,
  onOpenProfile,
  onUnreadCountChanged
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'likes' | 'follows'
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await Api.get("/users/notifications");
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        if (onUnreadCountChanged) {
          onUnreadCountChanged(data.unread_count || 0);
        }
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn("load notifications error", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    triggerHaptic("medium");
    setMarkingAll(true);
    try {
      await Api.post("/users/notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (onUnreadCountChanged) {
        onUnreadCountChanged(0);
      }
    } catch (err) {
      console.warn("mark all read error", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === "likes") {
      return n.type === "like_post" || n.type === "like_reel";
    }
    if (filter === "follows") {
      return n.type === "follow" || n.type === "unfollow";
    }
    return true;
  });

  const unreadTotal = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-rose-500/20 text-rose-500 rounded-xl">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-1.5">
                <span>Действия и уведомления</span>
                {unreadTotal > 0 && (
                  <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                    {unreadTotal}
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">Лайки, новые подписчики и события</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadTotal > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-[10px] text-pink-400 hover:text-pink-300 font-bold px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 transition active:scale-95"
              >
                {markingAll ? "..." : "Прочитать"}
              </button>
            )}
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 p-2.5 px-4 bg-slate-950/30 border-b border-slate-800/60 text-xs">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setFilter("all");
            }}
            className={`px-3 py-1 rounded-full font-bold text-[11px] transition ${
              filter === "all"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            Все ({notifications.length})
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setFilter("likes");
            }}
            className={`px-3 py-1 rounded-full font-bold text-[11px] transition flex items-center space-x-1 ${
              filter === "likes"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <span>❤️ Лайки</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setFilter("follows");
            }}
            className={`px-3 py-1 rounded-full font-bold text-[11px] transition flex items-center space-x-1 ${
              filter === "follows"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <span>👥 Подписчики</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Загрузка уведомлений...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400 space-y-2">
              <span className="text-3xl block">💌</span>
              <p className="text-xs font-bold text-white">Уведомлений пока нет</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Когда кто-то поставит лайк вашей публикации, подпишется на ваш аккаунт или Основатель подарит подарок — вы увидите это здесь.
              </p>
            </div>
          ) : (
            filteredList.map((n) => {
              const actor = n.actor;
              const isLike = n.type === "like_post" || n.type === "like_reel";
              const isFollow = n.type === "follow";
              const isUnfollow = n.type === "unfollow";
              const isGift = n.type === "gift_theme";

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (actor?.id && onOpenProfile) {
                      triggerHaptic("light");
                      onClose();
                      onOpenProfile(actor.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                    n.is_read
                      ? "bg-slate-950/60 border-slate-800/60 hover:border-slate-700"
                      : "bg-gradient-to-r from-rose-950/30 to-slate-950 border-rose-500/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    {/* Avatar with type badge */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={actor?.avatar_url || DEFAULT_AVATAR}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md border border-slate-900 bg-slate-900">
                        {isLike && <span>❤️</span>}
                        {isFollow && <span>👤</span>}
                        {isUnfollow && <span>👋</span>}
                        {isGift && <span>👑</span>}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-white truncate">
                          {actor?.first_name || actor?.username || "Пользователь"}
                        </span>
                        {actor?.badge_type === "gold_founder" ? (
                          <span className="text-amber-400 text-[10px]" title="Основатель">👑</span>
                        ) : actor?.is_verified ? (
                          <span className="text-sky-400 text-[10px]">✓</span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        {n.message || (
                          isLike
                            ? "оценил(а) ваш контент"
                            : isFollow
                            ? "подписался(лась) на вас"
                            : isUnfollow
                            ? "отписался(лась) от вас"
                            : "новое уведомление"
                        )}
                      </p>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Indicator / Right Action */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                    {isFollow && (
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-lg">
                        Профиль ↵
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
