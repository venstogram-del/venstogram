import React from "react";
import { triggerHaptic } from "../telegram.js";

export function Header({
  user,
  t,
  onOpenCreate,
  onOpenChat
}) {
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

      {/* Right Action Bar: Clean and Minimalist */}
      <div className="flex items-center space-x-3">
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
      </div>
    </header>
  );
}
