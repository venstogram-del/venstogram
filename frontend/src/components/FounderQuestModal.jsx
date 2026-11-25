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
          targets: { referrals: 1000, followers: 30000, posts: 40, views: 100000 },
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
        targets: { referrals: 1000, followers: 30000, posts: 40, views: 100000 },
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

  const targets = quest?.targets || { referrals: 1000, followers: 30000, posts: 40, views: 100000 };
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
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white border-t sm:border border-amber-300 rounded-t-3xl sm:rounded-3xl max-w-lg w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-900">
        
        {/* Header with Gold Glow */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md ring-2 ring-amber-300">
              👑
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Лига Блогеров
                </h3>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded-full border border-amber-300">
                  Состязание
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium">
                Квест от Основателя & Дирекции платформы
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 bg-white">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 font-medium shadow-sm">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-800 font-medium shadow-sm">
              🎉 {successMsg}
            </div>
          )}

          {/* Intro Card */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200 rounded-2xl p-3.5 space-y-2 shadow-sm">
            <div className="text-xs font-black text-amber-950 flex items-center space-x-1.5">
              <span>⚡</span>
              <span>Испытание для верных блогеров и создателей контента</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
              Выполните 4 ключевых задания экосистемы: соберите верную аудиторию, привлекайте новых участников и удерживайте высокие охваты. Победители получают вечный статус и эксклюзивные привилегии от Директора.
            </p>
          </div>

          {/* Reward Preview */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white border border-amber-300 rounded-2xl p-3 text-center space-y-1 shadow-sm">
              <span className="text-2xl block">👑</span>
              <div className="text-xs font-black text-amber-900">Золотая Галочка</div>
              <p className="text-[10px] text-slate-600 leading-tight">
                х5 приоритет во всех рекомендациях Reels и Ленты
              </p>
            </div>
            <div className="bg-white border border-amber-300 rounded-2xl p-3 text-center space-y-1 shadow-sm">
              <span className="text-2xl block">💎</span>
              <div className="text-xs font-black text-amber-900">Редкий @никнейм</div>
              <p className="text-[10px] text-slate-600 leading-tight">
                Бесплатный подарок из золотого резерва от Директора
              </p>
            </div>
          </div>

          {/* Conditions & Progress */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase text-slate-600 tracking-wider">
              Прогресс выполнения заданий
            </div>

            {/* 1. Referrals */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-slate-900">
                  <span>👥</span>
                  <span>Пригласить пользователей в бота:</span>
                </span>
                <span className={`font-mono font-bold ${refs >= targets.referrals ? "text-emerald-600 font-black" : "text-amber-700"}`}>
                  {refs} / {targets.referrals} {refs >= targets.referrals && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${refPct}%` }}
                />
              </div>
            </div>

            {/* 2. Followers */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-slate-900">
                  <span>🌟</span>
                  <span>Подписчики профиля:</span>
                </span>
                <span className={`font-mono font-bold ${followers >= targets.followers ? "text-emerald-600 font-black" : "text-amber-700"}`}>
                  {followers} / {targets.followers} {followers >= targets.followers && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${folPct}%` }}
                />
              </div>
            </div>

            {/* 3. Posts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-slate-900">
                  <span>📸</span>
                  <span>Опубликовано постов / Reels:</span>
                </span>
                <span className={`font-mono font-bold ${posts >= targets.posts ? "text-emerald-600 font-black" : "text-amber-700"}`}>
                  {posts} / {targets.posts} {posts >= targets.posts && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${postPct}%` }}
                />
              </div>
            </div>

            {/* 4. Total Views */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold flex items-center space-x-1.5 text-slate-900">
                  <span>👁️</span>
                  <span>Суммарные просмотры видео:</span>
                </span>
                <span className={`font-mono font-bold ${views >= targets.views ? "text-emerald-600 font-black" : "text-amber-700"}`}>
                  {views.toLocaleString()} / {targets.views.toLocaleString()} {views >= targets.views && "✓"}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                  style={{ width: `${viewPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <span>🔗</span>
                <span>Ваша реферальная ссылка:</span>
              </span>
              <span className="text-[10px] text-amber-800 font-semibold">Каждый переход = +1 в прогресс</span>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl p-2.5 text-xs font-mono text-amber-900 select-all break-all shadow-inner font-bold">
              {quest?.referral_link || `https://t.me/venstogrambot?start=ref_${user?.id || ""}`}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="w-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-bold py-2 rounded-xl text-slate-800 border border-slate-200 transition flex items-center justify-center space-x-1"
              >
                <span>{copied ? "✅ Скопировано" : "📋 Скопировать"}</span>
              </button>
              <button
                onClick={handleShareTelegram}
                className="w-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-xs font-bold py-2 rounded-xl text-white transition flex items-center justify-center space-x-1 shadow-sm"
              >
                <span>✈️ Поделиться</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions - ALWAYS VISIBLE with safe area padding */}
        <div className="p-4 pb-8 sm:pb-5 bg-white border-t border-slate-200 space-y-2 sticky bottom-0 z-20 shadow-lg">
          {hasClaimed ? (
            <div className="w-full py-3.5 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-2xl text-center text-xs font-black text-amber-950 flex items-center justify-center space-x-2 shadow-sm">
              <span>👑</span>
              <span>Вы уже являетесь почетным членом Лиги Основателя!</span>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={!isEligible || claiming}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center space-x-2 ${
                isEligible
                  ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 active:scale-98 animate-pulse border border-amber-400"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
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
