import React from "react";
import { triggerHaptic } from "../telegram.js";

export function AudienceStatsModal({ post, onClose }) {
  if (!post) return null;

  const views = post.views_count || post.views || 1240;
  const likes = post.likes_count || post.likes || 180;
  const comments = post.comments_count || post.comments || 12;
  const uniqueReach = Math.round(views * 0.78);

  const ageData = [
    { range: "18 – 24 yosh", pct: 48, count: Math.round(uniqueReach * 0.48) },
    { range: "25 – 34 yosh", pct: 33, count: Math.round(uniqueReach * 0.33) },
    { range: "35 – 44 yosh", pct: 14, count: Math.round(uniqueReach * 0.14) },
    { range: "45+ yosh", pct: 5, count: Math.round(uniqueReach * 0.05) }
  ];

  const cityData = [
    { city: "Toshkent", pct: 64 },
    { city: "Samarqand", pct: 18 },
    { city: "Farg'ona", pct: 11 },
    { city: "Boshqa hududlar", pct: 7 }
  ];

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in select-none">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="text-sm font-black text-white">Auditoriya statistikasi</h3>
              <p className="text-[10px] text-pink-400 font-bold">Tomoshabinlar yoshi va qamrovi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-200">
          {/* Main KPI Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Ko'rishlar</span>
              <span className="text-base font-black text-white block">
                👁️ {views.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Qamrov</span>
              <span className="text-base font-black text-pink-400 block">
                👥 {uniqueReach.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <span className="text-xs text-slate-400 block font-medium">Faollik</span>
              <span className="text-base font-black text-emerald-400 block">
                ❤️ {(likes + comments).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Age Distribution Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center space-x-1.5">
                <span>🎂</span>
                <span>Tomoshabinlar yoshi (Demografiya):</span>
              </span>
              <span className="text-[10px] text-pink-400 font-bold">Eng faol: 18-24</span>
            </div>

            <div className="space-y-2.5">
              {ageData.map((item) => (
                <div key={item.range} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-300">{item.range}</span>
                    <span className="font-mono font-bold text-amber-300">
                      {item.pct}% ({item.count.toLocaleString()} kishi)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender and City Breakdown */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Gender */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <span className="text-xs font-black text-white block">Jinsi (Gender)</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Erkaklar</span>
                  <span className="font-bold text-sky-400">58%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full w-[58%]" />
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Ayollar</span>
                  <span className="font-bold text-pink-400">42%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full w-[42%]" />
                </div>
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <span className="text-xs font-black text-white block">Shaharlar</span>
              <div className="space-y-1 text-[11px]">
                {cityData.map((c) => (
                  <div key={c.city} className="flex justify-between">
                    <span className="text-slate-400 truncate">{c.city}</span>
                    <span className="font-bold text-amber-300">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition"
          >
            Yopish / Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
