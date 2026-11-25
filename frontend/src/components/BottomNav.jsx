import React from "react";
import { triggerHaptic } from "../telegram.js";

export function BottomNav({ activeTab, onTabChange, t, userRole }) {
  const isAdmin = ["director", "it_admin", "moderator", "developer"].includes(userRole);

  const tabs = [
    {
      id: "feed",
      label: t?.feed || "Лента",
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: "search",
      label: t?.search || "Поиск",
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? "2.5" : "2"} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: "reels",
      label: t?.reels || "Reels",
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "marketplace",
      label: t?.marketplace || "Маркет",
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: "profile",
      label: t?.profile || "Профиль",
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  if (isAdmin) {
    tabs.push({
      id: "admin",
      label: t?.admin || "Админка",
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? "text-amber-400 scale-110" : "text-slate-400"}`} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 flex items-center justify-around pb-safe">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic("light");
              onTabChange(tab.id);
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all"
          >
            {tab.icon(active)}
            <span className={`text-[10px] font-semibold mt-0.5 tracking-tight ${active ? "text-pink-400 font-bold" : "text-slate-400"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
