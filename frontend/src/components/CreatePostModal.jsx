import React, { useState, useRef, useEffect } from "react";
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
  const [locating, setLocating] = useState(false);

  // Video Editing & Repair Studio states
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoRotation, setVideoRotation] = useState(0);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(100);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showVideoEditor, setShowVideoEditor] = useState(false);

  const videoPlayerRef = useRef(null);

  const filters = [
    { id: "none", name: "Normal", class: "", style: {} },
    { id: "vivid", name: "Vivid 🔥", class: "contrast-125 saturate-150", style: { filter: "contrast(1.25) saturate(1.5)" } },
    { id: "sunset", name: "Sunset 🌅", class: "sepia-[0.3] hue-rotate-[-10deg] saturate-125", style: { filter: "sepia(0.3) saturate(1.3) hue-rotate(-10deg)" } },
    { id: "emerald", name: "Emerald 🌿", class: "hue-rotate-[45deg] contrast-110", style: { filter: "hue-rotate(45deg) contrast(1.15)" } },
    { id: "bw", name: "B&W 🎬", class: "grayscale contrast-125", style: { filter: "grayscale(1) contrast(1.25)" } }
  ];

  const popularCities = [
    "📍 Toshkent, O'zbekiston",
    "📍 Samarqand, O'zbekiston",
    "📍 Buxoro, O'zbekiston",
    "📍 Farg'ona, O'zbekiston",
    "📍 Namangan, O'zbekiston",
    "📍 Andijon, O'zbekiston",
    "📍 Dubai, UAE",
    "📍 Moskva, Rossiya"
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      triggerHaptic("light");
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (file.type.startsWith("video")) {
        setShowVideoEditor(true);
      } else {
        setShowVideoEditor(false);
      }
    }
  };

  const handleRotateVideo = () => {
    triggerHaptic("light");
    setVideoRotation((prev) => (prev + 90) % 360);
  };

  const handleSpeedChange = (speed) => {
    triggerHaptic("selection");
    setVideoSpeed(speed);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = speed;
    }
  };

  const handleDetectLocation = () => {
    triggerHaptic("medium");
    setLocating(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          let detected = "Toshkent, O'zbekiston";
          if (lat >= 39.5 && lat <= 40.2 && lon >= 66.5 && lon <= 67.5) {
            detected = "Samarqand, O'zbekiston";
          } else if (lat >= 39.6 && lat <= 40.1 && lon >= 64.0 && lon <= 65.0) {
            detected = "Buxoro, O'zbekiston";
          } else if (lat >= 40.0 && lat <= 41.0 && lon >= 71.0 && lon <= 72.5) {
            detected = "Farg'ona, O'zbekiston";
          }
          setLocation(detected);
          triggerHaptic("success");
        },
        () => {
          setLocating(false);
          setLocation("Toshkent, O'zbekiston");
          triggerHaptic("light");
        },
        { timeout: 4000 }
      );
    } else {
      setLocating(false);
      setLocation("Toshkent, O'zbekiston");
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

      // 3. Create single publication: if video -> Reel; if photo -> Post (strictly no duplicate creation!)
      const isVideo = selectedFile.type.startsWith("video");
      let createdPost = null;
      let createdReel = null;

      if (isVideo) {
        const reelRes = await Api.post("/reels", {
          video_url: uploadRes.url,
          caption: caption,
          audio_title: "Original Sound",
          thumbnail_url: ""
        });
        if (reelRes && reelRes.reel) {
          createdReel = reelRes.reel;
        } else {
          createdReel = {
            id: reelRes?.reel_id || Date.now(),
            video_url: uploadRes.url,
            caption: caption,
            likes_count: 0,
            comments_count: 0
          };
        }
      } else {
        const postRes = await Api.post("/posts", {
          caption,
          media_urls: [uploadRes.url],
          media_type: "image",
          location: location.trim(),
          hashtags
        });
        if (postRes && postRes.post) {
          createdPost = postRes.post;
        }
      }

      SoundEngine.playFanfare();
      triggerHaptic("success");
      alert("✓ Muvaffaqiyatli chop etildi! / Публикация успешно размещена!");
      if (onPostCreated) {
        onPostCreated(createdPost, createdReel);
      }
      onClose();
    } catch (err) {
      triggerHaptic("error");
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  const activeFilterObj = filters.find((f) => f.id === activeFilter) || filters[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end select-none">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✨</span>
            <h3 className="text-sm font-extrabold text-white">{t.newPost || "Yangi post"}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs">
            ✕
          </button>
        </div>

        <form onSubmit={handlePublish} className="py-3 flex-1 overflow-y-auto space-y-3.5">
          {/* File Picker / Preview */}
          {!previewUrl ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl h-44 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50">
              <span className="text-4xl mb-2">📸</span>
              <span className="text-xs font-bold text-slate-300">{t.selectMedia || "Foto yoki video tanlang"}</span>
              <span className="text-[10px] text-pink-400 font-semibold mt-1">Galereyadan video yoki surat</span>
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {selectedFile?.type.startsWith("video") ? (
                  <video
                    ref={videoPlayerRef}
                    src={previewUrl}
                    controls
                    autoPlay
                    muted={videoMuted}
                    playsInline
                    onLoadedMetadata={(e) => setVideoDuration(e.target.duration || 0)}
                    className="w-full h-full object-contain transition-all"
                    style={{
                      ...activeFilterObj.style,
                      transform: `rotate(${videoRotation}deg)`
                    }}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={`w-full h-full object-cover transition-all ${activeFilterObj.class}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                    setShowVideoEditor(false);
                  }}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 text-xs hover:bg-black"
                >
                  ✕
                </button>
              </div>

              {/* Video Repair & Editing Studio Panel */}
              {selectedFile?.type.startsWith("video") && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-pink-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                      <span>🛠️</span>
                      <span>Videoni tahrirlash va sozlash (Video Studio)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRotateVideo}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg font-bold border border-slate-700 flex items-center space-x-1"
                    >
                      <span>🔄</span>
                      <span>{videoRotation}°</span>
                    </button>
                  </div>

                  {/* Playback Speed Controls */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Video tezligi (Speed):
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.5, 1.0, 1.5, 2.0].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSpeedChange(s)}
                          className={`py-1 rounded-xl text-xs font-bold transition ${
                            videoSpeed === s
                              ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Mute toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-xs text-slate-300 font-semibold">Ovozni yoqish / o'chirish:</span>
                    <button
                      type="button"
                      onClick={() => setVideoMuted(!videoMuted)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                        videoMuted ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      <span>{videoMuted ? "🔇 Ovoz o'chiq" : "🔊 Ovoz yoqilgan"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Filter selector */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Rang va filtrlar (Filters):
                </span>
                <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setActiveFilter(f.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                        activeFilter === f.id
                          ? "bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Tavsif va xeshteglar (Caption):
            </label>
            <textarea
              rows="3"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Post tavsifini yozing... #tashkent #uzbekistan"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500 transition"
            />
          </div>

          {/* Geolocation Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                <span>📍</span>
                <span>Geolokatsiya va shahar (Location):</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-400 px-2 py-0.5 rounded-lg font-bold border border-slate-700 transition flex items-center space-x-1"
              >
                <span>{locating ? "Aniqlanmoqda..." : "🎯 Shahrimni aniqlash"}</span>
              </button>
            </div>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Masalan: Toshkent, O'zbekiston yoki Tashkent City"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500 transition"
            />

            {/* Quick City Selector Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {popularCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setLocation(city.replace("📍 ", ""));
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-medium transition ${
                    location === city.replace("📍 ", "")
                      ? "bg-sky-500 text-slate-950 font-bold"
                      : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Publish Button */}
          <button
            type="submit"
            disabled={(!selectedFile && !previewUrl) || uploading}
            className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center space-x-2 active:scale-98"
          >
            {uploading ? (
              <span>Yuklanmoqda va qayta ishlanmoqda...</span>
            ) : (
              <span>🚀 {t.post || "Chiqarish / Опубликовать"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
