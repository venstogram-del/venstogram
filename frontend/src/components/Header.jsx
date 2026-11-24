import React, { useState } from "react";
import { triggerHaptic } from "../telegram.js";

export function Header({
  user,
  t,
  lang,
  onLanguageChange,
  onOpenCreate,
  onOpenChat
}) {
  const [supportOpen, setSupportOpen] = useState(false);

  const openTelegramChannel = (channel) => {
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

  const getLangLabel = (code) => {
    if (code === "uz_latn") return "UZ";
    if (code === "en") return "EN";
    return "RU";
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between">
      {/* Brand logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <span className="text-white font-extrabold text-lg tracking-tighter">V</span>
        </div>
        <div>
          <h1 className="text-lg font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none">
            Venstogram
          </h1>
          <span className="text-[10px] text-pink-400 font-semibold tracking-wider uppercase">Live & Social</span>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-2">
        {/* Fast Language Toggle */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            const next = lang === "uz_latn" ? "ru" : (lang === "ru" ? "en" : "uz_latn");
            if (onLanguageChange) onLanguageChange(next);
          }}
          className="px-2 py-1 text-[11px] font-black bg-slate-900 hover:bg-slate-800 text-pink-400 rounded-xl border border-slate-800 transition-colors flex items-center space-x-1"
          title="Tilni almashtirish / Сменить язык"
        >
          <span>🌐</span>
          <span>{getLangLabel(lang)}</span>
        </button>

        {/* Create Post Icon */}
        <button
          onClick={() => {
            triggerHaptic("medium");
            onOpenCreate();
          }}
          className="p-1.5 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
          title="Создать публикацию"
        >
          <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Direct Messages Icon */}
        <button
          onClick={() => {
            triggerHaptic("light");
            onOpenChat();
          }}
          className="p-1.5 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors relative"
          title="Сообщения"
        >
          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
        </button>

        {/* Three Dots Menu for Support and Settings */}
        <button
          onClick={() => {
            triggerHaptic("light");
            setSupportOpen(true);
          }}
          className="p-1.5 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors flex items-center justify-center"
          title="Настройки и поддержка"
        >
          <span className="text-sm font-black tracking-widest leading-none px-0.5 text-slate-300 hover:text-white">⋯</span>
        </button>
      </div>

      {/* Support & Settings Three Dots Modal */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 pt-16 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {lang === "uz_latn" ? "Sozlamalar va Yordam" : (lang === "en" ? "Settings & Support" : "Настройки и поддержка")}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {lang === "uz_latn" ? "Tilni tanlash va 24/7 yordam" : (lang === "en" ? "Language selection & 24/7 support" : "Выбор языка и помощь 24/7")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSupportOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Language Selector */}
            <div className="space-y-2 border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {lang === "uz_latn" ? "Tilni tanlash / Язык" : "Выбор языка / Language"}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { code: "uz_latn", label: "🇺🇿 O'zbek" },
                  { code: "ru", label: "🇷🇺 Русский" },
                  { code: "en", label: "🇬🇧 English" }
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      triggerHaptic("selection");
                      if (onLanguageChange) onLanguageChange(item.code);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      lang === item.code
                        ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">📞 Телефон поддержки:</span>
                <a
                  href="tel:+998507775152"
                  className="text-emerald-400 font-mono font-bold hover:underline"
                >
                  +998 50 777 51 52
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">💬 Telegram поддержки:</span>
                <button
                  type="button"
                  onClick={() => openTelegramChannel("@yuksak_it")}
                  className="text-sky-400 font-mono font-bold hover:underline flex items-center space-x-1"
                >
                  <span>@yuksak_it</span>
                  <span className="text-[10px]">↗</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">📧 Официальная почта:</span>
                <span className="text-slate-300 font-mono text-[11px]">venstogram@gmail.com</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <a
                href="tel:+998507775152"
                className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 py-2.5 rounded-xl text-center text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>📞</span>
                <span>Позвонить</span>
              </a>
              <button
                type="button"
                onClick={() => openTelegramChannel("@yuksak_it")}
                className="flex-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 py-2.5 rounded-xl text-center text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>💬</span>
                <span>Написать</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
