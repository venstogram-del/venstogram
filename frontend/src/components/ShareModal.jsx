import React, { useState, useEffect } from "react";
import { triggerHaptic, tg } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function ShareModal({ item, type = "reel", onClose, t }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogs, setDialogs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [successSent, setSuccessSent] = useState(false);

  useEffect(() => {
    loadRecentDialogs();
  }, []);

  const loadRecentDialogs = async () => {
    try {
      const res = await Api.get("/chat/dialogs");
      if (Array.isArray(res)) {
        // Res may contain partner objects
        const users = res.map((d) => d.partner || d.user || d).filter(Boolean);
        setDialogs(users);
      }
    } catch (e) {
      console.warn("Could not load dialogs", e);
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await Api.get(`/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(res || []);
      } catch (e) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleSelectUser = (id) => {
    triggerHaptic("selection");
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSendToSelected = async () => {
    if (selectedUserIds.length === 0) return;
    setSending(true);
    triggerHaptic("medium");

    const mediaUrl = item?.video_url || (item?.media_urls && item.media_urls[0]) || "";
    const title = item?.caption || (type === "reel" ? "Reel в Venstogram" : "Публикация в Venstogram");
    const shareText = `🎬 Смотри ${type === "reel" ? "Reel" : "пост"}: "${title}"`;

    let sentCount = 0;
    try {
      for (const recipientId of selectedUserIds) {
        try {
          await Api.post("/chat/send", {
            recipient_id: recipientId,
            content: shareText,
            media_url: mediaUrl,
            media_type: type === "reel" ? "video" : "post",
            shared_entity_id: item?.id
          });
          sentCount++;
        } catch (e) {
          console.warn(`Failed to send to user ${recipientId}`, e);
        }
      }

      SoundEngine.playFanfare();
      triggerHaptic("success");
      setSuccessSent(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      alert("Ошибка отправки: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleTelegramShare = () => {
    triggerHaptic("light");
    const mediaTitle = item?.caption || "Смотри видео в Venstogram";
    const shareUrl = `https://t.me/venstogrambot?startapp=${type}_${item?.id || 1}`;
    const fullText = `🔥 ${mediaTitle}\n\nСмотри эксклюзивно в Venstogram:`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(fullText)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(tgUrl);
    } else {
      window.open(tgUrl, "_blank");
    }
    onClose();
  };

  const displayedUsers = searchQuery.trim() ? searchResults : dialogs;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✈️</span>
            <div>
              <h3 className="text-sm font-black text-white">
                {type === "reel" ? "Поделиться видео" : "Поделиться публикацией"}
              </h3>
              <p className="text-[10px] text-slate-400">
                Выберите одного или нескольких друзей
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="mt-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Поиск друзей по никнейму или имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Native Telegram share button */}
        <div className="mt-2.5">
          <button
            onClick={handleTelegramShare}
            className="w-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            <span>📱</span>
            <span>Поделиться в Telegram (выбрать чаты)</span>
          </button>
        </div>

        {/* Selected count info banner */}
        {selectedUserIds.length > 0 && (
          <div className="mt-2 bg-pink-500/10 border border-pink-500/30 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-pink-300 font-semibold text-[11px]">
              Выбрано друзей: <b className="text-white">{selectedUserIds.length}</b>
            </span>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              Сбросить
            </button>
          </div>
        )}

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 my-3 pr-1 max-h-56">
          {displayedUsers.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              {searchQuery.trim()
                ? "Пользователи не найдены"
                : "Начните вводить имя в поиске выше, чтобы найти друзей"}
            </div>
          ) : (
            displayedUsers.map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleSelectUser(u.id)}
                  className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition border ${
                    isSelected
                      ? "bg-sky-950/40 border-sky-500/50"
                      : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                      alt={u.username}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-white">
                          {u.first_name || u.username}
                        </span>
                        {u.is_verified && (
                          <span className="text-sky-400 text-[10px]">✓</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">@{u.username}</span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? "bg-sky-500 border-sky-400 text-slate-950 font-black text-xs"
                        : "border-slate-600 bg-slate-900"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Button */}
        <div>
          {successSent ? (
            <div className="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl text-xs text-center shadow-lg">
              ✓ Отправлено друзьям!
            </div>
          ) : (
            <button
              onClick={handleSendToSelected}
              disabled={selectedUserIds.length === 0 || sending}
              className={`w-full py-2.5 rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center space-x-2 ${
                selectedUserIds.length > 0 && !sending
                  ? "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-600/30 active:scale-98"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>{sending ? "Отправка..." : "Отправить"}</span>
              {selectedUserIds.length > 0 && !sending && (
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                  {selectedUserIds.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
