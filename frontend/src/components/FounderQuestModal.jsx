import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function FounderQuestModal({ user, onClose, onUserUpdated }) {
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadQuestData();
  }, []);

  const loadQuestData = async () => {
    try {
      setLoading(true);
      const data = await Api.get("/users/founder-quest");
      if (data && (data.status === "ok" || data.referral_link)) {
        setQuest(data);
      } else {
        setQuest({
          referrals_count: 0,
          followers_count: 0,
          posts_count: 0,
          views_count: 0,
          targets: { referrals: 50, followers: 500, posts: 10, views: 5000 },
          referral_link: `https://t.me/venstogrambot?start=ref_${user?.id || 1477103854}`,
          is_eligible: user?.role === "director",
          has_claimed: user?.badge_type === "gold_founder"
        });
      }
    } catch (err) {
      console.warn("Fallback quest data:", err);
      setQuest({
        referrals_count: 0,
        followers_count: 0,
        posts_count: 0,
        views_count: 0,
        targets: { referrals: 50, followers: 500, posts: 10, views: 5000 },
        referral_link: `https://t.me/venstogrambot?start=ref_${user?.id || 1477103854}`,
        is_eligible: user?.role === "director",
        has_claimed: user?.badge_type === "gold_founder"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!quest?.referral_link) return;
    navigator.clipboard.writeText(quest.referral_link);
    setCopied(true);
    triggerHaptic("medium");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTelegram = () => {
    if (!quest?.referral_link) return;
    triggerHaptic("heavy");
    const text = encodeURIComponent(
      "🚀 Присоединяйся ко мне в Venstogram — новой соцсети с крутыми Reels, маркетплейсом никнеймов и живыми баттлами! Переходи по моей ссылке:"
    );
    const url = encodeURIComponent(quest.referral_link);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const handleClaim = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setClaiming(true);
    triggerHaptic("heavy");

    try {
      const res = await Api.post("/users/founder-quest/claim", {});
      SoundEngine.playFanfare();
      setSuccessMsg(res.message || "Поздравляем! Вам вручена Золотая Галочка!");
      if (onUserUpdated) {
        onUserUpdated(res.user);
      }
      loadQuestData();
    } catch (err) {
      setErrorMsg(err.message || "Не удалось получить награду. Проверьте условия.");
    } finally {
      setClaiming(false);
    }
  };

  const targets = quest?.targets || { referrals: 50, followers: 500, posts: 10, views: 5000 };
  const refs = quest?.referrals_count || 0;
  const followers = quest?.followers_count || 0;
  const posts = quest?.posts_count || 0;
  const views = quest?.views_count || 0;

  const refPct = Math.min(100, Math.round((refs / targets.referrals) * 100));
  const folPct = Math.min(100, Math.round((followers / targets.followers) * 100));
  const postPct = Math.min(100, Math.round((posts / targets.posts) * 100));
  const viewPct = Math.min(100, Math.round((views / targets.views) * 100));

  const isEligible = quest?.is_eligible || quest?.is_eligible_for_claim || user?.role === "director";
  const hasClaimed = quest?.has_claimed || quest?.is_golden_winner || user?.badge_type === "gold_founder";

  return (
    <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl max-w-lg w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-amber-500/10">
        
        {/* Header with Gold Glow */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">
              👑
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Лига Блогеров
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  Состязание
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Квест от Основателя & Дирекции платформы
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-200">
          {errorMsg && (
            <div className="bg-rose-950/70 border border-rose-500/50 p-3 rounded-2xl text-xs text-rose-300">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/70 border border-emerald-500/50 p-3 rounded-2xl text-xs text-emerald-300 font-medium">
              🎉 {successMsg}
            </div>
          )}

          {/* Intro Card */}
          <div className="bg-gradient-to-br from-slate-950 to-amber-950/30 border border-amber-500/20 rounded-2xl p-3.5 space-y-2">
            <div className="text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
              <span>⚡</span>
              <span>Испытание для верных блогеров и создателей контента</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Выполните 4 ключевых задания экосистемы: соберите верную аудиторию, привлекайте новых участников и удерживайте высокие охваты. Победители получают вечный статус и эксклюзивные привилегии от Директора.
            </p>
          </div>

          {/* Reward Preview */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 text-center space-y-1">
              <span className="text-2xl block">👑</span>
              <div className="text-xs font-black text-amber-300">Золотая Галочка</div>
              <p className="text-[10px] text-slate-400 leading-tight">
                х5 приоритет во всех рекомендациях Reels и Ленты
              </p>
            </div>
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 text-center space-y-1">
              <span className="text-2xl block">💎</span>
              <div className="text-xs font-black text-amber-300">Редкий @никнейм</div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Бесплатный подарок из золотого резерва от Директора
              </p>
            </div>
          </div>

          {/* Conditions & Progress */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Прогресс выполнения заданий
            </div>

            {/* 1. Referrals */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-white">
                  <span>👥</span>
                  <span>Пригласить пользователей в бота:</span>
                </span>
                <span className={`font-mono font-bold ${refs >= targets.referrals ? "text-emerald-400" : "text-amber-400"}`}>
                  {refs} / {targets.referrals} {refs >= targets.referrals && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${refPct}%` }}
                />
              </div>
            </div>

            {/* 2. Followers */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-white">
                  <span>🌟</span>
                  <span>Подписчики профиля:</span>
                </span>
                <span className={`font-mono font-bold ${followers >= targets.followers ? "text-emerald-400" : "text-amber-400"}`}>
                  {followers} / {targets.followers} {followers >= targets.followers && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${folPct}%` }}
                />
              </div>
            </div>

            {/* 3. Posts */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-white">
                  <span>📸</span>
                  <span>Опубликовано постов / Reels:</span>
                </span>
                <span className={`font-mono font-bold ${posts >= targets.posts ? "text-emerald-400" : "text-amber-400"}`}>
                  {posts} / {targets.posts} {posts >= targets.posts && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${postPct}%` }}
                />
              </div>
            </div>

            {/* 4. Total Views */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-white">
                  <span>👁️</span>
                  <span>Суммарные просмотры видео:</span>
                </span>
                <span className={`font-mono font-bold ${views >= targets.views ? "text-emerald-400" : "text-amber-400"}`}>
                  {views.toLocaleString()} / {targets.views.toLocaleString()} {views >= targets.views && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${viewPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>🔗</span>
                <span>Ваша реферальная ссылка:</span>
              </span>
              <span className="text-[10px] text-amber-400 font-medium">Каждый переход = +1 в прогресс</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono text-amber-200 select-all break-all">
              {quest?.referral_link || `https://t.me/venstogrambot?start=ref_${user?.id || ""}`}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="w-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold py-2 rounded-xl text-white transition flex items-center justify-center space-x-1"
              >
                <span>{copied ? "✅ Скопировано" : "📋 Скопировать"}</span>
              </button>
              <button
                onClick={handleShareTelegram}
                className="w-full bg-sky-600 hover:bg-sky-500 active:scale-95 text-xs font-bold py-2 rounded-xl text-white transition flex items-center justify-center space-x-1"
              >
                <span>✈️ Поделиться</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          {hasClaimed ? (
            <div className="w-full py-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-2xl text-center text-xs font-black text-amber-300 flex items-center justify-center space-x-2">
              <span>👑</span>
              <span>Вы уже являетесь почетным членом Лиги Основателя!</span>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={!isEligible || claiming}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wide transition-all shadow-lg flex items-center justify-center space-x-2 ${
                isEligible
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/30 active:scale-98 animate-pulse"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              }`}
            >
              <span>{claiming ? "Проверка..." : isEligible ? "👑 ЗАБРАТЬ ЗОЛОТУЮ ГАЛОЧКУ И ПРИЗ!" : "🔒 Выполните все 4 условия для награды"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
