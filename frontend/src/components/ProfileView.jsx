import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic, authenticateBiometrics } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";
import { PostModal } from "./PostModal.jsx";
import { EmailAuthModal } from "./EmailAuthModal.jsx";
import { FounderQuestModal } from "./FounderQuestModal.jsx";
import { FollowListModal } from "./FollowListModal.jsx";

export function ProfileView({
  user,
  t,
  lang,
  onLanguageChange,
  dataSaver,
  onToggleDataSaver,
  onOpenWallet,
  onUpdateUser,
  onOpenProfile,
  theme = "dark",
  onToggleTheme,
  onLogout,
  onOpenEmailAuth
}) {
  const [activeTab, setActiveTab] = useState("posts"); // posts, reels, saved
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [verifiedModalOpen, setVerifiedModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [emailAuthModalOpen, setEmailAuthModalOpen] = useState(false);
  const [founderQuestModalOpen, setFounderQuestModalOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    (typeof localStorage !== "undefined" && localStorage.getItem("vensto_user_country")) || "🇺🇿 Узбекистан"
  );
  const [storiesArchiveOpen, setStoriesArchiveOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [closeFriendsModalOpen, setCloseFriendsModalOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(
    (typeof localStorage !== "undefined" && localStorage.getItem("vensto_push_notifications") !== "false")
  );
  const [followModal, setFollowModal] = useState(null); // { type: "followers" | "following", userId, title }

  // Selected Post Viewer
  const [selectedPost, setSelectedPost] = useState(null);

  // Sync latest user stats from server
  useEffect(() => {
    if (user?.id) {
      Api.get("/auth/me").then((fresh) => {
        if (fresh && onUpdateUser) {
          onUpdateUser((prev) => ({ ...prev, ...fresh }));
        }
      }).catch(() => {});
    }
  }, [user?.id]);

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

  // Dynamic publications, reels and saved items loaded from API
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  // VIP Theme Gifting Modal (Founder Privilege)
  const [giftThemeModalOpen, setGiftThemeModalOpen] = useState(false);
  const [giftRecipientUsername, setGiftRecipientUsername] = useState("");
  const [giftSelectedTheme, setGiftSelectedTheme] = useState("gold_founder");
  const [giftingTheme, setGiftingTheme] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserContent();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "saved") {
      Api.get("/users/me/saved")
        .then((data) => setSavedItems(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [activeTab]);

  const loadUserContent = async () => {
    try {
      setContentLoading(true);
      const targetUserId = user?.id || 1;
      const [postsRes, reelsRes, savedRes] = await Promise.allSettled([
        Api.get(`/users/${targetUserId}/posts`),
        Api.get(`/users/${targetUserId}/reels`),
        Api.get("/users/me/saved")
      ]);
      setUserPosts(postsRes.status === "fulfilled" && Array.isArray(postsRes.value) ? postsRes.value : []);
      setUserReels(reelsRes.status === "fulfilled" && Array.isArray(reelsRes.value) ? reelsRes.value : []);
      setSavedItems(savedRes.status === "fulfilled" && Array.isArray(savedRes.value) ? savedRes.value : []);
    } catch (err) {
      console.warn("Failed loading user content:", err);
      setUserPosts([]);
      setUserReels([]);
      setSavedItems([]);
    } finally {
      setContentLoading(false);
    }
  };

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

  const handleToggleIncognito = async () => {
    triggerHaptic("medium");
    const nextVal = !user?.is_incognito;
    try {
      await Api.patch("/auth/me", { is_incognito: nextVal });
      onUpdateUser({ ...user, is_incognito: nextVal });
    } catch (e) {
      alert("Ошибка обновления режима: " + e.message);
    }
  };

  const handleTogglePrivate = async () => {
    triggerHaptic("medium");
    const nextVal = !user?.is_private;
    try {
      await Api.patch("/auth/me", { is_private: nextVal });
      onUpdateUser({ ...user, is_private: nextVal });
    } catch (e) {
      alert("Ошибка обновления приватности: " + e.message);
    }
  };



  const handleShareMyProfile = () => {
    triggerHaptic("light");
    const username = user?.username || `id${user?.id}`;
    const url = `https://t.me/venstogrambot?startapp=u_${username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    alert("✓ Ссылка на ваш профиль скопирована!");
  };

  const handleTogglePush = () => {
    triggerHaptic("light");
    const nextVal = !pushEnabled;
    setPushEnabled(nextVal);
    try {
      localStorage.setItem("vensto_push_notifications", String(nextVal));
    } catch (e) {}
  };

  const handleSelectCountry = (countryName) => {
    triggerHaptic("selection");
    setSelectedCountry(countryName);
    try {
      localStorage.setItem("vensto_user_country", countryName);
    } catch (e) {}
    setCountryModalOpen(false);
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

  // Deduplicate posts that have the same video URL as a reel (legacy bug fix)
  const uniqueReelsUrls = new Set((userReels || []).map((r) => r.video_url).filter(Boolean));
  const uniqueUserPosts = (userPosts || []).filter((p) => {
    const url = p.media_urls?.[0];
    return !url || !uniqueReelsUrls.has(url);
  });
  const totalPublicationsCount = uniqueUserPosts.length + (userReels || []).length;

  const displayList =
    activeTab === "reels"
      ? userReels
      : activeTab === "saved"
      ? savedItems
      : uniqueUserPosts;

  const userTheme = user?.profile_theme || (user?.role === "director" ? "gold_founder" : "default");
  const isDirector = user?.role === "director";
  const isFounderTheme = userTheme === "gold_founder" || isDirector;

  let themeContainerStyle = "p-4 space-y-4 pb-24 bg-white text-slate-900";
  if (isFounderTheme) {
    themeContainerStyle += " bg-gradient-to-b from-amber-50/60 via-white to-amber-50/40 border-t-2 border-amber-500/40";
  } else if (userTheme === "cyber_neon") {
    themeContainerStyle += " bg-gradient-to-b from-cyan-50/60 via-white to-purple-50/40 border-t-2 border-cyan-400/40";
  } else if (userTheme === "royal_emerald") {
    themeContainerStyle += " bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/40 border-t-2 border-emerald-400/40";
  } else if (userTheme === "ruby_luxury") {
    themeContainerStyle += " bg-gradient-to-b from-rose-50/60 via-white to-pink-50/40 border-t-2 border-rose-500/40";
  }

  const handleGiftThemeSubmit = async (e) => {
    e.preventDefault();
    const cleanTarget = (giftRecipientUsername || "").trim().replace(/^@/, "").toLowerCase();
    if (!cleanTarget) {
      alert("Введите никнейм пользователя");
      return;
    }
    setGiftingTheme(true);
    triggerHaptic("medium");
    try {
      const searchRes = await Api.get(`/users/search?q=${encodeURIComponent(cleanTarget)}`);
      let targetUser = null;
      if (Array.isArray(searchRes)) {
        targetUser = searchRes.find(
          (u) => (u.username || "").toLowerCase() === cleanTarget
        ) || searchRes[0];
      }
      if (!targetUser) {
        throw new Error(`Пользователь @${cleanTarget} не найден`);
      }

      const res = await Api.post(`/users/${targetUser.id}/gift-theme`, {
        user_id: targetUser.id,
        theme: giftSelectedTheme
      });
      triggerHaptic("success");
      SoundEngine.playFanfare();
      alert(res.message || "✓ VIP дизайн успешно установлен!");
      setGiftThemeModalOpen(false);
      setGiftRecipientUsername("");
    } catch (err) {
      alert("Ошибка: " + err.message);
    } finally {
      setGiftingTheme(false);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs">Загрузка профиля...</span>
      </div>
    );
  }

  return (
    <div className={themeContainerStyle}>
      {/* Top Profile Bar with Username and Three-Dots Menu */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-base font-black text-slate-900">@{user.username}</span>
          {user.badge_type === "gold_founder" ? (
            <span className="text-amber-500 font-bold text-sm" title="Золотая Галочка Основателя">👑</span>
          ) : user.is_verified ? (
            <span className="text-sky-500 font-bold text-sm" title="Верифицирован">✓</span>
          ) : null}
          {user.role === "director" && (
            <span className="text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase ml-1 shadow-sm">
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
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-1 shadow-sm"
          title="Настройки (Sozlamalar)"
        >
          <span className="text-base font-black tracking-widest leading-none">⋯</span>
        </button>
      </div>

      {/* Founder VIP Banner */}
      {isFounderTheme && (
        <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 border border-amber-300 rounded-2xl p-3 shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-base shadow-sm ring-2 ring-amber-300 shrink-0">
              👑
            </div>
            <div>
              <span className="text-xs font-black text-amber-950 tracking-wide block uppercase">
                {isDirector ? "Основатель Venstogram" : "Лига Победителей Лиги Основателя"}
              </span>
              <span className="text-[10px] text-amber-900 font-medium">
                Эксклюзивный VIP дизайн • Золотой фон
              </span>
            </div>
          </div>
        </div>
      )}

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
            src={user.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
            alt="Profile avatar"
            className={`w-20 h-20 rounded-full object-cover transition-all shadow-xl ${
              isFounderTheme
                ? "ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)]"
                : userTheme === "cyber_neon"
                ? "ring-4 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.6)]"
                : userTheme === "royal_emerald"
                ? "ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.6)]"
                : userTheme === "ruby_luxury"
                ? "ring-4 ring-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                : "ring-2 ring-pink-500"
            }`}
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
            <span className="text-base font-black text-slate-900 block">{totalPublicationsCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">{t?.postsCount || "Публикаций"}</span>
          </div>
          <div
            onClick={() => {
              triggerHaptic("light");
              setFollowModal({ type: "followers", userId: user.id, title: t?.followers || "Мои подписчики" });
            }}
            className="cursor-pointer active:scale-95 transition hover:opacity-80"
          >
            <span className="text-base font-black text-slate-900 block">{user.followers_count || 0}</span>
            <span className="text-[11px] text-pink-600 font-bold hover:underline">{t?.followers || "Подписчиков"}</span>
          </div>
          <div
            onClick={() => {
              triggerHaptic("light");
              setFollowModal({ type: "following", userId: user.id, title: t?.followingCount || "Мои подписки" });
            }}
            className="cursor-pointer active:scale-95 transition hover:opacity-80"
          >
            <span className="text-base font-black text-slate-900 block">{user.following_count || 0}</span>
            <span className="text-[11px] text-pink-600 font-bold hover:underline">{t?.followingCount || "Подписок"}</span>
          </div>
        </div>
      </div>

      {/* User Info & Bio */}
      <div>
        <div className="flex items-center space-x-1.5">
          <h2 className="text-base font-black text-slate-900">
            {user.first_name} {user.last_name || ""}
          </h2>
        </div>

        {user.bio ? (
          <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-line leading-relaxed">
            {user.bio}
          </p>
        ) : (user.role === "director" || user.telegram_id === 1477103854 || user.username === "oqyolai") ? (
          <p className="text-xs text-amber-700 font-bold mt-1.5 leading-relaxed">
            👑 Основатель платформы Venstogram
          </p>
        ) : null}

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

        {/* External Website */}
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-pink-600 hover:text-pink-700 font-semibold mt-1.5 flex items-center space-x-1"
          >
            <span>🔗</span>
            <span>{user.website}</span>
          </a>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex space-x-2">
        <button
          onClick={() => {
            triggerHaptic("light");
            setIsEditing(true);
          }}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-1"
        >
          <span>✏️</span>
          <span>{t?.editProfile || "Редактировать профиль"}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("medium");
            onOpenWallet();
          }}
          className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-transform active:scale-95"
        >
          <span>🪙</span>
          <span>{t?.wallet || "Баланс"}: {user.wallet_coins?.toLocaleString()}</span>
        </button>
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-slate-200 pt-2">
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("posts");
          }}
          className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "posts" ? "border-pink-500 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          🖼️ {t?.postsCount || "Публикации"}
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("reels");
          }}
          className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "reels" ? "border-pink-500 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
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
            activeTab === "saved" ? "border-pink-500 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          🔖 Сохраненное
        </button>
      </div>

      {/* Grid Content with Click to Open Post Viewer */}
      {contentLoading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs">Загрузка контента...</span>
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-12 px-4 text-center bg-slate-50 border border-slate-200 rounded-2xl my-2">
          <span className="text-3xl block mb-2">
            {activeTab === "reels" ? "🎬" : activeTab === "saved" ? "🔖" : "📸"}
          </span>
          <p className="text-xs font-bold text-slate-900 mb-1">
            {activeTab === "reels"
              ? "У вас пока нет Reels"
              : activeTab === "saved"
              ? "У вас пока нет сохраненных публикаций"
              : "У вас пока нет публикаций"}
          </p>
          <p className="text-[11px] text-slate-500 mb-3 max-w-xs mx-auto">
            {activeTab === "reels"
              ? "Загрузите первое видео, чтобы набрать просмотры и попасть в рекомендации!"
              : activeTab === "saved"
              ? "Сохраняйте понравившиеся Reels и посты, нажимая на значок закладки 🔖!"
              : "Делитесь своими моментами, публикуйте фото и привлекайте подписчиков!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {displayList.map((postItem) => {
            const isVideo =
              activeTab === "reels" ||
              postItem.item_type === "reel" ||
              postItem.media_type === "video" ||
              Boolean(postItem.video_url) ||
              (typeof postItem.media_urls?.[0] === "string" &&
                (postItem.media_urls[0].includes(".mp4") ||
                  postItem.media_urls[0].includes(".mov") ||
                  postItem.media_urls[0].includes(".webm") ||
                  postItem.media_urls[0].startsWith("data:video")));

            const videoSrc = postItem.video_url || (isVideo ? postItem.media_urls?.[0] : null);
            const imageSrc = postItem.thumbnail_url || (!isVideo ? postItem.media_urls?.[0] : null) || "/placeholder.jpg";

            return (
              <div
                key={`${postItem.item_type || "item"}_${postItem.id}`}
                onClick={() => {
                  triggerHaptic("light");
                  const inferredType = (activeTab === "reels" || postItem.item_type === "reel" || Boolean(postItem.video_url)) ? "reel" : (postItem.media_type === "video" ? "reel" : "post");
                  setSelectedPost({
                    ...postItem,
                    item_type: postItem.item_type || inferredType,
                    user_id: postItem.user_id || user?.id,
                    author: postItem.author || {
                      id: user?.id,
                      username: user?.username,
                      first_name: user?.first_name,
                      last_name: user?.last_name,
                      avatar_url: user?.avatar_url
                    }
                  });
                }}
                className="aspect-square bg-slate-900 overflow-hidden rounded-xl relative group cursor-pointer border border-slate-800/80 hover:border-pink-500/60 transition-all shadow-sm"
              >
                {postItem.thumbnail_url ? (
                  <img
                    src={postItem.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : isVideo && videoSrc ? (
                  <video
                    src={videoSrc}
                    preload="metadata"
                    muted
                    playsInline
                    className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <img
                    src={imageSrc}
                    alt="Post thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}

                {isVideo && (
                  <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-white text-[10px] font-black flex items-center space-x-0.5 shadow-md">
                    <span>▶</span>
                  </div>
                )}

                {postItem.item_type === "reel" && (
                  <div className="absolute top-1.5 left-1.5 bg-pink-600/90 backdrop-blur-sm rounded-md px-1 py-0.5 text-white text-[8px] font-black uppercase tracking-wider">
                    Reels
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 flex items-center justify-between text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>❤️ {postItem.likes_count || 0}</span>
                  <span>👁️ {postItem.views_count || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Modal Viewer */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          currentUser={user}
          onClose={() => setSelectedPost(null)}
          onPostDeleted={(deletedId) => {
            setSelectedPost(null);
            setUserPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setUserReels((prev) => prev.filter((r) => r.id !== deletedId));
            setSavedItems((prev) => prev.filter((s) => s.id !== deletedId && s.item_id !== deletedId));
            triggerHaptic("success");
          }}
        />
      )}

      {/* Settings Modal (Three Dots Menu ⋯) */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚙️</span>
                <h3 className="text-base font-black text-slate-900">Меню и настройки</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Быстрые действия
              </span>

              {/* Share My Profile Button */}
              <div
                onClick={handleShareMyProfile}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">🔗</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Поделиться профилем</span>
                    <span className="text-[10px] text-slate-500">Скопировать ссылку для друзей</span>
                  </div>
                </div>
                <span className="text-pink-600 text-xs font-bold">Копировать</span>
              </div>

              {/* Founder VIP Theme Gifting */}
              {isDirector && (
                <div
                  onClick={() => {
                    triggerHaptic("medium");
                    setSettingsOpen(false);
                    setGiftThemeModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-2xl border border-amber-300 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all shadow-sm active:scale-98"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">🎁</span>
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">Подарить VIP дизайн</span>
                      <span className="text-[10px] text-amber-700">Подарите блогеру эксклюзивное оформление</span>
                    </div>
                  </div>
                  <span className="text-amber-600 text-xs font-bold">Выбрать ↵</span>
                </div>
              )}

              {/* Venstogram Verified Buy/Status Option */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-3 rounded-2xl border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-600 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Синяя галочка верификации</span>
                      <span className="text-[10px] text-sky-600 font-medium">
                        {user.is_verified ? "✅ Активна (3x - 5x буст охватов)" : "3x - 5x охваты и топ в ленте"}
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
                    {user.is_verified ? "Продлить" : "Получить"}
                  </button>
                </div>
              </div>

              {/* Wallet & Coins Card */}
              <div className="bg-gradient-to-tr from-amber-50 via-white to-yellow-50 p-3 rounded-2xl border border-amber-300 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-amber-700 font-bold block">👛 Баланс кошелька:</span>
                  <span className="text-lg font-black text-slate-900">
                    {(user.wallet_coins || 0).toLocaleString()} 🪙
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenWallet();
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-white font-black text-xs px-3 py-2 rounded-xl shadow-md transition-transform active:scale-95"
                >
                  ➕ Пополнить
                </button>
              </div>
            </div>

            {/* Privacy & Confidentiality */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Конфиденциальность и приватность
              </span>

              {/* Incognito Stealth Mode */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">🕶️</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Режим невидимка</span>
                    <span className="text-[10px] text-slate-500">Скрыть онлайн и время активности</span>
                  </div>
                </div>
                <button
                  onClick={handleToggleIncognito}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    user?.is_incognito ? "bg-pink-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      user?.is_incognito ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Private Profile Toggle */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">🔒</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Закрытый аккаунт</span>
                    <span className="text-[10px] text-slate-500">Только подписчики видят публикации</span>
                  </div>
                </div>
                <button
                  onClick={handleTogglePrivate}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    user?.is_private ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      user?.is_private ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>



              {/* Account Security (PIN & Biometrics) */}
              <div
                onClick={() => {
                  setSettingsOpen(false);
                  setSecurityModalOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Защитить аккаунт</span>
                    <span className="text-[10px] text-slate-500">PIN-код, Face ID и биометрия</span>
                  </div>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>

              {/* Close Friends */}
              <div
                onClick={() => {
                  setSettingsOpen(false);
                  setCloseFriendsModalOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">💚</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Близкие друзья</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Список для приватных Stories</span>
                  </div>
                </div>
                <span className="text-emerald-600 text-xs font-bold">Настроить</span>
              </div>
            </div>

            {/* Content & Archive */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Контент и история
              </span>

              {/* Stories Archive */}
              <div
                onClick={() => {
                  setSettingsOpen(false);
                  setStoriesArchiveOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">📦</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Архив историй</span>
                    <span className="text-[10px] text-slate-500">Все ваши прошлые Stories</span>
                  </div>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>

              {/* Your Activity */}
              <div
                onClick={() => {
                  setSettingsOpen(false);
                  setActivityModalOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">❤️</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Ваши действия</span>
                    <span className="text-[10px] text-slate-500">Понравившиеся посты и комментарии</span>
                  </div>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            </div>

            {/* App Preferences */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Настройки приложения
              </span>

              {/* Language Switcher */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-900 block">🌐 Язык интерфейса:</span>
                <div className="grid grid-cols-2 gap-1.5">
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
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                        lang === l.code
                          ? "bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{l.label}</span>
                      {lang === l.code && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selection */}
              <div
                onClick={() => {
                  setSettingsOpen(false);
                  setCountryModalOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">📍</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Страна / Регион:</span>
                    <span className="text-[10px] text-slate-500">{selectedCountry}</span>
                  </div>
                </div>
                <span className="text-sky-600 text-xs font-bold">Изменить ↗</span>
              </div>

              {/* Push Notifications Toggle */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">🔔</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Уведомления</span>
                    <span className="text-[10px] text-slate-500">Push-сообщения о лайках и ответах</span>
                  </div>
                </div>
                <button
                  onClick={handleTogglePush}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    pushEnabled ? "bg-pink-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      pushEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Data Saver Toggle */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">⚡</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Экономия трафика</span>
                    <span className="text-[10px] text-slate-500">Сжимать фото и видео</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    onToggleDataSaver();
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    dataSaver ? "bg-emerald-500" : "bg-slate-300"
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
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-pink-200 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">✉️</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Email и пароль</span>
                    <span className="text-[10px] text-pink-600 font-medium">Резервный вход и безопасность</span>
                  </div>
                </div>
                <span className="text-pink-600 text-sm font-bold">→</span>
              </div>
            </div>

            {/* Support and Legal */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Лига блогеров и поддержка
              </span>

              {/* Founder League & Blogger Quest next to Tech Support */}
              <div
                onClick={() => {
                  triggerHaptic("medium");
                  setSettingsOpen(false);
                  setFounderQuestModalOpen(true);
                }}
                className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-300 hover:border-amber-400 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm active:scale-98"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center text-lg font-black shadow-md shadow-amber-500/20">
                    👑
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                      <span>Лига Блогеров & Квест Основателя</span>
                      {user.badge_type === "gold_founder" ? (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-300">Победитель 👑</span>
                      ) : (
                        <span className="text-[9px] bg-pink-100 text-pink-700 font-bold px-1.5 py-0.5 rounded border border-pink-200">Состязание</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Приглашай друзей, набирай охваты и получи Золотую Галочку!
                    </p>
                  </div>
                </div>
                <span className="text-amber-600 font-bold text-sm">→</span>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-3 rounded-2xl border border-emerald-300 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🛠️</span>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Служба техподдержки</span>
                    <span className="text-[10px] text-emerald-700 font-medium">Помощь 24/7, вопросы по аккаунту</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-emerald-100 space-y-1.5 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">📞 Телефон:</span>
                    <a href="tel:+998507775152" className="text-emerald-600 font-mono font-bold hover:underline">
                      +998 50 777 51 52
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">💬 Telegram:</span>
                    <button
                      type="button"
                      onClick={() => openTelegramChannel("@yuksak_it")}
                      className="text-sky-600 font-mono font-bold hover:underline"
                    >
                      @yuksak_it ↗
                    </button>
                  </div>
                </div>
              </div>

              {/* Legal Policies */}
              <div
                onClick={() => {
                  setSettingsOpen(false);
                  setLegalModalOpen(true);
                }}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">⚖️</span>
                  <span className="text-xs font-bold text-slate-800">Законы РУз и правила платформы</span>
                </div>
                <span className="text-slate-500 text-xs font-bold">Читать ↗</span>
              </div>
            </div>

            {/* Account & Logout */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setSettingsOpen(false);
                  if (onOpenEmailAuth) {
                    onOpenEmailAuth();
                  } else {
                    setEmailAuthModalOpen(true);
                  }
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-pink-600 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>🔑</span>
                <span>Войти под другим логином / Email</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("heavy");
                  setSettingsOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 transition active:scale-95"
              >
                <span>🚪</span>
                <span>Выйти из профиля (Logout)</span>
              </button>
            </div>

            {/* Account Info */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Роль в системе:</span>
                <span className="text-amber-700 font-bold capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Telegram ID:</span>
                <span className="text-slate-800 font-mono">{user.telegram_id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Платформа:</span>
                <span className="text-slate-600 font-medium">VENSTOGRAM v2.5 Live</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Country & Region Modal */}
      {countryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                <span>📍</span>
                <span>Выбор страны и региона</span>
              </h3>
              <button
                type="button"
                onClick={() => setCountryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              {[
                { name: "🇺🇿 Узбекистан (O'zbekiston)", desc: "Ташкент, Самарканд, Бухара" },
                { name: "🇰🇿 Казахстан (Qazaqstan)", desc: "Астана, Алматы, Шымкент" },
                { name: "🇷🇺 Россия (Россия)", desc: "Москва, Санкт-Петербург, регионы" },
                { name: "🇹🇷 Турция (Türkiye)", desc: "Стамбул, Анкара, Анталья" },
                { name: "🌐 Весь мир (Global)", desc: "Международный охват публикаций" }
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectCountry(c.name)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedCountry === c.name
                      ? "bg-sky-950/70 border-sky-500 text-sky-300 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="text-xs block font-bold">{c.name}</span>
                    <span className="text-[10px] text-slate-400">{c.desc}</span>
                  </div>
                  {selectedCountry === c.name && <span className="text-sky-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stories Archive Modal */}
      {storiesArchiveOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <span>📦</span>
              <span>Архив историй (Stories)</span>
            </h3>
            <button
              onClick={() => setStoriesArchiveOpen(false)}
              className="text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-6 text-center space-y-3">
            <span className="text-4xl block">🎞️</span>
            <p className="text-xs font-bold text-slate-300">Архив ваших историй защищен</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Все опубликованные вами Stories после 24 часов автоматически сохраняются в персональный архив, доступный только вам.
            </p>
          </div>
        </div>
      )}

      {/* Your Activity Modal */}
      {activityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <span>❤️</span>
              <span>Ваши действия в Venstogram</span>
            </h3>
            <button
              onClick={() => setActivityModalOpen(false)}
              className="text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-6 text-center space-y-3">
            <span className="text-4xl block">✨</span>
            <p className="text-xs font-bold text-slate-300">История отметок и комментариев</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Здесь отображается полная история ваших лайков, комментариев и репостов. Ваши действия синхронизируются в реальном времени.
            </p>
          </div>
        </div>
      )}

      {/* Close Friends Modal */}
      {closeFriendsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <span>💚</span>
              <span>Близкие друзья (Close Friends)</span>
            </h3>
            <button
              onClick={() => setCloseFriendsModalOpen(false)}
              className="text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-6 text-center space-y-3">
            <span className="text-4xl block">🛡️</span>
            <p className="text-xs font-bold text-emerald-400">Приватный список для избранных Stories</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Когда вы выкладываете историю со значком «Близкие друзья», её видят только пользователи из этого списка с зеленой рамкой.
            </p>
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

      {/* Verified Badges Modal */}
      {verifiedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                <span className="text-sky-400">✓</span>
                <span>Статусы верификации Venstogram</span>
              </h3>
              <button onClick={() => setVerifiedModalOpen(false)} className="text-slate-400 hover:text-white text-lg p-1">✕</button>
            </div>

            {/* Tier 1: Gold Founder Badge (Cannot be bought) */}
            <div className="bg-gradient-to-r from-amber-950/80 via-slate-950 to-yellow-950/80 border border-amber-500/50 rounded-2xl p-3.5 space-y-2 shadow-lg shadow-amber-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">👑</span>
                  <div>
                    <span className="text-xs font-black text-amber-300 block">Золотая Галочка Основателя</span>
                    <span className="text-[10px] text-amber-200/80">Высший статус почёта и признания</span>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  Эксклюзив
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                👑 <b>Не продаётся за деньги!</b> Этот статус вручается <b>исключительно Лично Основателем</b> платформы за победу в Квесте блогеров или за выдающийся вклад.
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  setVerifiedModalOpen(false);
                  setFounderQuestModalOpen(true);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs py-2 rounded-xl shadow-md transition-all active:scale-95"
              >
                🏆 Участвовать в Квесте Основателя
              </button>
            </div>

            {/* Tier 2: Blue Verified Badge (For purchase) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sky-400 font-bold text-sm">✓</span>
                  <span className="text-xs font-black text-white">Официальная Синяя Галочка (Verified)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Баланс: {user.wallet_coins || 0} 🪙</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Подтверждает подлинность профиля, защищает от фейков и удваивает показы контента в рекомендациях.
              </p>

              <div className="space-y-2">
                {[
                  { months: 1, coins: 1000, sum: "100 000 сум", discount: null, label: "1 месяц" },
                  { months: 3, coins: 2490, sum: "249 000 сум", discount: "-17% скидка", label: "3 месяца" },
                  { months: 12, coins: 8040, sum: "804 000 сум", discount: "-33% скидка", label: "1 год (12 мес.)" }
                ].map((p) => (
                  <div
                    key={p.months}
                    className="bg-slate-950 p-3 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white">{p.label}</span>
                        {p.discount && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                            {p.discount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-sky-400 font-mono font-bold block mt-0.5">
                        {p.coins.toLocaleString()} 🪙 ({p.sum})
                      </span>
                    </div>
                    <button
                      onClick={() => handleBuyVerified(p.months, p.coins)}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md transition active:scale-95"
                    >
                      Подключить
                    </button>
                  </div>
                ))}
              </div>
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
                  src={editAvatarUrl || user.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
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

      {/* Follow / Following List Modal */}
      {followModal && (
        <FollowListModal
          userId={followModal.userId}
          type={followModal.type}
          title={followModal.title}
          currentUser={user}
          onClose={() => setFollowModal(null)}
          onOpenProfile={(targetId) => {
            if (onOpenProfile) onOpenProfile(targetId);
          }}
          onFollowChanged={async () => {
            try {
              const fresh = await Api.get("/auth/me");
              if (fresh && onUpdateUser) onUpdateUser((prev) => ({ ...prev, ...fresh }));
            } catch (e) {}
          }}
        />
      )}

      {/* Gift VIP Theme Modal (Director Privilege) */}
      {giftThemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative shadow-amber-500/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎁</span>
                <div>
                  <h3 className="text-base font-black text-white">Подарить VIP дизайн</h3>
                  <span className="text-[11px] text-amber-400 font-semibold">Привилегия Основателя платформы</span>
                </div>
              </div>
              <button
                onClick={() => setGiftThemeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGiftThemeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Никнейм пользователя (@username)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-bold select-none">@</span>
                  <input
                    type="text"
                    value={giftRecipientUsername}
                    onChange={(e) => setGiftRecipientUsername(e.target.value.replace(/^@/, ""))}
                    placeholder="логин_пользователя"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Выберите VIP оформление:
                </label>
                <div className="space-y-2">
                  {[
                    { id: "gold_founder", title: "👑 Золотой Основатель", desc: "Роскошный золотой фон, корона и аура", color: "border-amber-500/50 bg-amber-950/20 text-amber-300" },
                    { id: "cyber_neon", title: "💎 Киберпанк Неон", desc: "Электрический неоновый градиент и свечение", color: "border-cyan-500/50 bg-cyan-950/20 text-cyan-300" },
                    { id: "royal_emerald", title: "🌿 Королевский Изумруд", desc: "Глубокий изумрудный бархат с золотом", color: "border-emerald-500/50 bg-emerald-950/20 text-emerald-300" },
                    { id: "ruby_luxury", title: "🍷 Рубиновый Люкс", desc: "Насыщенный рубиновый и розовое золото", color: "border-rose-500/50 bg-rose-950/20 text-rose-300" },
                    { id: "default", title: "⚙️ Стандартная тема", desc: "Классический темный дизайн", color: "border-slate-800 bg-slate-950 text-slate-300" }
                  ].map((themeOpt) => (
                    <div
                      key={themeOpt.id}
                      onClick={() => {
                        triggerHaptic("selection");
                        setGiftSelectedTheme(themeOpt.id);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        giftSelectedTheme === themeOpt.id
                          ? `${themeOpt.color} ring-2 ring-amber-400 shadow-md`
                          : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{themeOpt.title}</span>
                        <span className="text-[10px] opacity-75">{themeOpt.desc}</span>
                      </div>
                      {giftSelectedTheme === themeOpt.id && (
                        <span className="text-amber-400 font-bold text-sm">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={giftingTheme}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition"
              >
                {giftingTheme ? "Подарок отправляется..." : "Подарить VIP оформление 🎁"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
