import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic, authenticateBiometrics } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";
import { PostModal } from "./PostModal.jsx";
import { EmailAuthModal } from "./EmailAuthModal.jsx";
import { FounderQuestModal } from "./FounderQuestModal.jsx";

export function ProfileView({
  user,
  t,
  lang,
  onLanguageChange,
  dataSaver,
  onToggleDataSaver,
  onOpenWallet,
  onUpdateUser
}) {
  const [activeTab, setActiveTab] = useState("posts"); // posts, reels, saved
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [verifiedModalOpen, setVerifiedModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [emailAuthModalOpen, setEmailAuthModalOpen] = useState(false);
  const [founderQuestModalOpen, setFounderQuestModalOpen] = useState(false);

  // Selected Post Viewer
  const [selectedPost, setSelectedPost] = useState(null);

  // Edit profile states
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.first_name || "");
  const [editLastName, setEditLastName] = useState(user?.last_name || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatar_url || "");
  const [editTelegramChannel, setEditTelegramChannel] = useState(user?.telegram_channel || "");
  const [editWebsite, setEditWebsite] = useState(user?.website || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setEditUsername(user.username);
    }
  }, [user?.username]);

  // Live username availability check with suggestions
  useEffect(() => {
    if (!isEditing) return;
    const trimmed = (editUsername || "").trim().replace(/^@/, "").toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus(null);
      return;
    }
    if (user?.username && trimmed === user.username.toLowerCase()) {
      setUsernameStatus({ available: true, is_current: true, message: "Ваш текущий никнейм", suggestions: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await Api.get(`/users/check-username?username=${encodeURIComponent(trimmed)}`);
        setUsernameStatus(res);
      } catch (err) {
        console.warn("check-username error", err);
      } finally {
        setCheckingUsername(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [editUsername, isEditing, user?.username]);

  // PIN code state
  const [newPin, setNewPin] = useState("");
  const [biometricActive, setBiometricActive] = useState(user?.biometric_enabled || false);

  const fileInputRef = useRef(null);

  // Sample dynamic publications for current profile
  const userPosts = [
    {
      id: 101,
      caption: "Новый день — новые победы в VENSTOGRAM! 🚀 #venstogram #tashkent #live",
      media_urls: ["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"],
      likes_count: 342,
      views_count: 1850,
      comments_count: 28,
      is_liked: true,
      author: user
    },
    {
      id: 102,
      caption: "Красивый вечер в Ташкенте 🇺🇿✨ #uzbekistan #tashkentcity #evening",
      media_urls: ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80"],
      likes_count: 512,
      views_count: 2940,
      comments_count: 45,
      is_liked: false,
      author: user
    },
    {
      id: 103,
      caption: "Качественный контент и живые рекомендации! 💎 #blogger #uzb #recommendations",
      media_urls: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"],
      likes_count: 278,
      views_count: 1420,
      comments_count: 19,
      is_liked: true,
      author: user
    },
    {
      id: 104,
      caption: "Готовим грандиозный запуск обновления! #tech #startup #venstogram",
      media_urls: ["https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80"],
      likes_count: 689,
      views_count: 4100,
      comments_count: 52,
      is_liked: false,
      author: user
    },
    {
      id: 105,
      caption: "Атмосфера настоящего творчества 🎨 #creative #lifestyle",
      media_urls: ["https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80"],
      likes_count: 410,
      views_count: 2300,
      comments_count: 33,
      is_liked: false,
      author: user
    },
    {
      id: 106,
      caption: "Всем отличного настроения и продуктивной недели! 🌟 #samarkand #bukhara",
      media_urls: ["https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80"],
      likes_count: 890,
      views_count: 5800,
      comments_count: 67,
      is_liked: true,
      author: user
    }
  ];

  const userReels = [
    {
      id: 201,
      caption: "Топ фишек в новом обновлении VENSTOGRAM 🔥 #reels #trend",
      media_urls: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"],
      likes_count: 1420,
      views_count: 12400,
      comments_count: 112,
      is_liked: true,
      author: user
    },
    {
      id: 202,
      caption: "Как взлететь в рекомендации за 1 день? Смотри до конца! 🚀 #recommendations",
      media_urls: ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600"],
      likes_count: 2890,
      views_count: 24500,
      comments_count: 240,
      is_liked: true,
      author: user
    }
  ];

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    triggerHaptic("medium");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("vensto_token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Ошибка загрузки фото");
      }

      const data = await res.json();
      setEditAvatarUrl(data.url);
      triggerHaptic("success");
    } catch (err) {
      alert("Не удалось загрузить аватарку: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Вы действительно хотите удалить свою аватарку?")) return;
    triggerHaptic("medium");
    try {
      await Api.patch("/auth/me", {
        avatar_url: ""
      });
      setEditAvatarUrl("");
      onUpdateUser({
        ...user,
        avatar_url: ""
      });
      alert("Аватарка успешно удалена! Установлен стандартный значок.");
    } catch (err) {
      alert("Ошибка удаления аватарки: " + err.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    triggerHaptic("medium");

    const cleanUsername = (editUsername || "").trim().replace(/^@/, "").toLowerCase();
    if (cleanUsername && usernameStatus && !usernameStatus.available && !usernameStatus.is_current) {
      alert("Пожалуйста, выберите свободный никнейм перед сохранением!");
      return;
    }

    try {
      const updated = await Api.patch("/auth/me", {
        username: cleanUsername || undefined,
        first_name: editFirstName,
        last_name: editLastName,
        bio: editBio,
        avatar_url: editAvatarUrl,
        telegram_channel: editTelegramChannel,
        website: editWebsite
      });

      onUpdateUser({
        ...user,
        username: updated.username || cleanUsername || user.username,
        first_name: updated.first_name,
        last_name: updated.last_name,
        bio: updated.bio,
        avatar_url: updated.avatar_url,
        telegram_channel: updated.telegram_channel,
        website: updated.website
      });

      triggerHaptic("success");
      setIsEditing(false);
      alert("Профиль успешно обновлен! ✨");
    } catch (err) {
      alert("Ошибка сохранения: " + err.message);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    triggerHaptic("medium");
    try {
      await Api.patch("/auth/me", {
        wallet_pin: newPin || undefined,
        biometric_enabled: biometricActive
      });
      onUpdateUser({
        ...user,
        has_pin: Boolean(newPin),
        biometric_enabled: biometricActive
      });
      triggerHaptic("success");
      alert("Настройки безопасности успешно сохранены! 🔒");
      setSecurityModalOpen(false);
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  const handleBuyVerified = async (months, coins) => {
    if (user.wallet_coins < coins) {
      triggerHaptic("error");
      alert(`Недостаточно монет на балансе (${user.wallet_coins} 🪙). Пополните кошелек через Paynet/карту.`);
      return;
    }

    triggerHaptic("heavy");
    SoundEngine.playFanfare();

    try {
      const res = await Api.post("/marketplace/verified/buy", { months });
      alert(res.message);
      onUpdateUser({
        ...user,
        is_verified: true,
        wallet_coins: user.wallet_coins - coins,
        verified_until: res.verified_until
      });
      setVerifiedModalOpen(false);
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

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

  const displayList = activeTab === "reels" ? userReels : userPosts;

  if (!user) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs">Загрузка профиля...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Profile Bar with Username and Three-Dots Menu */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-base font-black text-white">@{user.username}</span>
          <button
            onClick={() => {
              triggerHaptic("light");
              setEditUsername(user?.username || "");
              setIsEditing(true);
            }}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-pink-400 hover:text-pink-300 font-bold px-2 py-0.5 rounded-lg border border-pink-500/30 transition flex items-center space-x-1"
            title="Сменить никнейм"
          >
            <span>✏️</span>
            <span>Сменить</span>
          </button>
          {user.badge_type === "gold_founder" ? (
            <span className="text-amber-400 font-bold text-sm" title="Золотая Галочка Основателя">👑</span>
          ) : user.is_verified ? (
            <span className="text-sky-400 font-bold text-sm" title="Верифицирован">✓</span>
          ) : null}
          {user.role === "director" && (
            <span className="text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase ml-1">
              👑 Директор
            </span>
          )}
        </div>

        {/* Three Dots Settings Button */}
        <button
          onClick={() => {
            triggerHaptic("light");
            setSettingsOpen(true);
          }}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center justify-center space-x-1"
          title="Настройки (Sozlamalar)"
        >
          <span className="text-base font-black tracking-widest leading-none">⋯</span>
        </button>
      </div>

      {/* Suggestion banner if username is standard user_XXXXXX */}
      {user.username?.startsWith("user_") && (
        <div
          onClick={() => {
            triggerHaptic("medium");
            setEditUsername("");
            setIsEditing(true);
          }}
          className="cursor-pointer bg-gradient-to-r from-pink-600/25 via-purple-600/25 to-pink-600/25 border border-pink-500/50 hover:border-pink-400 rounded-2xl p-3 flex items-center justify-between text-xs text-pink-200 transition shadow-lg shadow-pink-600/10 active:scale-98"
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">✨</span>
            <div>
              <span className="font-black text-white block text-xs">Придумайте свой никнейм!</span>
              <span className="text-[10px] text-pink-300/80">Замените стандартный @{user.username} на красивое имя</span>
            </div>
          </div>
          <span className="bg-gradient-to-r from-pink-600 to-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-md shadow-pink-600/30 whitespace-nowrap">
            Выбрать ↵
          </span>
        </div>
      )}

      {/* Profile Header: Avatar & Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
          <img
            src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
            alt="Profile avatar"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-pink-500 shadow-xl"
          />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-white font-bold">📷 Сменить</span>
          </div>
          {user.badge_type === "gold_founder" ? (
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ring-2 ring-slate-950 shadow-md">
              👑
            </div>
          ) : user.is_verified ? (
            <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-slate-950">
              ✓
            </div>
          ) : null}
        </div>

        {/* Stats */}
        <div className="flex-1 flex justify-around text-center">
          <div>
            <span className="text-base font-black text-white block">{userPosts.length}</span>
            <span className="text-[11px] text-slate-400">Постов</span>
          </div>
          <div>
            <span className="text-base font-black text-white block">1.4K</span>
            <span className="text-[11px] text-slate-400">Подписчиков</span>
          </div>
          <div>
            <span className="text-base font-black text-white block">348</span>
            <span className="text-[11px] text-slate-400">Подписок</span>
          </div>
        </div>
      </div>

      {/* User Info & Bio */}
      <div>
        <div className="flex items-center space-x-1.5">
          <h2 className="text-base font-black text-white">
            {user.first_name} {user.last_name || ""}
          </h2>
        </div>

        <p className="text-xs text-slate-300 mt-1.5 whitespace-pre-line leading-relaxed">
          {user.bio || "Блогер и автор на Venstogram ✨"}
        </p>

        {/* Telegram Channel / Group Link */}
        {user.telegram_channel && (
          <button
            onClick={() => openTelegramChannel(user.telegram_channel)}
            className="mt-2 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-600/30 via-blue-600/20 to-sky-600/30 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-500/40 py-2 px-3 rounded-xl text-xs font-bold text-sky-300 transition-all shadow-sm"
          >
            <span className="text-sm">📢</span>
            <span>Telegram-канал: {user.telegram_channel}</span>
            <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-200">Перейти ↗</span>
          </button>
        )}

        {/* Official Warning / Strike Notification Banner */}
        {user.warnings_count > 0 && (
          <div className="mt-2.5 bg-rose-950/80 border border-rose-500/60 rounded-2xl p-3 space-y-1 shadow-lg shadow-rose-950/40">
            <div className="flex items-center justify-between text-xs font-black text-rose-300">
              <span className="flex items-center space-x-1.5">
                <span className="text-sm">⚠️</span>
                <span>Официальное предупреждение платформы</span>
              </span>
              <span className="bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-mono text-[11px] border border-rose-500/50">
                Страйк: {user.warnings_count}/3
              </span>
            </div>
            <p className="text-[11px] text-rose-200/90 leading-relaxed">
              {user.warnings_count === 1 && "Внимание! Дирекция вынесла вам 1-й страйк за нарушение правил. При получении 2-го страйка ваши посты исключаются из рекомендаций, а 3-й означает пожизненный бан."}
              {user.warnings_count === 2 && "Внимание! У вас 2 страйка из 3. Ваши публикации пессимизированы в рекомендациях (теневой бан). Следующее нарушение приведет к перманентной блокировке."}
              {user.warnings_count >= 3 && "Ваш аккаунт заблокирован за систематические нарушения законодательства (Ст. 130 и 244-1 УК РУз)."}
            </p>
          </div>
        )}

        {/* Founder League Blogger Quest Banner */}
        <button
          onClick={() => {
            triggerHaptic("medium");
            setFounderQuestModalOpen(true);
          }}
          className="mt-2.5 w-full bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 hover:border-amber-400/80 rounded-2xl p-3 flex items-center justify-between text-left transition shadow-lg shadow-amber-500/10 active:scale-98"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center text-lg font-black shadow-md shadow-amber-500/30">
              👑
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center space-x-1.5">
                <span>Лига Блогеров & Квест Основателя</span>
                {user.badge_type === "gold_founder" ? (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/40">Победитель 👑</span>
                ) : (
                  <span className="text-[9px] bg-pink-500/20 text-pink-300 font-bold px-1.5 py-0.5 rounded border border-pink-500/40">Состязание</span>
                )}
              </div>
              <p className="text-[10px] text-amber-200/70">
                Приглашай друзей, набирай охваты и получи Золотую Галочку!
              </p>
            </div>
          </div>
          <span className="text-amber-400 text-base font-bold pr-1">→</span>
        </button>

        {/* External Website */}
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold mt-1.5 flex items-center space-x-1"
          >
            <span>🔗</span>
            <span>{user.website}</span>
          </a>
        )}

        {/* Tech Support Quick Contact Bar */}
        <div className="mt-2.5 bg-slate-900/60 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🛠️</span>
            <div>
              <span className="text-[11px] font-bold text-white block">Служба техподдержки:</span>
              <span className="text-[10px] text-slate-400 font-mono">+998 50 777 51 52 • @yuksak_it</span>
            </div>
          </div>
          <button
            onClick={() => openTelegramChannel("@yuksak_it")}
            className="bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold px-2.5 py-1 rounded-xl text-[10px] border border-slate-700 transition"
          >
            Связаться ↗
          </button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex space-x-2">
        <button
          onClick={() => {
            triggerHaptic("light");
            setIsEditing(true);
          }}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-1"
        >
          <span>✏️</span>
          <span>Редактировать профиль</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("medium");
            onOpenWallet();
          }}
          className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-transform active:scale-95"
        >
          <span>🪙</span>
          <span>Баланс: {user.wallet_coins?.toLocaleString()}</span>
        </button>
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-slate-800 pt-2">
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("posts");
          }}
          className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "posts" ? "border-pink-500 text-white" : "border-transparent text-slate-500"
          }`}
        >
          🖼️ Публикации
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("reels");
          }}
          className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "reels" ? "border-pink-500 text-white" : "border-transparent text-slate-500"
          }`}
        >
          🎬 Reels
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("saved");
          }}
          className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "saved" ? "border-pink-500 text-white" : "border-transparent text-slate-500"
          }`}
        >
          🔖 Сохраненное
        </button>
      </div>

      {/* Grid Content with Click to Open Post Viewer */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {displayList.map((postItem) => (
          <div
            key={postItem.id}
            onClick={() => {
              triggerHaptic("light");
              setSelectedPost(postItem);
            }}
            className="aspect-square bg-slate-900 overflow-hidden rounded-xl relative group cursor-pointer border border-slate-800/80 hover:border-pink-500/60 transition-all shadow-sm"
          >
            <img
              src={postItem.media_urls[0]}
              alt="Post thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            {activeTab === "reels" && (
              <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-lg p-1 text-white text-[10px]">
                ▶
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 flex items-center justify-between text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              <span>❤️ {postItem.likes_count}</span>
              <span>👁️ {postItem.views_count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Post Modal Viewer */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          currentUser={user}
          onClose={() => setSelectedPost(null)}
          onPostDeleted={(deletedId) => {
            setSelectedPost(null);
          }}
        />
      )}

      {/* Settings Modal (Three Dots Menu ⋯) */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚙️</span>
                <h3 className="text-base font-black text-white">Настройки и безопасность</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Venstogram Verified Buy/Status Option */}
            <div className="bg-gradient-to-r from-sky-950/80 via-blue-900/40 to-slate-950 p-3.5 rounded-2xl border border-sky-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Синяя галочка верификации</span>
                    <span className="text-[10px] text-sky-300">
                      {user.is_verified ? "✅ Активна (3x - 5x буст охватов)" : "3x - 5x охваты и взлёт в рекомендации"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    setVerifiedModalOpen(true);
                  }}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md transition-transform active:scale-95"
                >
                  {user.is_verified ? "Продлить" : "Купить"}
                </button>
              </div>
            </div>

            {/* Founder League Blogger Quest */}
            <div
              onClick={() => {
                triggerHaptic("medium");
                setSettingsOpen(false);
                setFounderQuestModalOpen(true);
              }}
              className="bg-gradient-to-r from-amber-950/70 via-slate-950 to-amber-950/70 p-3.5 rounded-2xl border border-amber-500/40 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">👑</span>
                <div>
                  <span className="text-xs font-bold text-white block">Лига блогеров от Основателя</span>
                  <span className="text-[10px] text-amber-300">Квест, рефералы, Золотая Галочка и подарок</span>
                </div>
              </div>
              <span className="text-amber-400 text-sm">→</span>
            </div>

            {/* Account Security (PIN & Biometrics) */}
            <div
              onClick={() => {
                setSettingsOpen(false);
                setSecurityModalOpen(true);
              }}
              className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">🔒</span>
                <div>
                  <span className="text-xs font-bold text-white block">Защитить аккаунт</span>
                  <span className="text-[10px] text-slate-400">PIN-код, Face ID, биометрия и сессии</span>
                </div>
              </div>
              <span className="text-slate-400 text-sm">→</span>
            </div>

            {/* Wallet & Coins Card */}
            <div className="bg-gradient-to-tr from-amber-600/20 via-slate-950 to-yellow-600/10 p-3.5 rounded-2xl border border-amber-500/30 space-y-2">
              <span className="text-xs text-amber-300 font-bold block">👛 Баланс Vensto Coins:</span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-white">
                    {(user.wallet_coins || 0).toLocaleString()} 🪙
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ≈ {((user.wallet_coins || 0) * 100).toLocaleString()} UZS (сум)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenWallet();
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
                >
                  ➕ Пополнить
                </button>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">🌐 Язык интерфейса (Ilova tili):</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: "ru", label: "🇷🇺 Русский" },
                  { code: "uz_latn", label: "🇺🇿 O'zbekcha" },
                  { code: "uz_cyrl", label: "🇺🇿 Ўзбекча" },
                  { code: "en", label: "🇬🇧 English" }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      triggerHaptic("selection");
                      onLanguageChange(l.code);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      lang === l.code
                        ? "bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Saver Toggle */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">⚡ Экономия трафика (Data Saver)</span>
                <span className="text-[10px] text-slate-400">Сжимать фото и видео при слабом интернете</span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  onToggleDataSaver();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  dataSaver ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    dataSaver ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Email Registration & Account Recovery */}
            <div
              onClick={() => {
                triggerHaptic("light");
                setSettingsOpen(false);
                setEmailAuthModalOpen(true);
              }}
              className="bg-slate-950 p-3.5 rounded-2xl border border-pink-500/30 flex items-center justify-between cursor-pointer hover:border-pink-500/60 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">✉️</span>
                <div>
                  <span className="text-xs font-bold text-white block">Регистрация и вход по Email</span>
                  <span className="text-[10px] text-pink-400">Свободный никнейм, код на почту и сброс пароля</span>
                </div>
              </div>
              <span className="text-pink-400 text-sm">→</span>
            </div>

            {/* Remove Avatar Option */}
            {user.avatar_url && (
              <div
                onClick={() => {
                  setSettingsOpen(false);
                  handleDeleteAvatar();
                }}
                className="bg-rose-950/30 hover:bg-rose-900/50 p-3 rounded-2xl border border-rose-900/50 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">🗑️</span>
                  <span className="text-xs font-bold text-rose-300">Удалить фотографию аватарки</span>
                </div>
                <span className="text-rose-400 text-xs font-semibold">Сбросить</span>
              </div>
            )}

            {/* Legal Policies Button (Законы РУз) */}
            <div
              onClick={() => {
                setSettingsOpen(false);
                setLegalModalOpen(true);
              }}
              className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700"
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">⚖️</span>
                <span className="text-xs font-bold text-slate-300">Законы РУз и правила платформы</span>
              </div>
              <span className="text-slate-400 text-xs">Читать ↗</span>
            </div>

            {/* Tech Support Contact Card */}
            <div className="bg-gradient-to-r from-emerald-950/70 via-slate-950 to-teal-950/70 p-3.5 rounded-2xl border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">🛠️</span>
                <div>
                  <span className="text-xs font-bold text-white block">Служба технической поддержки</span>
                  <span className="text-[10px] text-emerald-300">Помощь 24/7, вопросы по оплате и верификации</span>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 space-y-2 text-xs">
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
              </div>

              <div className="flex space-x-2 pt-0.5">
                <a
                  href="tel:+998507775152"
                  className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-center text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <span>📞</span>
                  <span>Позвонить</span>
                </a>
                <button
                  type="button"
                  onClick={() => openTelegramChannel("@yuksak_it")}
                  className="flex-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 py-2 rounded-xl text-center text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <span>💬</span>
                  <span>Написать</span>
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Роль в системе:</span>
                <span className="text-amber-400 font-bold capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Telegram ID:</span>
                <span className="text-slate-200 font-mono">{user.telegram_id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Платформа:</span>
                <span className="text-slate-500">VENSTOGRAM v2.5 Live</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & PIN Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSecurity}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                <span>🔒</span>
                <span>Защита аккаунта и кошелька</span>
              </h3>
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Установить 4-значный PIN-код для входа и кошелька:
              </label>
              <input
                type="password"
                maxLength="4"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-xl tracking-widest text-white outline-none focus:border-pink-500 font-mono"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Вход по биометрии (Face ID / Отпечаток)</span>
                <span className="text-[10px] text-slate-400">Использовать Telegram BiometricManager</span>
              </div>
              <button
                type="button"
                onClick={() => setBiometricActive(!biometricActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  biometricActive ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    biometricActive ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md"
              >
                Сохранить защиту
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Verified Buy Sheet Modal */}
      {verifiedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                <span className="text-sky-400">✓</span>
                <span>Подключение Venstogram Verified</span>
              </h3>
              <button onClick={() => setVerifiedModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Один раз подключил галочку — и твои ролики и публикации моментально получают <b>3x - 5x буст алгоритма</b> в рекомендации!
            </p>

            <div className="space-y-2">
              {[
                { months: 1, coins: 1000, label: "1 месяц — 1 000 🪙 (100 000 сум)" },
                { months: 3, coins: 2500, label: "3 месяца — 2 500 🪙 (-17% скидка)" },
                { months: 12, coins: 8000, label: "1 год — 8 000 🪙 (-33% суперскидка)" }
              ].map((p) => (
                <div
                  key={p.months}
                  className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{p.label}</span>
                  </div>
                  <button
                    onClick={() => handleBuyVerified(p.months, p.coins)}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md"
                  >
                    Активировать
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legal Policies Modal (Законодательство РУз) */}
      {legalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-3 text-xs leading-relaxed">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-amber-400 flex items-center space-x-1.5">
                <span>⚖️</span>
                <span>Законодательство Республики Узбекистан</span>
              </h3>
              <button onClick={() => setLegalModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-300">
              Платформа <b>VENSTOGRAM</b> строго соблюдает законы Республики Узбекистан. При регистрации каждый пользователь обязуется не нарушать законодательство:
            </p>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="font-bold text-rose-400 block">🔞 Статья 130 Уголовного кодекса РУз:</span>
              <p className="text-slate-400 text-[11px]">
                Изготовление, хранение в целях распространения или распространение порнографических предметов и материалов наказывается штрафом или лишением свободы. На платформе запрещены любой интим-контент и порнография.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="font-bold text-rose-400 block">💣 Статья 244-1 Уголовного кодекса РУз:</span>
              <p className="text-slate-400 text-[11px]">
                Изготовление, хранение или распространение материалов, содержащих угрозу общественной безопасности, пропаганду оружия, экстремизма или терроризма. Нарушители блокируются навсегда с передачей данных правоохранительным органам.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="font-bold text-sky-400 block">📱 Статья 12-1 Закона РУз «Об информатизации»:</span>
              <p className="text-slate-400 text-[11px]">
                Обязанность блогеров и пользователей не допускать пропаганды насилия, побоев, жестокости, мошенничества и фальшивых платежных документов.
              </p>
            </div>

            <button
              onClick={() => setLegalModalOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs mt-2"
            >
              Я ознакомлен и согласен
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfile}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white">Редактирование профиля</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Avatar Uploader Section */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="relative">
                <img
                  src={editAvatarUrl || user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-pink-500 shadow-md"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-xs text-white">
                    Загрузка...
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="bg-slate-800 hover:bg-slate-700 text-pink-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1"
                >
                  <span>📷</span>
                  <span>Выбрать фото</span>
                </button>
                {(editAvatarUrl || user?.avatar_url) && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-800 flex items-center space-x-1"
                  >
                    <span>🗑️</span>
                    <span>Удалить аватарку</span>
                  </button>
                )}
              </div>
            </div>

            {/* Username Selection & Live Availability Check */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-white flex items-center space-x-1">
                  <span>💎 Уникальный никнейм (@username)</span>
                </label>
                {checkingUsername ? (
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin inline-block" />
                    <span>Проверка...</span>
                  </span>
                ) : usernameStatus?.available ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                    <span>✓</span>
                    <span>{usernameStatus.is_current ? "Ваш ник" : "Свободен!"}</span>
                  </span>
                ) : usernameStatus && !usernameStatus.available ? (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-500/30">
                    ✕ Занят
                  </span>
                ) : null}
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs font-mono font-bold select-none">@</span>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "");
                    setEditUsername(val);
                  }}
                  placeholder="придумайте_никнейм"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Status text or live suggestions when username is taken */}
              {usernameStatus && !usernameStatus.available && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-rose-300 block">
                    {usernameStatus.message}
                  </span>
                  {usernameStatus.suggestions && usernameStatus.suggestions.length > 0 && (
                    <div className="space-y-1 pt-0.5">
                      <span className="text-[10px] text-amber-300 font-bold block">
                        👇 Нажмите, чтобы выбрать свободный вариант с цифрой:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {usernameStatus.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              triggerHaptic("medium");
                              setEditUsername(sug);
                            }}
                            className="bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/40 hover:border-pink-400 text-pink-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1 active:scale-95"
                          >
                            <span>@{sug}</span>
                            <span className="text-[9px] text-pink-400 bg-pink-500/20 px-1 rounded">выбрать ↵</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Имя</label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Фамилия</label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">О себе (Биография)</label>
              <textarea
                rows="3"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Расскажите о себе, интересах, контенте..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-sky-400 font-bold block mb-1">
                📢 Ссылка на Telegram-канал или группу
              </label>
              <input
                type="text"
                value={editTelegramChannel}
                onChange={(e) => setEditTelegramChannel(e.target.value)}
                placeholder="https://t.me/mychannel или @mychannel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-300 outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Кнопка перехода появится прямо в вашем профиле
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Веб-сайт</label>
              <input
                type="text"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white py-2.5 rounded-xl text-xs font-black shadow-lg shadow-pink-600/30"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email Registration & Password Recovery Modal */}
      {emailAuthModalOpen && (
        <EmailAuthModal
          onClose={() => setEmailAuthModalOpen(false)}
          onAuthSuccess={(u) => {
            if (onUpdateUser) onUpdateUser(u);
          }}
        />
      )}

      {/* Founder Quest Modal */}
      {founderQuestModalOpen && (
        <FounderQuestModal
          user={user}
          onClose={() => setFounderQuestModalOpen(false)}
          onUserUpdated={(u) => {
            if (onUpdateUser) onUpdateUser(u);
          }}
        />
      )}
    </div>
  );
}
