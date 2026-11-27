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
import { NotificationsModal } from "./components/NotificationsModal.jsx";
import { EmailAuthModal } from "./components/EmailAuthModal.jsx";

export function App() {
  const safeGetItem = (k) => { try { return localStorage.getItem(k); } catch(e) { return null; } };
  const safeSetItem = (k, v) => { try { localStorage.setItem(k, v); } catch(e) {} };
  const safeRemoveItem = (k) => { try { localStorage.removeItem(k); } catch(e) {} };

  const [lang, setLang] = useState(getInitialLanguage());
  const t = translations[lang] || translations.ru;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [dataSaver, setDataSaver] = useState(safeGetItem("vensto_data_saver") === "true");

  // Content state
  const [posts, setPosts] = useState([]);
  const [storiesGroups, setStoriesGroups] = useState([]);
  const [reels, setReels] = useState([]);

  // Theme: Ultra-Modern Clean White Theme with Crisp Black Text
  const theme = "light";
  const toggleTheme = () => {};

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#0f172a";
      try {
        localStorage.setItem("vensto_theme", "light");
      } catch (e) {}
    }
  }, []);

  // Modals
  const [walletOpen, setWalletOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [founderQuestOpen, setFounderQuestOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);
  const [viewingProfileUserId, setViewingProfileUserId] = useState(null);
  const [selectedPostModal, setSelectedPostModal] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [emailAuthOpen, setEmailAuthOpen] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState("login");

  const handleLogout = () => {
    if (!confirm("Вы уверены, что хотите выйти из профиля?")) return;
    triggerHaptic("heavy");
    try {
      localStorage.removeItem("vensto_token");
      if (user?.id) {
        localStorage.removeItem(`vensto_account_created_${user.id}`);
      }
    } catch (e) {}
    Api.setToken("");
    setUser(null);
    setIsRegistered(false);
    setEmailAuthOpen(true);
  };

  // Sync unread notifications count
  useEffect(() => {
    if (user?.id) {
      Api.get("/users/notifications?limit=1")
        .then((res) => {
          if (res && typeof res.unread_count === "number") {
            setUnreadNotificationsCount(res.unread_count);
          }
        })
        .catch(() => {});
    }
  }, [user?.id, notificationsOpen]);

  // Message Toast State
  const [messageToast, setMessageToast] = useState(null);

  // Nickname & Coins Approval States (from Founder)
  const [approvedNicknameModal, setApprovedNicknameModal] = useState(null); // { order_id, username }
  const [approvedCoinsModal, setApprovedCoinsModal] = useState(null); // { amount_coins, new_balance }
  const [applyingNickname, setApplyingNickname] = useState(false);

  // Global Realtime WebSocket Listener (In-App Chat Messages & Approvals)
  useEffect(() => {
    const handleWsEvent = (data) => {
      if (!data) return;
      const evt = data.event || data.type;

      if (evt === "new_message") {
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
    };
  }, [chatOpen, activeChatUser]);

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

  // Move authenticateUser declaration before useEffect so it is never accessed before initialization
  const authenticateUser = async () => {
    try {
      let activeSessionUser = null;
      const currentTgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const currentTgId = currentTgUser?.id ? Number(currentTgUser.id) : null;
      const initData = window.Telegram?.WebApp?.initData;

      // 0. Instant offline/cached user restoration with account-switch check
      const cachedUserStr = safeGetItem("vensto_cached_user");
      let cachedUser = null;
      if (cachedUserStr) {
        try {
          cachedUser = JSON.parse(cachedUserStr);
        } catch (e) {}
      }

      // If user switched accounts in Telegram, wipe credentials of the other account!
      const cachedTgId = cachedUser?.telegram_id ? Number(cachedUser.telegram_id) : null;
      if (currentTgId && cachedTgId && cachedTgId !== currentTgId) {
        console.log(`[Vensto Auth] Account switch: current TG ${currentTgId} != cached TG ${cachedTgId}. Resetting storage.`);
        safeRemoveItem("vensto_token");
        safeRemoveItem("vensto_cached_user");
        Api.setToken("");
        cachedUser = null;
      }

      if (cachedUser && cachedUser.id) {
        if (Number(cachedUser.telegram_id) !== 1477103854 && cachedUser.role === "director") {
          cachedUser.role = "user";
        }
        activeSessionUser = cachedUser;
        setUser(cachedUser);
        const resolvedUserId = cachedUser.id || 1;
        const hasCreated = safeGetItem(`vensto_account_created_${resolvedUserId}`) === "true";
        const isDirector = Number(cachedUser.telegram_id) === 1477103854;
        setIsRegistered(isDirector || hasCreated || Boolean(cachedUser.is_registered));
      }

      // 1. Check saved session JWT token from localStorage
      const savedToken = safeGetItem("vensto_token");
      if (savedToken && !activeSessionUser) {
        try {
          Api.setToken(savedToken);
          const me = await Api.get("/auth/me");
          if (me && me.id) {
            const meTgId = me.telegram_id ? Number(me.telegram_id) : null;
            if (currentTgId && meTgId && meTgId !== currentTgId) {
              console.warn(`[Vensto Auth] Token mismatch: belongs to ${meTgId}, but current TG is ${currentTgId}. Resetting.`);
              safeRemoveItem("vensto_token");
              safeRemoveItem("vensto_cached_user");
              Api.setToken("");
              activeSessionUser = null;
            } else {
              if (meTgId !== 1477103854 && me.role === "director") {
                me.role = "user";
              }
              activeSessionUser = me;
              safeSetItem("vensto_cached_user", JSON.stringify(me));
              setUser(me);
              try {
                if (!window.__vensto_socket) {
                  new RealtimeSocket(savedToken);
                }
              } catch (wsErr) {}
            }
          }
        } catch (meErr) {
          const status = meErr?.status;
          if (status === 401 || status === 403) {
            console.warn("[Session token invalid or expired]", meErr);
            safeRemoveItem("vensto_token");
            safeRemoveItem("vensto_cached_user");
            Api.setToken("");
            activeSessionUser = null;
          } else {
            console.warn("[Server network error or cold start, preserving existing session]", meErr);
          }
        }
      }

      // 2. Try Telegram WebApp initData HMAC authentication if no active user session
      if (!activeSessionUser) {
        if (initData) {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const authResult = await Api.post("/auth/telegram", { init_data: initData });
              if (authResult && authResult.user) {
                const authedUser = authResult.user;
                if (Number(authedUser.telegram_id) !== 1477103854 && authedUser.role === "director") {
                  authedUser.role = "user";
                }
                Api.setToken(authResult.access_token);
                safeSetItem("vensto_token", authResult.access_token);
                safeSetItem("vensto_cached_user", JSON.stringify(authedUser));
                activeSessionUser = authedUser;
                setUser(authedUser);
                try {
                  if (!window.__vensto_socket) {
                    new RealtimeSocket(authResult.access_token);
                  }
                } catch (wsErr) {}
                break;
              }
            } catch (e) {
              console.warn(`Telegram auth attempt ${attempt + 1} failed:`, e);
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 1200));
              }
            }
          }
        }
      }

      // 3. Handle registration resolution
      if (activeSessionUser) {
        if (Number(activeSessionUser.telegram_id) !== 1477103854 && activeSessionUser.role === "director") {
          activeSessionUser.role = "user";
        }
        setUser(activeSessionUser);
        safeSetItem("vensto_cached_user", JSON.stringify(activeSessionUser));
        const isDirector = Number(activeSessionUser.telegram_id) === 1477103854;
        const resolvedUserId = activeSessionUser.id || 1;
        const hasCreated = safeGetItem(`vensto_account_created_${resolvedUserId}`) === "true";
        const hasProfile = Boolean(
          activeSessionUser.birth_year &&
          activeSessionUser.first_name &&
          activeSessionUser.username &&
          typeof activeSessionUser.username === "string" &&
          !activeSessionUser.username.startsWith("user_")
        );
        const registered = isDirector || hasCreated || Boolean(activeSessionUser.is_registered) || hasProfile;
        if (registered) {
          safeSetItem(`vensto_account_created_${resolvedUserId}`, "true");
        }
        setIsRegistered(registered);
      } else {
        // If inside Telegram WebApp and network timed out, don't force email modal or false registration
        const isTelegram = Boolean(window.Telegram?.WebApp?.initData);
        if (!isTelegram) {
          setUser(null);
          setIsRegistered(false);
          setEmailAuthOpen(true);
        }
      }

      // Check deep link parameters
      const urlParams = new URLSearchParams(typeof window !== "undefined" && window.location?.search ? window.location.search : "");
      const tabParam = urlParams.get("tab");
      const startAppParam = urlParams.get("startapp");

      if (tabParam) {
        if (tabParam === "quest" || tabParam === "tab_quest") setFounderQuestOpen(true);
        else if (tabParam === "admin") {
          if (Number(activeSessionUser?.telegram_id) === 1477103854) setActiveTab("admin");
          else setActiveTab("feed");
        }
        else setActiveTab(tabParam);
      }
      if (startAppParam) {
        if (startAppParam.startsWith("chat")) {
          setChatOpen(true);
          const pMatch = startAppParam.match(/^chat_(\d+)$/);
          if (pMatch) {
            const partnerId = Number(pMatch[1]);
            Api.get(`/users/${partnerId}`).then((u) => {
              if (u && u.id) setActiveChatUser(u);
            }).catch(() => {});
          }
        }
        else if (startAppParam.startsWith("reels")) setActiveTab("reels");
        else if (startAppParam.includes("admin")) {
          if (Number(activeSessionUser?.telegram_id) === 1477103854) setActiveTab("admin");
          else setActiveTab("feed");
        }
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
      console.error("[authenticateUser fatal error]", err);
      setUser(null);
      setIsRegistered(false);
      setEmailAuthOpen(true);
    } finally {
      setLoading(false);
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

  const handlePostCreated = (newPost, newReel) => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev]);
    }
    if (newReel) {
      setReels((prev) => [newReel, ...prev]);
    }
    loadAllContent();
  };

  useEffect(() => {
    if (activeTab === "reels") {
      Api.get("/reels").then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setReels(data);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    safeSetItem("vensto_lang", newLang);
    if (user?.id) {
      Api.patch("/users/me", { language_code: newLang }).catch(() => {});
    }
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <RegistrationModal
          user={user}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          onOpenEmailAuth={(mode = "login") => {
            setEmailAuthMode(mode);
            setEmailAuthOpen(true);
          }}
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            setIsRegistered(true);
            safeSetItem(`vensto_account_created_${updatedUser?.id || user?.id || 1}`, "true");
            loadAllContent();
          }}
        />
        {emailAuthOpen && (
          <EmailAuthModal
            initialMode={emailAuthMode}
            onClose={() => setEmailAuthOpen(false)}
            onAuthSuccess={(u) => {
              setUser(u);
              setIsRegistered(true);
              safeSetItem(`vensto_account_created_${u?.id || 1}`, "true");
              setEmailAuthOpen(false);
              loadAllContent();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col select-none">
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
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onOpenEmailAuth={() => setEmailAuthOpen(true)}
        onLanguageChange={handleLanguageChange}
        onOpenCreate={() => setCreatePostOpen(true)}
        onOpenChat={(targetUser) => {
          if (targetUser && targetUser.id) {
            handleOpenUserChat(targetUser);
          } else {
            setChatOpen(true);
          }
        }}
        onOpenNotifications={() => setNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
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
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onOpenEmailAuth={() => setEmailAuthOpen(true)}
            onLanguageChange={handleLanguageChange}
            dataSaver={dataSaver}
            onToggleDataSaver={toggleDataSaver}
            onOpenWallet={() => setWalletOpen(true)}
            onUpdateUser={(updated) => setUser(updated)}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {activeTab === "admin" && (
          Number(user?.telegram_id) === 1477103854 ? (
            <AdminView user={user} t={t} />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
              <span className="text-4xl mb-3">⛔</span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Доступ ограничен</h2>
              <p className="text-sm text-slate-500 mt-2">Панель управления доступна только Главному Администратору.</p>
            </div>
          )
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        t={t}
        userRole={user?.role}
        telegramId={user?.telegram_id ? Number(user.telegram_id) : null}
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
          onPostCreated={handlePostCreated}
        />
      )}

      {chatOpen && (
        <ChatView
          user={user}
          activeUser={activeChatUser}
          t={t}
          onOpenProfile={handleOpenProfile}
          onClose={() => {
            setChatOpen(false);
            setActiveChatUser(null);
          }}
        />
      )}

      {notificationsOpen && (
        <NotificationsModal
          onClose={() => setNotificationsOpen(false)}
          onOpenProfile={handleOpenProfile}
          onUnreadCountChanged={(count) => setUnreadNotificationsCount(count)}
        />
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
          onPostDeleted={(deletedId) => {
            setSelectedPostModal(null);
            setPosts((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== deletedId) : []));
            setReels((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== deletedId) : []));
            triggerHaptic("success");
          }}
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

      {/* Email Login & Password Recovery Modal */}
      {emailAuthOpen && (
        <EmailAuthModal
          initialMode={emailAuthMode}
          onClose={() => setEmailAuthOpen(false)}
          onAuthSuccess={(u) => {
            setUser(u);
            setIsRegistered(true);
            safeSetItem(`vensto_account_created_${u?.id || 1}`, "true");
            safeSetItem("vensto_cached_user", JSON.stringify(u));
            setEmailAuthOpen(false);
            loadAllContent();
          }}
        />
      )}
    </div>
  );
}
