import React, { useState } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function CreatePostModal({ t, onClose, onPostCreated, dataSaver }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [activeFilter, setActiveFilter] = useState("none");
  const [uploading, setUploading] = useState(false);

  const filters = [
    { id: "none", name: "Normal", class: "" },
    { id: "vivid", name: "Vivid", class: "contrast-125 saturate-150" },
    { id: "sunset", name: "Sunset", class: "sepia-[0.3] hue-rotate-[-10deg] saturate-125" },
    { id: "emerald", name: "Emerald", class: "hue-rotate-[45deg] contrast-110" },
    { id: "bw", name: "B&W", class: "grayscale contrast-125" }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      triggerHaptic("light");
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) return;

    triggerHaptic("medium");
    setUploading(true);

    try {
      // 1. Upload media file
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await Api.post(`/upload?data_saver=${dataSaver}`, formData);

      // 2. Extract hashtags
      const hashtags = (caption.match(/#[a-zа-яё0-9_]+/gi) || []).map((h) => h.slice(1));

      // 3. Create post
      const postRes = await Api.post("/posts", {
        caption,
        media_urls: [uploadRes.url],
        media_type: selectedFile.type.startsWith("video") ? "video" : "image",
        location,
        hashtags
      });

      SoundEngine.playFanfare();
      alert(postRes.message);
      onPostCreated();
      onClose();
    } catch (err) {
      triggerHaptic("error");
      alert(err.message || "Ошибка публикации");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-extrabold text-white">{t.newPost}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handlePublish} className="py-3 flex-1 overflow-y-auto space-y-3.5">
          {/* File Picker / Preview */}
          {!previewUrl ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50">
              <span className="text-4xl mb-2">📸</span>
              <span className="text-xs font-bold text-slate-300">{t.selectMedia}</span>
              <span className="text-[10px] text-slate-500 mt-1">Фото или видео из галереи</span>
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black mb-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={`w-full h-full object-cover transition-all ${
                    filters.find((f) => f.id === activeFilter)?.class || ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 text-xs hover:bg-black/90"
                >
                  ✕
                </button>
              </div>

              {/* Filter selector */}
              <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setActiveFilter(f.id);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                      activeFilter === f.id
                        ? "bg-pink-600 text-white border-pink-500"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <textarea
              rows="3"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.addCaption}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
            />
          </div>

          {/* Location */}
          <div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="📍 Добавить геопозицию (напр. Tashkent City)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={(!selectedFile && !previewUrl) || uploading}
            className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 disabled:opacity-40 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center space-x-1"
          >
            {uploading ? <span>Публикация...</span> : <span>🚀 {t.post}</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
