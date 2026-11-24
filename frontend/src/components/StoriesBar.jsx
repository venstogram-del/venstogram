import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function StoriesBar({ storiesGroups = [], currentUserId, onStoryCreated, t }) {
  const [activeViewerGroup, setActiveViewerGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressTimerRef = useRef(null);

  // Story playback timer
  useEffect(() => {
    if (!activeViewerGroup) {
      setProgress(0);
      return;
    }

    if (isPaused) return;

    const interval = 50; // update every 50ms
    const step = 100 / (5000 / interval); // 5 seconds per story

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(progressTimerRef.current);
  }, [activeViewerGroup, currentStoryIndex, isPaused]);

  const handleNextStory = () => {
    if (!activeViewerGroup) return;
    if (currentStoryIndex < activeViewerGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const openStoryViewer = (group) => {
    triggerHaptic("light");
    setActiveViewerGroup(group);
    setCurrentStoryIndex(0);
    setProgress(0);

    // Mark current story as viewed
    if (group.stories[0]) {
      Api.post(`/stories/${group.stories[0].id}/view`, {}).catch(() => {});
    }
  };

  const closeStoryViewer = () => {
    setActiveViewerGroup(null);
    setCurrentStoryIndex(0);
    setProgress(0);
  };

  const handleReaction = async (emoji) => {
    triggerHaptic("medium");
    SoundEngine.playLike();
    const currentStory = activeViewerGroup?.stories[currentStoryIndex];
    if (currentStory) {
      await Api.post(`/stories/${currentStory.id}/react`, { reaction: emoji }).catch(() => {});
    }
  };

  return (
    <>
      {/* Horizontal Stories Carousel */}
      <div className="bg-slate-950/60 border-b border-slate-900 py-3 px-4 flex items-center space-x-3 overflow-x-auto no-scrollbar">
        {/* Add Story Button */}
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer">
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-[2px] bg-slate-800 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-slate-300">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-pink-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 max-w-[64px] truncate">Ваша история</span>
        </div>

        {/* Stories list */}
        {storiesGroups.map((group, idx) => {
          const hasUnseen = group.has_unseen;
          return (
            <div
              key={idx}
              onClick={() => openStoryViewer(group)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                  hasUnseen
                    ? "bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 animate-pulse"
                    : "bg-slate-700"
                }`}
              >
                <img
                  src={group.user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={group.user.first_name}
                  className="w-full h-full rounded-full object-cover border-2 border-slate-950"
                />
              </div>
              <span className="text-[11px] text-slate-300 font-medium mt-1 max-w-[64px] truncate">
                {group.user.first_name || group.user.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Stories Player Modal */}
      {activeViewerGroup && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none">
          {/* Top Progress Bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex space-x-1">
            {activeViewerGroup.stories.map((st, i) => (
              <div key={st.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      i < currentStoryIndex
                        ? "100%"
                        : i === currentStoryIndex
                        ? `${progress}%`
                        : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header Info */}
          <div className="absolute top-5 left-4 right-4 z-20 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <img
                src={activeViewerGroup.user.avatar_url}
                className="w-8 h-8 rounded-full border border-white/40 object-cover"
              />
              <span className="text-xs font-bold drop-shadow">
                {activeViewerGroup.user.first_name}
              </span>
              {activeViewerGroup.user.is_verified && <span className="text-blue-400 text-xs">✓</span>}
            </div>
            <button
              onClick={closeStoryViewer}
              className="p-1 rounded-full bg-black/40 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Media Content with Hold to Pause & Tap to Skip */}
          <div
            className="w-full h-full relative flex items-center justify-center bg-black"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <img
              src={activeViewerGroup.stories[currentStoryIndex]?.media_url}
              className="w-full h-full object-contain"
              alt="Story"
            />

            {/* Left Tap to Prev */}
            <div
              className="absolute left-0 top-16 bottom-20 w-1/3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevStory();
              }}
            />

            {/* Right Tap to Next */}
            <div
              className="absolute right-0 top-16 bottom-20 w-2/3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleNextStory();
              }}
            />

            {/* Caption */}
            {activeViewerGroup.stories[currentStoryIndex]?.caption && (
              <div className="absolute bottom-20 left-4 right-4 text-center">
                <span className="inline-block px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-sm font-medium drop-shadow">
                  {activeViewerGroup.stories[currentStoryIndex]?.caption}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Quick Reactions Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-around bg-slate-950/80 backdrop-blur-md py-2 px-4 rounded-full border border-slate-800">
            {["❤️", "🔥", "👏", "😂", "😍", "🎉"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-2xl hover:scale-125 active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
