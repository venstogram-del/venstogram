import React, { useState, useEffect } from "react";
import { translations, getInitialLanguage } from "./i18n.js";
import { initTelegramApp, triggerHaptic, tg } from "./telegram.js";
import { Api, RealtimeSocket } from "./api.js";
import { SoundEngine } from "./sound.js";
import { Header } from "./components/Header.jsx";
import { BottomNav } from "./components/BottomNav.jsx";
import { StoriesBar } from "./components/StoriesBar.jsx";
import { FeedView } from "./components/FeedView.jsx";
import { SearchView } from "./components/SearchView.jsx";
import { ReelsView } from "./components/ReelsView.jsx";
import { MarketplaceView } from "./components/MarketplaceView.jsx";
import { ProfileView } from "./components/ProfileView.jsx";
import { AdminView } from "./components/AdminView.jsx";
import { ChatView } from "./components/ChatView.jsx";
import { WalletModal } from "./components/WalletModal.jsx";
import { CreatePostModal } from "./components/CreatePostModal.jsx";
import { FounderQuestModal } from "./components/FounderQuestModal.jsx";
import { RegistrationModal } from "./components/RegistrationModal.jsx";
import { UserProfileModal } from "./components/UserProfileModal.jsx";
import { PostModal } from "./components/PostModal.jsx";

export function App() {
  const safeGetItem = (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } };
  const safeSetItem = (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} };

  const [lang, setLang] = useState(getInitialLanguage());
  const t = translations[lang] || translations.ru;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [dataSaver, setDataSaver] = useState(safeGetItem("vensto_data_saver") === "true");

  // Data states
  const [posts, setPosts] = useState([]);
  const [storiesGroups, setStoriesGroups] = useState([]);
  const [reels, setReels] = useState([]);

  // Modals
  const [walletOpen, setWalletOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [founderQuestOpen, setFounderQuestOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);
  const [viewingProfileUserId, setViewingProfileUserId] = useState(null);
  const [selectedPostModal, setSelectedPostModal] = useState(null);

  // Global Incoming Call & Message Toast States
  const [globalIncomingCall, setGlobalIncomingCall] = useState(null);
  const [pendingCallAccept, setPendingCallAccept] = useState(null);
  const [messageToast, setMessageToast] = useState(null);

  // Nickname & Coins Approval States (from Founder)
  const [approvedNicknameModal, setApprovedNicknameModal] = useState(null); // { order_id, username }
  const [approvedCoinsModal, setApprovedCoinsModal] = useState(null); // { amount_coins, new_balance }
  const [applyingNickname, setApplyingNickname] = useState(false);

  // Global Realtime WebSocket Listener (Incoming Calls & In-App Chat Messages)
  useEffect(() => {
    const handleWsEvent = (data) => {
      if (!data) return;
      const evt = data.event || data.type || data.signal_type;

      if (evt === "incoming_call") {
        const callerInfo = data.caller || {
          id: data.caller_id,
          username: data.caller_username || "Пользователь",
          first_name: data.caller_name || "Пользователь",
          avatar_url: data.caller_avatar || null
        };
        setGlobalIncomingCall({
          call_id: data.call_id,
          call_type: data.call_type || (data.is_video ? "video" : "audio"),
          caller: callerInfo
        });
        SoundEngine.playRingtone();
        triggerHaptic("heavy");
      } else if (evt === "call_rejected" || evt === "call_ended" || evt === "call_reject" || evt === "call_end") {
        SoundEngine.stopRingtone();
        setGlobalIncomingCall(null);
      } else if (evt === "new_message") {
        if (!chatOpen || activeChatUser?.id !== data.message?.sender_id) {
          SoundEngine.playNotification();
          triggerHaptic("light");
          setMessageToast(data.message);
          setTimeout(() => {
            setMessageToast((current) => (current?.id === data.message?.id ? null : current));
          }, 4500);
        }
      } else if (evt === "nickname_approved") {
        SoundEngine.playFanfare();
        triggerHaptic("heavy");
        setApprovedNicknameModal({
          order_id: data.order_id,
          username: data.username
        });
      } else if (evt === "coins_approved") {
        SoundEngine.playFanfare();
        triggerHaptic("heavy");
        if (typeof data.new_balance === "number") {
          setUser((prev) => (prev ? { ...prev, wallet_coins: data.new_balance } : prev));
        }
        setApprovedCoinsModal({
          amount_coins: data.amount_coins,
          new_balance: data.new_balance
        });
      }
    };

    let unsub = null;
    if (window.__vensto_socket) {
      unsub = window.__vensto_socket.addListener(handleWsEvent);
    } else {
      const checkSock = setInterval(() => {
        if (window.__vensto_socket) {
          unsub = window.__vensto_socket.addListener(handleWsEvent);
          clearInterval(checkSock);
        }
      }, 1000);
      setTimeout(() => clearInterval(checkSock), 10000);
    }

    return () => {
      if (unsub) unsub();
      SoundEngine.stopRingtone();
    };
  }, [chatOpen, activeChatUser]);

  // Periodic poll for incoming call if socket is idle
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      if (globalIncomingCall || chatOpen) return;
      try {
        const res = await Api.get("/chats/call/incoming");
        if (res && res.has_incoming && res.caller) {
          setGlobalIncomingCall({
            call_id: res.call_id,
            call_type: res.call_type || "video",
            caller: res.caller
          });
          SoundEngine.playRingtone();
          triggerHaptic("heavy");
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [user, globalIncomingCall, chatOpen]);

  const handleAcceptGlobalCall = () => {
    if (!globalIncomingCall) return;
    SoundEngine.stopRingtone();
    triggerHaptic("heavy");
    const call = globalIncomingCall;
    setGlobalIncomingCall(null);
    setActiveChatUser(call.caller);
    setPendingCallAccept(call);
    setChatOpen(true);
  };

  const handleDeclineGlobalCall = async () => {
    if (!globalIncomingCall) return;
    SoundEngine.stopRingtone();
    triggerHaptic("medium");
    const call = globalIncomingCall;
    setGlobalIncomingCall(null);
    try {
      await Api.post("/chats/call/reject", { call_id: call.call_id });
    } catch (e) {}
  };

  const handleApplyPurchasedNickname = async () => {
    if (!approvedNicknameModal?.username) return;
    setApplyingNickname(true);
    triggerHaptic("heavy");
    try {
      const res = await Api.post("/marketplace/apply-purchased-nickname", {
        order_id: approvedNicknameModal.order_id,
        username: approvedNicknameModal.username
      });
      SoundEngine.playFanfare();
      setUser((prev) => (prev ? { ...prev, username: res.username, is_verified: true } : prev));
      setApprovedNicknameModal(null);
      alert(`🎉 Поздравляем! Ваш никнейм успешно изменен на @${res.username}!`);
    } catch (err) {
      alert("Ошибка: " + (err.message || "Не удалось применить никнейм"));
    } finally {
      setApplyingNickname(false);
    }
  };

  const handleOpenProfile = (targetUserId) => {
    if (!targetUserId) return;
    if (user && targetUserId === user.id) {
      setActiveTab("profile");
    } else {
      setViewingProfileUserId(targetUserId);
    }
  };

  // Initialize Telegram SDK & Authentication
  useEffect(() => {
    try {
      initTelegramApp();
    } catch (e) {
      console.warn("initTelegramApp error", e);
    }

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("vensto_offline_mode", () => setIsOffline(true));

    authenticateUser();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const authenticateUser = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData;
      let authResult = null;

      if (initData) {
        try {
          authResult = await Api.post("/auth/telegram", { init_data: initData });
        } catch (e) {
          console.warn("Telegram auth API failed, using fallback:", e);
        }
      }

      if (!authResult || !authResult.user) {
        // Fallback for browser preview / local dev or initData mismatch
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const targetTgId = tgUser?.id || 1477103854;
        const targetUsername = tgUser?.username || "oqyolai";
        const targetFirstName = tgUser?.first_name || "Admin";

        try {
          authResult = await Api.post("/auth/dev-login", {
            telegram_id: targetTgId,
            username: targetUsername,
            first_name: targetFirstName,
            last_name: tgUser?.last_name || ""
          });
        } catch (e) {
          console.error("dev-login failed", e);
        }
      }

      if (authResult && authResult.user) {
        Api.setToken(authResult.access_token);
        setUser(authResult.user);
        try {
          if (!window.__vensto_socket) {
            new RealtimeSocket(authResult.access_token);
          }
        } catch (wsErr) {
          console.warn("[App WS Error]", wsErr);
        }
      } else {
        // Safe ultimate fallback user so app never stays blank
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        setUser({
          id: 1,
          telegram_id: tgUser?.id || 1477103854,
          username: tgUser?.username || "oqyolai",
          first_name: tgUser?.first_name || "Vensto",
          last_name: tgUser?.last_name || "Director",
          role: "director",
          wallet_coins: 100000,
          is_verified: true
        });
      }

      // Check if registration / account creation onboarding is needed
      const currentResolvedUser = authResult?.user || tgUser;
      const isDirector = currentResolvedUser?.role === "director" || currentResolvedUser?.telegram_id === 1477103854;
      const resolvedUserId = currentResolvedUser?.id || 1;
      const hasCreated = safeGetItem(`vensto_account_created_${resolvedUserId}`) === "true";
      const hasProfile = Boolean(
        currentResolvedUser?.birth_year &&
        currentResolvedUser?.first_name &&
        currentResolvedUser?.username &&
        !currentResolvedUser.username.startsWith("user_")
      );

      if (isDirector || hasCreated || hasProfile) {
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }

      // Check deep link parameters
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      const startAppParam = urlParams.get("startapp");

      if (tabParam) {
        if (tabParam === "quest" || tabParam === "tab_quest") setFounderQuestOpen(true);
        else setActiveTab(tabParam);
      }
      if (startAppParam) {
        if (startAppParam.startsWith("chat")) setChatOpen(true);
        else if (startAppParam.startsWith("reels")) setActiveTab("reels");
        else if (startAppParam.includes("admin")) setActiveTab("admin");
        else if (startAppParam.startsWith("search")) setActiveTab("search");
        else if (startAppParam.includes("quest")) setFounderQuestOpen(true);
      }

      // Load initial feed & stories & reels
      loadAllContent();

      // Check pending approved nickname claims
      try {
        const claims = await Api.get("/marketplace/pending-claims");
        if (claims?.unapplied_nicknames?.length > 0) {
          setApprovedNicknameModal(claims.unapplied_nicknames[0]);
        }
      } catch (e) {}
    } catch (err) {
      console.error("[Auth Error]", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllContent = async () => {
    try {
      const [feedData, storiesData, reelsData] = await Promise.all([
        Api.get("/posts").catch(() => []),
        Api.get("/stories").catch(() => []),
        Api.get("/reels").catch(() => [])
      ]);
      if (feedData) setPosts(feedData);
      if (storiesData) setStoriesGroups(storiesData);
      if (reelsData) setReels(reelsData);
    } catch (e) {}
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    safeSetItem("vensto_lang", newLang);
  };

  const toggleDataSaver = () => {
    const val = !dataSaver;
    setDataSaver(val);
    safeSetItem("vensto_data_saver", val.toString());
  };

  const handleOpenUserChat = (targetUser) => {
    setActiveChatUser(targetUser);
    setChatOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white select-none">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center font-black text-3xl shadow-2xl shadow-pink-500/40 animate-pulse">
          V
        </div>
        <span className="text-sm text-slate-300 mt-4 font-bold tracking-wider uppercase">
          Venstogram Mini App
        </span>
        <span className="text-[11px] text-pink-400 mt-1 font-semibold animate-pulse">
          Загрузка платформы...
        </span>
      </div>
    );
  }

  // Mandatory initial registration and account creation view
  if (!isRegistered) {
    return (
      <RegistrationModal
        user={user}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onComplete={(updatedUser) => {
          setUser(updatedUser);
          setIsRegistered(true);
          safeSetItem(`vensto_account_created_${updatedUser?.id || user?.id || 1}`, "true");
          loadAllContent();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col select-none">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-600/90 text-white text-[11px] font-bold px-3 py-1 text-center sticky top-0 z-50">
          ⚠️ {t.offlineNotice}
        </div>
      )}

      {/* Top Header */}
      <Header
        user={user}
        t={t}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onOpenCreate={() => setCreatePostOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === "feed" && (
          <div>
            <StoriesBar
              storiesGroups={storiesGroups}
              currentUserId={user?.id}
              t={t}
              onStoryCreated={loadAllContent}
            />
            <FeedView
              posts={posts}
              setPosts={setPosts}
              t={t}
              user={user}
              onOpenProfile={handleOpenProfile}
            />
          </div>
        )}

        {activeTab === "search" && (
          <SearchView
            currentUser={user}
            t={t}
            onOpenChat={handleOpenUserChat}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {activeTab === "reels" && (
          <ReelsView
            reels={reels}
            setReels={setReels}
            t={t}
            user={user}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {activeTab === "marketplace" && (
          <MarketplaceView
            user={user}
            t={t}
            onUpdateUser={(updated) => setUser(updated)}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView
            user={user}
            t={t}
            lang={lang}
            onLanguageChange={handleLanguageChange}
            dataSaver={dataSaver}
            onToggleDataSaver={toggleDataSaver}
            onOpenWallet={() => setWalletOpen(true)}
            onUpdateUser={(updated) => setUser(updated)}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {activeTab === "admin" && (
          <AdminView user={user} t={t} />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        t={t}
        userRole={user?.role}
      />

      {/* Modals */}
      {walletOpen && (
        <WalletModal
          user={user}
          t={t}
          onClose={() => setWalletOpen(false)}
          onUpdateUser={(updated) => setUser(updated)}
        />
      )}

      {createPostOpen && (
        <CreatePostModal
          t={t}
          dataSaver={dataSaver}
          onClose={() => setCreatePostOpen(false)}
          onPostCreated={loadAllContent}
        />
      )}

      {chatOpen && (
        <ChatView
          user={user}
          activeUser={activeChatUser}
          t={t}
          pendingCallAccept={pendingCallAccept}
          onClearPendingCall={() => setPendingCallAccept(null)}
          onOpenProfile={handleOpenProfile}
          onClose={() => {
            setChatOpen(false);
            setActiveChatUser(null);
            setPendingCallAccept(null);
          }}
        />
      )}

      {/* Global In-App Incoming Call Modal */}
      {globalIncomingCall && (
        <div className="fixed inset-0 z-100 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-8 text-white animate-in fade-in select-none">
          {/* Top Info */}
          <div className="w-full flex flex-col items-center pt-8 space-y-2">
            <span className="text-xs uppercase tracking-widest text-pink-400 font-bold animate-pulse">
              {globalIncomingCall.call_type === "video" ? "📹 Входящий видеозвонок" : "📞 Входящий аудиозвонок"}
            </span>
            <p className="text-xs text-slate-400">Venstogram WebRTC HD</p>
          </div>

          {/* Caller Details & Pulsing Rings */}
          <div className="flex flex-col items-center space-y-4 my-auto">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-36 h-36 rounded-full bg-pink-500/20 animate-ping" />
              <div className="absolute w-32 h-32 rounded-full bg-rose-500/30 animate-pulse" />
              {globalIncomingCall.caller?.avatar_url ? (
                <img
                  src={globalIncomingCall.caller.avatar_url}
                  alt={globalIncomingCall.caller.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-pink-500 shadow-2xl z-10 relative"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-3xl font-black border-4 border-white/20 shadow-2xl z-10 relative">
                  {(globalIncomingCall.caller?.first_name || globalIncomingCall.caller?.username || "U")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-black tracking-tight text-white">
                {globalIncomingCall.caller?.first_name || `@${globalIncomingCall.caller?.username}`}
              </h3>
              <p className="text-sm font-semibold text-pink-400 mt-0.5">
                @{globalIncomingCall.caller?.username}
              </p>
            </div>
          </div>

          {/* Accept / Decline Buttons */}
          <div className="w-full max-w-xs flex items-center justify-around pb-10">
            {/* Decline */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={handleDeclineGlobalCall}
                className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center text-3xl shadow-2xl shadow-rose-600/50 transition"
              >
                ✕
              </button>
              <span className="text-xs text-slate-300 font-semibold">Отклонить</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={handleAcceptGlobalCall}
                className="w-18 h-18 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-white flex items-center justify-center text-3xl shadow-2xl shadow-emerald-500/50 transition animate-bounce"
              >
                {globalIncomingCall.call_type === "video" ? "📹" : "📞"}
              </button>
              <span className="text-xs text-emerald-400 font-bold">Принять</span>
            </div>
          </div>
        </div>
      )}

      {/* In-App Floating Message Toast */}
      {messageToast && !chatOpen && (
        <div
          onClick={() => {
            const partner = messageToast.sender;
            setMessageToast(null);
            handleOpenUserChat(partner);
          }}
          className="fixed top-4 left-4 right-4 z-90 bg-slate-900/95 border border-pink-500/50 rounded-2xl p-3 shadow-2xl shadow-pink-500/20 backdrop-blur-md flex items-center space-x-3 cursor-pointer active:scale-98 transition transform animate-in slide-in-from-top duration-300"
        >
          {messageToast.sender?.avatar_url ? (
            <img
              src={messageToast.sender.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-pink-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white text-sm">
              {(messageToast.sender?.first_name || messageToast.sender?.username || "U")[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white truncate">
                {messageToast.sender?.first_name || `@${messageToast.sender?.username}`}
              </h4>
              <span className="text-[10px] text-pink-400 font-bold">Чат</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {messageToast.media_type === "voice" ? "🎤 Голосовое сообщение" : (messageToast.content || "Новое сообщение")}
            </p>
          </div>
        </div>
      )}

      {founderQuestOpen && (
        <FounderQuestModal
          user={user}
          onClose={() => setFounderQuestOpen(false)}
          onUserUpdated={(updated) => setUser(updated)}
        />
      )}

      {viewingProfileUserId && (
        <UserProfileModal
          userId={viewingProfileUserId}
          currentUser={user}
          t={t}
          onClose={() => setViewingProfileUserId(null)}
          onOpenChat={(chatPartner) => {
            handleOpenUserChat(chatPartner);
          }}
          onSelectPost={(post) => setSelectedPostModal(post)}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {selectedPostModal && (
        <PostModal
          post={selectedPostModal}
          currentUser={user}
          t={t}
          onClose={() => setSelectedPostModal(null)}
          onOpenChat={handleOpenUserChat}
        />
      )}

      {/* Approved Nickname Claim Modal */}
      {approvedNicknameModal && (
        <div className="fixed inset-0 z-100 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl shadow-amber-500/20">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/30">
              👑
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Подтверждено Основателем
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Ваш никнейм готов!
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Основатель подтвердил вашу оплату за никнейм:
              </p>
              <div className="mt-2 bg-slate-950 border border-amber-500/40 rounded-2xl py-2 px-3 text-base font-black text-amber-300">
                @{approvedNicknameModal.username}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Нажимая эту кнопку, название вашего профиля сменится на <b className="text-white">@{approvedNicknameModal.username}</b>.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleApplyPurchasedNickname}
                disabled={applyingNickname}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition"
              >
                {applyingNickname ? "Обновление профиля..." : `Сменить никнейм на @${approvedNicknameModal.username}`}
              </button>
              <button
                onClick={() => setApprovedNicknameModal(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-white font-medium"
              >
                Применить позже
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approved Coins Modal */}
      {approvedCoinsModal && (
        <div className="fixed inset-0 z-100 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl shadow-emerald-500/20">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
              🪙
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Баланс пополнен!
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                +{approvedCoinsModal.amount_coins?.toLocaleString()} Vensto Coins
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Основатель подтвердил вашу квитанцию об оплате. Монеты успешно начислены на ваш баланс кошелька.
              </p>
              {typeof approvedCoinsModal.new_balance === "number" && (
                <div className="mt-2 bg-slate-950 border border-slate-800 rounded-2xl py-2 px-3 text-xs text-slate-300">
                  Текущий баланс: <b className="text-amber-400 font-bold">{approvedCoinsModal.new_balance?.toLocaleString()} 🪙</b>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                triggerHaptic("light");
                setApprovedCoinsModal(null);
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition"
            >
              Отлично
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
