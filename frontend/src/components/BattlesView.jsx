import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function BattlesView({ user, t, onUpdateCoins }) {
  const [battle, setBattle] = useState(null);
  const [giftsCatalog, setGiftsCatalog] = useState([]);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState(null);
  const [liveComments, setLiveComments] = useState([
    { id: 1, user: "Alisher_77", text: "Шохрух вперед! Жми до победы! 🔥" },
    { id: 2, user: "Zarina_tash", text: "Мадина, ты лучшая! Лови сердечки ❤️❤️❤️" },
    { id: 3, user: "Vensto_fan", text: "Какой счет? Кто проигрывает лезгинку танцует? 😂" }
  ]);
  const [commentInput, setCommentInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes remaining

  useEffect(() => {
    loadBattleData();
    loadCatalog();
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadBattleData = async () => {
    try {
      const activeList = await Api.get("/battles/active");
      if (activeList.length > 0) {
        const details = await Api.get(`/battles/${activeList[0].id}`);
        setBattle(details);
        setSelectedRecipientId(details.host.id);
      }
    } catch (e) {}
  };

  const loadCatalog = async () => {
    try {
      const cat = await Api.get("/battles/catalog");
      setGiftsCatalog(cat);
    } catch (e) {}
  };

  const handleSendGift = async (gift) => {
    if (!battle || !selectedRecipientId) return;

    if (user.wallet_coins < gift.coins) {
      triggerHaptic("error");
      alert(`Недостаточно монет для подарка "${gift.name}". Стоимость: ${gift.coins} Vensto Coins.`);
      return;
    }

    triggerHaptic("heavy");

    // Play sound based on gift
    if (gift.code === "rose") SoundEngine.playRose();
    else if (gift.code === "car") SoundEngine.playSupercar();
    else if (gift.code === "lion" || gift.code === "crown") SoundEngine.playFanfare();
    else SoundEngine.playLike();

    // Trigger Screen Gift Animation
    setActiveGiftAnimation({
      gift,
      sender: user.first_name || user.username
    });
    setTimeout(() => setActiveGiftAnimation(null), 3000);

    try {
      const res = await Api.post("/battles/gift", {
        battle_id: battle.id,
        recipient_id: selectedRecipientId,
        gift_code: gift.code
      });

      // Update battle scores
      setBattle((prev) => ({
        ...prev,
        host_score: res.host_score,
        guest_score: res.guest_score
      }));

      // Update user coins
      onUpdateCoins(res.remaining_coins);
      setShowGiftModal(false);

      // Add live comment alert
      setLiveComments((prev) => [
        ...prev,
        {
          id: Date.now(),
          user: user.username || "Вы",
          text: `подарил ${gift.name} ${gift.emoji} (+${gift.coins} очков)!`,
          isGift: true
        }
      ]);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendLiveComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    triggerHaptic("light");
    setLiveComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: user.username || "Я",
        text: commentInput
      }
    ]);
    setCommentInput("");
  };

  if (!battle) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <span className="text-4xl mb-3">⚔️</span>
        <h3 className="text-lg font-bold text-white mb-1">Нет активных PK Баттлов</h3>
        <p className="text-xs text-slate-400">Баттлы запускаются автоматически или по прямому вызову через Telegram-бота.</p>
      </div>
    );
  }

  // Calculate score bar percentages
  const totalScore = (battle.host_score || 0) + (battle.guest_score || 0) || 1;
  const hostPercent = Math.max(15, Math.min(85, Math.round(((battle.host_score || 0) / totalScore) * 100)));
  const guestPercent = 100 - hostPercent;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative h-[calc(100vh-115px)] bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header: Scores & Timer */}
      <div className="absolute top-2 left-2 right-2 z-30 flex flex-col items-center">
        {/* Timer & Penalty banner */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-full px-4 py-1 flex items-center space-x-2 text-xs mb-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-white font-extrabold font-mono">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-400 font-semibold text-[11px] truncate max-w-[180px]">
            {battle.penalty_task}
          </span>
        </div>

        {/* Dynamic Score Bar */}
        <div className="w-full max-w-md bg-slate-900/90 rounded-2xl p-1.5 border border-slate-800/80 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-xs font-black px-2 pb-1">
            <div className="flex items-center space-x-1.5 text-blue-400">
              <span className="truncate max-w-[100px]">@{battle.host.username}</span>
              <span className="bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/40">
                {battle.host_score}
              </span>
            </div>
            <span className="text-slate-500 font-black text-[10px]">VS</span>
            <div className="flex items-center space-x-1.5 text-rose-400">
              <span className="bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
                {battle.guest_score}
              </span>
              <span className="truncate max-w-[100px]">@{battle.guest?.username || "Guest"}</span>
            </div>
          </div>

          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500 relative"
              style={{ width: `${hostPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <div
              className="h-full bg-gradient-to-l from-rose-600 to-pink-500 transition-all duration-500 relative"
              style={{ width: `${guestPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Top 3 MVP Sponsors */}
        {battle.mvp_sponsors && battle.mvp_sponsors.length > 0 && (
          <div className="flex items-center space-x-1 mt-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30">
            <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider mr-1">MVP</span>
            {battle.mvp_sponsors.map((mvp, idx) => (
              <div key={idx} className="flex items-center space-x-1" title={`${mvp.username}: ${mvp.total_coins} coins`}>
                <img src={mvp.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} className="w-5 h-5 rounded-full object-cover border border-amber-400" />
                <span className="text-[10px] text-white font-medium">{mvp.total_coins}🪙</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Split Video Arena (1-on-1 Host vs Guest) */}
      <div className="flex-1 grid grid-cols-2 gap-1 bg-black pt-20 pb-28 relative">
        {/* Host Stream Box */}
        <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center border-r border-slate-800">
          <img
            src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80"
            className="w-full h-full object-cover opacity-90"
            alt="Host"
          />
          <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-bold text-white">@{battle.host.username}</span>
          </div>
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-blue-600/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
              СИНИЕ 💙
            </span>
          </div>
        </div>

        {/* Guest Stream Box */}
        <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80"
            className="w-full h-full object-cover opacity-90"
            alt="Guest"
          />
          <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center space-x-1">
            <span className="text-[11px] font-bold text-white">@{battle.guest?.username || "Guest"}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          </div>
          <div className="absolute bottom-2 right-2 z-10">
            <span className="bg-rose-600/80 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
              КРАСНЫЕ 💖
            </span>
          </div>
        </div>
      </div>

      {/* Floating Animated Gift Overlay */}
      {activeGiftAnimation && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center animate-bounce">
          <div className="bg-gradient-to-r from-amber-500/90 via-pink-500/90 to-rose-600/90 p-6 rounded-3xl shadow-2xl text-center border-2 border-white/50 backdrop-blur-lg">
            <div className="text-8xl mb-2 animate-pulse">{activeGiftAnimation.gift.emoji}</div>
            <div className="text-white font-black text-xl tracking-tight drop-shadow">
              {activeGiftAnimation.sender}
            </div>
            <div className="text-amber-200 font-extrabold text-sm uppercase">
              {activeGiftAnimation.gift.name} (+{activeGiftAnimation.gift.coins} очков)
            </div>
            <div className="text-[10px] text-white/80 mt-1">
              40% стримеру • 60% платформе
            </div>
          </div>
        </div>
      )}

      {/* Live Comments Overlay */}
      <div className="absolute bottom-16 left-3 right-3 z-30 pointer-events-none space-y-1.5 max-h-36 overflow-y-auto no-scrollbar flex flex-col justify-end">
        {liveComments.slice(-5).map((c) => (
          <div
            key={c.id}
            className={`inline-block py-1 px-2.5 rounded-full text-xs backdrop-blur-md max-w-[85%] ${
              c.isGift
                ? "bg-gradient-to-r from-amber-500/80 to-rose-600/80 text-white font-bold border border-amber-300"
                : "bg-black/50 text-slate-200 border border-white/10"
            }`}
          >
            <span className="font-bold text-white mr-1">@{c.user}:</span>
            <span>{c.text}</span>
          </div>
        ))}
      </div>

      {/* Bottom Floating Bar: Comment Input & Send Gift Button */}
      <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center space-x-2">
        <form onSubmit={handleSendLiveComment} className="flex-1 relative">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Поддержать в чате..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-full px-4 py-2 text-xs text-white placeholder-slate-400 outline-none backdrop-blur-md focus:border-pink-500"
          />
        </form>

        <button
          onClick={() => {
            triggerHaptic("medium");
            setShowGiftModal(true);
          }}
          className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-black text-xs px-4 py-2 rounded-full shadow-lg shadow-pink-500/30 flex items-center space-x-1.5 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="text-base">🎁</span>
          <span>{t.sendGift}</span>
        </button>
      </div>

      {/* Gift Shop Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white">Магазин подарков PK Баттла</h3>
                <span className="text-[11px] text-amber-400 font-semibold">
                  Баланс: {user.wallet_coins} Vensto Coins 🪙
                </span>
              </div>
              <button onClick={() => setShowGiftModal(false)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            {/* Select Recipient (Host or Guest) */}
            <div className="py-2.5 flex space-x-2">
              <button
                onClick={() => setSelectedRecipientId(battle.host.id)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  selectedRecipientId === battle.host.id
                    ? "bg-blue-600/30 border-blue-500 text-blue-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                💙 @{battle.host.username}
              </button>
              {battle.guest && (
                <button
                  onClick={() => setSelectedRecipientId(battle.guest.id)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    selectedRecipientId === battle.guest.id
                      ? "bg-rose-600/30 border-rose-500 text-rose-300"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  💖 @{battle.guest.username}
                </button>
              )}
            </div>

            {/* Gifts Grid */}
            <div className="grid grid-cols-4 gap-2.5 py-3">
              {giftsCatalog.map((gift) => (
                <button
                  key={gift.code}
                  onClick={() => handleSendGift(gift)}
                  className="bg-slate-950/80 hover:bg-slate-800 p-2.5 rounded-2xl border border-slate-800 hover:border-pink-500 flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-3xl mb-1 group-hover:scale-125 transition-transform">{gift.emoji}</span>
                  <span className="text-[10px] font-bold text-white truncate max-w-full">{gift.name}</span>
                  <span className="text-[10px] text-amber-400 font-extrabold">{gift.coins} 🪙</span>
                </button>
              ))}
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-1">
              40% от стоимости подарка начисляется стримеру, 60% — платформе Venstogram.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
