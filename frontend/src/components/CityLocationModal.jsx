import React from "react";
import { triggerHaptic } from "../telegram.js";

export function CityLocationModal({ locationName, onClose }) {
  if (!locationName) return null;

  const cleanLocation = locationName.replace(/^📍\s*/, "").trim();

  const handleOpenMap = () => {
    triggerHaptic("medium");
    const query = encodeURIComponent(cleanLocation);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl shadow-sky-500/20">
        
        {/* Animated Map Pin */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-sky-500/30 animate-bounce">
          📍
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
            Geolokatsiya va Hudud
          </span>
          <h3 className="text-xl font-black text-white mt-1">
            {cleanLocation}
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Ushbu post joylashtirilgan shahar va hudud koordinatalari. Siz joylashuvni xaritada ko'rishingiz mumkin.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleOpenMap}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/30 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <span>🗺️ Xaritada ko'rish (Google Maps)</span>
            <span className="text-[10px]">↗</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-medium"
          >
            Yopish / Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
