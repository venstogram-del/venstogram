import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function AdminView({ user, t }) {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coinOrders, setCoinOrders] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("orders"); // orders, coin_orders, users, director, moderator, it
  
  // Receipt modal preview
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);

  // User management state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [userCoinsInput, setUserCoinsInput] = useState({});
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // Policies and Management Authority state
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyKey, setSelectedPolicyKey] = useState("username_terms");
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [reclaimTarget, setReclaimTarget] = useState("");
  const [reclaiming, setReclaiming] = useState(false);

  // Ads management state
  const [ads, setAds] = useState([]);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adTargetUrl, setAdTargetUrl] = useState("");
  const [adCtaText, setAdCtaText] = useState("Перейти ↗");
  const [adAdvertiser, setAdAdvertiser] = useState("");
  const [adBudget, setAdBudget] = useState("100");
  const [savingAd, setSavingAd] = useState(false);

  // Gift username for free state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTargetUser, setGiftTargetUser] = useState(null);
  const [giftTargetInput, setGiftTargetInput] = useState("");
  const [giftUsernameInput, setGiftUsernameInput] = useState("");
  const [giftingUsername, setGiftingUsername] = useState(false);
  const [reservedUsernames, setReservedUsernames] = useState([]);

  useEffect(() => {
    loadOverview();
    loadOrders();
    loadCoinOrders();
    loadReports();
    loadAuditLogs();
    loadPolicies();
    loadAds();
    loadReservedUsernames();
  }, []);

  const loadReservedUsernames = async () => {
    try {
      const data = await Api.get("/admin/reserved-usernames");
      setReservedUsernames(data || []);
    } catch (e) {}
  };

  const loadAds = async () => {
    try {
      const data = await Api.get("/admin/ads");
      setAds(data || []);
    } catch (e) {}
  };

  const loadOverview = async () => {
    try {
      const data = await Api.get("/admin/overview");
      setOverview(data);
    } catch (e) {}
  };

  const loadOrders = async () => {
    try {
      const data = await Api.get("/admin/username-orders");
      setOrders(data || []);
    } catch (e) {}
  };

  const loadCoinOrders = async () => {
    try {
      const data = await Api.get("/admin/coin-orders?status=pending");
      setCoinOrders(data || []);
    } catch (e) {}
  };

  const handleCoinOrderAction = async (orderId, action) => {
    let reason = "";
    if (action === "reject") {
      reason = prompt("Укажите причину отклонения заявки:", "Оплата не поступила или чек недействителен");
      if (reason === null) return;
    }
    triggerHaptic(action === "approve" ? "heavy" : "medium");
    if (action === "approve") SoundEngine.playFanfare();

    try {
      const res = await Api.post(`/admin/coin-orders/${orderId}/${action}`, { reason });
      alert(res.message);
      loadCoinOrders();
      loadOverview();
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  const loadReports = async () => {
    try {
      const data = await Api.get("/admin/reports");
      setReports(data || []);
    } catch (e) {}
  };

  const loadAuditLogs = async () => {
    try {
      const data = await Api.get("/admin/audit-logs");
      setAuditLogs(data || []);
    } catch (e) {}
  };

  const loadPolicies = async () => {
    try {
      const data = await Api.get("/admin/policies");
      setPolicies(data || []);
      if (data && data.length > 0) {
        const current = data.find((p) => p.key === selectedPolicyKey) || data[0];
        setSelectedPolicyKey(current.key);
        setPolicyTitle(current.title || "");
        setPolicyContent(current.content || "");
      }
    } catch (e) {}
  };

  const handleSelectPolicyKey = (key) => {
    setSelectedPolicyKey(key);
    const p = policies.find((item) => item.key === key);
    if (p) {
      setPolicyTitle(p.title || "");
      setPolicyContent(p.content || "");
    }
  };

  const handleSavePolicy = async () => {
    if (!policyContent.trim()) {
      alert("Текст регламента не может быть пустым!");
      return;
    }
    setSavingPolicy(true);
    triggerHaptic("heavy");
    SoundEngine.playFanfare();
    try {
      const res = await Api.post("/admin/policies", {
        key: selectedPolicyKey,
        title: policyTitle,
        content: policyContent
      });
      alert(res.message);
      loadPolicies();
    } catch (err) {
      alert("Ошибка сохранения регламента: " + err.message);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleReclaimUsername = async (targetUsername) => {
    const cleanName = (targetUsername || reclaimTarget).trim().replace(/^@/, "");
    if (!cleanName) {
      alert("Введите никнейм для изъятия!");
      return;
    }
    if (
      !confirm(
        `Вы действительно хотите изъять юзернейм @${cleanName} в фонд платформы и вернуть его на продажу в Маркетплейс?`
      )
    ) {
      return;
    }
    setReclaiming(true);
    triggerHaptic("heavy");
    try {
      const res = await Api.post(`/admin/usernames/${cleanName}/reclaim`, {
        reason: "Решение Руководства платформы по пересмотру владения юзернеймом"
      });
      alert(res.message);
      setReclaimTarget("");
      loadOrders();
      if (selectedUserDetail) {
        setSelectedUserDetail(null);
      }
    } catch (err) {
      alert("Ошибка изъятия: " + err.message);
    } finally {
      setReclaiming(false);
    }
  };

  const handleOrderAction = async (orderId, action) => {
    triggerHaptic(action === "approve" ? "heavy" : "medium");
    if (action === "approve") {
      SoundEngine.playFanfare();
    }

    try {
      const res = await Api.post("/admin/username-orders/action", {
        order_id: orderId,
        action: action
      });
      alert(res.message);
      loadOrders();
      loadOverview();
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  const handleSearchUsers = async (q) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setSearchedUsers([]);
      return;
    }
    try {
      const res = await Api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchedUsers(res || []);
    } catch (e) {}
  };

  const handleToggleVerified = async (targetUserId) => {
    triggerHaptic("medium");
    try {
      const res = await Api.post(`/admin/users/${targetUserId}/badge`, {});
      alert(res.message);
      handleSearchUsers(userSearchQuery);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCoins = async (targetUserId) => {
    const amount = parseInt(userCoinsInput[targetUserId] || 1000);
    triggerHaptic("medium");
    try {
      const res = await Api.post(`/admin/users/${targetUserId}/coins`, { amount });
      alert(res.message);
      handleSearchUsers(userSearchQuery);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleBan = async (targetUserId, currentlyBanned) => {
    triggerHaptic("heavy");
    let reason = "Нарушение правил платформы / фальшивый чек";
    if (!currentlyBanned) {
      const inputReason = prompt("Укажите причину блокировки:", "Фальшивый чек / Нарушение законов РУз");
      if (inputReason === null) return;
      if (inputReason.trim()) reason = inputReason.trim();
    }
    try {
      const res = await Api.post(`/admin/users/${targetUserId}/ban`, { reason });
      alert(res.message);
      handleSearchUsers(userSearchQuery);
      if (selectedUserDetail && selectedUserDetail.user?.id === targetUserId) {
        handleViewUserDetails(targetUserId);
      }
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  const handleViewUserDetails = async (targetUserId) => {
    triggerHaptic("light");
    setLoadingUserDetail(true);
    try {
      const data = await Api.get(`/admin/users/${targetUserId}/details`);
      setSelectedUserDetail(data);
    } catch (err) {
      alert("Ошибка загрузки профиля: " + err.message);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleClearAllReports = async () => {
    if (!confirm("Очистить все жалобы в очереди?")) return;
    triggerHaptic("heavy");
    try {
      const res = await Api.post("/admin/reports/clear-all", {});
      alert(res.message);
      loadReports();
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!adTitle.trim() || !adTargetUrl.trim()) {
      alert("Укажите заголовок и ссылку рекламной кампании!");
      return;
    }
    setSavingAd(true);
    triggerHaptic("heavy");
    try {
      const res = await Api.post("/admin/ads", {
        title: adTitle.trim(),
        description: adDescription.trim(),
        image_url: adImageUrl.trim() || undefined,
        target_url: adTargetUrl.trim(),
        cta_text: adCtaText.trim() || "Перейти ↗",
        advertiser_name: adAdvertiser.trim() || "Sponsor",
        budget_usd: parseFloat(adBudget) || 100
      });
      alert(res.message || "Рекламная кампания создана!");
      setShowCreateAdModal(false);
      setAdTitle("");
      setAdDescription("");
      setAdImageUrl("");
      setAdTargetUrl("");
      loadAds();
    } catch (err) {
      alert("Ошибка создания рекламы: " + err.message);
    } finally {
      setSavingAd(false);
    }
  };

  const handleToggleAd = async (adId) => {
    triggerHaptic("medium");
    try {
      const res = await Api.post(`/admin/ads/${adId}/toggle`, {});
      alert(res.message);
      loadAds();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!confirm("Удалить эту рекламную кампанию?")) return;
    triggerHaptic("heavy");
    try {
      const res = await Api.delete(`/admin/ads/${adId}`);
      alert(res.message);
      loadAds();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleIssueWarning = async (targetUserId) => {
    const reason = prompt(
      "Укажите причину предупреждения / страйка (нарушение ст. 130 УК РУз, спам, токсичность):",
      "Нарушение правил сообщества и законодательства Республики Узбекистан"
    );
    if (!reason || !reason.trim()) return;
    triggerHaptic("heavy");
    try {
      const res = await Api.post(`/admin/users/${targetUserId}/warn`, {
        reason: reason.trim()
      });
      alert(res.message);
      handleSearchUsers(userSearchQuery);
      if (selectedUserDetail && selectedUserDetail.user?.id === targetUserId) {
        handleViewUserDetails(targetUserId);
      }
    } catch (err) {
      alert("Ошибка выдачи страйка: " + err.message);
    }
  };

  const handleGiftUsername = async (e) => {
    if (e) e.preventDefault();
    const desiredName = giftUsernameInput.trim().replace(/^@/, "");
    if (!desiredName) {
      alert("Введите никнейм, который хотите подарить!");
      return;
    }
    const targetId = giftTargetUser?.id;
    const targetUName = giftTargetInput.trim().replace(/^@/, "");
    if (!targetId && !targetUName) {
      alert("Укажите кому подарить (ID или текущий никнейм пользователя)!");
      return;
    }

    setGiftingUsername(true);
    triggerHaptic("heavy");
    try {
      const res = await Api.post("/admin/usernames/gift", {
        target_user_id: targetId,
        target_username: targetUName || undefined,
        gifted_username: desiredName
      });
      SoundEngine.playFanfare();
      alert(res.message);
      setShowGiftModal(false);
      setGiftUsernameInput("");
      setGiftTargetUser(null);
      setGiftTargetInput("");
      handleSearchUsers(userSearchQuery);
      if (selectedUserDetail) {
        handleViewUserDetails(selectedUserDetail.user?.id || selectedUserDetail.id);
      }
    } catch (err) {
      alert("Ошибка подарка никнейма: " + err.message);
    } finally {
      setGiftingUsername(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-amber-600/30 via-pink-600/20 to-purple-600/30 border border-amber-500/40 rounded-3xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">
            Кабинет Руководства & Управления
          </span>
          <h2 className="text-base font-black text-white mt-0.5">
            Панель Администратора Venstogram
          </h2>
          <span className="text-xs text-slate-300">
            Директор: <b className="text-amber-300">@{user?.username || "admin"} (ID: {user?.telegram_id || 1477103854})</b>
          </span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shadow-lg">
          👑
        </div>
      </div>

      {/* Visitors & Real-Time Online Activity Card ("Сколько человек зашло") */}
      {overview?.kpi && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Посещаемость платформы (Сколько человек зашло)
              </h3>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              Live мониторинг
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">🟢 Онлайн сейчас</span>
              <span className="text-xl font-black text-emerald-400">
                {(overview.kpi.online_now || 1).toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">в приложении</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">📅 Зашли сегодня</span>
              <span className="text-xl font-black text-indigo-400">
                {(overview.kpi.active_today || 1).toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">уникальных за 24ч</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">👤 Всего аккаунтов</span>
              <span className="text-xl font-black text-white">
                {(overview.kpi.total_users || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">зарегистрировано</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">✨ Новых за сутки</span>
              <span className="text-xl font-black text-amber-400">
                {(overview.kpi.new_users_today || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">регистраций</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar space-x-1">
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("orders");
            loadOrders();
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${
            activeSubTab === "orders" ? "bg-amber-500 text-slate-950 font-black shadow-md" : "text-slate-400"
          }`}
        >
          <span>🧾 Заявки на никнеймы</span>
          {orders.length > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {orders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("coin_orders");
            loadCoinOrders();
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${
            activeSubTab === "coin_orders" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400"
          }`}
        >
          <span>💰 Заявки на монеты</span>
          {coinOrders.length > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {coinOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("reserved");
            loadReservedUsernames();
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${
            activeSubTab === "reserved" ? "bg-amber-500 text-slate-950 font-black shadow-md" : "text-slate-400"
          }`}
        >
          <span>👑 Резерв Директора ({reservedUsernames.length || 7})</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("users");
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all ${
            activeSubTab === "users" ? "bg-sky-500 text-slate-950 font-black shadow-md" : "text-slate-400"
          }`}
        >
          👥 Пользователи
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("ads");
            loadAds();
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${
            activeSubTab === "ads" ? "bg-indigo-600 text-white font-black shadow-md" : "text-slate-400"
          }`}
        >
          <span>📢 Реклама</span>
          {ads.length > 0 && (
            <span className="bg-indigo-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {ads.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("policies");
            loadPolicies();
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${
            activeSubTab === "policies" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400"
          }`}
        >
          <span>📜 Регламент и Условия</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("director");
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all ${
            activeSubTab === "director" ? "bg-purple-600 text-white shadow-md" : "text-slate-400"
          }`}
        >
          💼 Статистика
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("moderator");
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all ${
            activeSubTab === "moderator" ? "bg-rose-600 text-white shadow-md" : "text-slate-400"
          }`}
        >
          ⚖️ Жалобы ({reports.length})
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("it");
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all ${
            activeSubTab === "it" ? "bg-blue-600 text-white shadow-md" : "text-slate-400"
          }`}
        >
          ⚙️ Сервер
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveSubTab("security");
            loadAuditLogs();
          }}
          className={`py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${
            activeSubTab === "security" ? "bg-rose-600 text-white font-black shadow-md" : "text-slate-400"
          }`}
        >
          <span>🛡️ Безопасность</span>
          {auditLogs.filter(l => l.action === "security_ban").length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {auditLogs.filter(l => l.action === "security_ban").length}
            </span>
          )}
        </button>
      </div>

      {/* Orders Tab: Username Purchase Receipts Queue */}
      {activeSubTab === "orders" && (
        <div className="space-y-3">
          {/* Download Excel Registry Button */}
          <a
            href="/api/admin/buyers/excel"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-2.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all text-center"
          >
            <span>📥 Скачать Excel-реестр покупателей (.xlsx)</span>
          </a>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300">
              Ожидают подтверждения чека: {orders.length}
            </span>
            <button
              onClick={loadOrders}
              className="text-[11px] text-pink-400 font-bold hover:underline"
            >
              🔄 Обновить
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
              <span className="text-3xl block mb-2">🎉</span>
              Все заявки на покупку никнеймов обработаны! Новых заявок нет.
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-4 space-y-3 shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black text-white">
                        @{ord.username || ord.desired_username}
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        ${ord.price_usd?.toLocaleString() || 500}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Покупатель: <b className="text-pink-400">@{ord.buyer?.username}</b> ({ord.buyer?.first_name} {ord.buyer?.last_name || ""})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Telegram ID: {ord.buyer?.telegram_id}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-700/50 px-2 py-1 rounded-lg font-bold">
                      В ожидании
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {new Date(ord.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Receipt Screenshot Box */}
                {(ord.receipt_url || ord.screenshot_url) && (
                  <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Скриншот чека об оплате:
                    </span>
                    <div
                      onClick={() => setPreviewReceiptUrl(ord.receipt_url || ord.screenshot_url)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden bg-black h-36 flex items-center justify-center border border-slate-700 hover:border-pink-500 transition-colors"
                    >
                      <img
                        src={ord.receipt_url || ord.screenshot_url}
                        alt="Чек"
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-opacity">
                        🔍 Нажмите для увеличения
                      </div>
                    </div>
                  </div>
                )}

                {ord.notes && (
                  <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-xl">
                    <span className="text-slate-400 font-semibold">Заметка: </span>
                    {ord.notes}
                  </div>
                )}

                {/* Action Buttons: Approve / Reject */}
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => handleOrderAction(ord.id, "reject")}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-all"
                  >
                    ✕ Отклонить
                  </button>

                  <button
                    onClick={() => handleOrderAction(ord.id, "approve")}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1"
                  >
                    <span>✓ Одобрить и передать</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Coin Orders Management Tab */}
      {activeSubTab === "coin_orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300">
              Заявки на покупку монет: {coinOrders.length}
            </span>
            <button
              onClick={loadCoinOrders}
              className="text-[11px] text-pink-400 font-bold hover:underline"
            >
              🔄 Обновить
            </button>
          </div>

          {coinOrders.length === 0 ? (
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
              <span className="text-3xl block mb-2">🎉</span>
              Все заявки на покупку монет проверены и обработаны! Новых заявок нет.
            </div>
          ) : (
            coinOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-4 space-y-3 shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black text-white">
                        +{ord.amount_coins?.toLocaleString()} 🪙
                      </span>
                      <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        {ord.amount_uzs?.toLocaleString()} сум
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full uppercase font-bold">
                        {ord.payment_method}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Пользователь: <b className="text-pink-400">@{ord.user?.username}</b> ({ord.user?.first_name} {ord.user?.last_name || ""})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Telegram ID: {ord.user?.telegram_id}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-700/50 px-2 py-1 rounded-lg font-bold">
                      В ожидании проверки
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {ord.created_at ? new Date(ord.created_at).toLocaleTimeString() : ""}
                    </span>
                  </div>
                </div>

                {/* Receipt Preview if available */}
                {ord.receipt_url && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                      <span>🧾</span>
                      <span>Чек об оплате:</span>
                    </span>
                    <div
                      onClick={() => setPreviewReceiptUrl(ord.receipt_url)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden bg-black h-36 flex items-center justify-center border border-slate-700 hover:border-emerald-500 transition-colors"
                    >
                      <img
                        src={ord.receipt_url}
                        alt="Чек"
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-opacity">
                        🔍 Нажмите для увеличения
                      </div>
                    </div>
                  </div>
                )}

                {ord.note && (
                  <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-xl">
                    <span className="text-slate-400 font-semibold">Примечание: </span>
                    {ord.note}
                  </div>
                )}

                {/* Action Buttons: Approve / Reject */}
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => handleCoinOrderAction(ord.id, "reject")}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-all"
                  >
                    ✕ Отклонить
                  </button>

                  <button
                    onClick={() => handleCoinOrderAction(ord.id, "approve")}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1"
                  >
                    <span>✓ Начислить {ord.amount_coins?.toLocaleString()} 🪙</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reserved Director's Usernames Tab */}
      {activeSubTab === "reserved" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 p-4 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👑</span>
              <div>
                <h4 className="text-sm font-black text-amber-300">Золотой резерв Основателя / Директора</h4>
                <p className="text-[11px] text-slate-300">
                  Эти эксклюзивные никнеймы <b>запрещены к продаже</b> в маркетплейсе. Они находятся в личном резерве Директора и могут быть только <b>вручены в подарок</b> избранным пользователям.
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-amber-200">
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">🔒 Не продаются</span>
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">🎁 Доступны для подарка</span>
              <span className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">⭐ Telegram бот: /reserved</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(reservedUsernames && reservedUsernames.length > 0
              ? reservedUsernames
              : [
                  { username: "sherzodbek", status: "reserved" },
                  { username: "kamolov", status: "reserved" },
                  { username: "abdulazizbek", status: "reserved" },
                  { username: "habibahon", status: "reserved" },
                  { username: "sohibahon", status: "reserved" },
                  { username: "shodmonoy", status: "reserved" },
                  { username: "abdullohbek", status: "reserved" }
                ]
            ).map((item) => {
              const isGifted = item.status === "gifted" || item.is_sold;
              return (
                <div
                  key={item.username}
                  className="bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 transition p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-lg shadow-black/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-amber-400 font-black text-base">@{item.username}</span>
                        <span className="text-xs">✨</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isGifted ? (
                          <span className="text-emerald-400 font-bold">
                            🎁 Вручен пользователю {item.owner_name ? `${item.owner_name} (@${item.owner_username || ''})` : ""}
                          </span>
                        ) : (
                          <span className="text-amber-300 font-medium">🔒 В закрытом золотом резерве</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isGifted
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {isGifted ? "Вручен" : "Резерв"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      Цена: <b className="text-white">Бесценно</b>
                    </div>
                    <button
                      onClick={() => {
                        triggerHaptic("medium");
                        setGiftUsernameInput(item.username);
                        setShowGiftModal(true);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md shadow-amber-500/20 transition active:scale-95 flex items-center space-x-1"
                    >
                      <span>🎁</span>
                      <span>Подарить</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeSubTab === "users" && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
            <h4 className="text-xs font-bold text-white">Управление пользователями платформы:</h4>
            <div className="relative">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Поиск по никнейму или имени..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
              />
            </div>
            <button
              onClick={() => {
                setGiftTargetUser(null);
                setGiftTargetInput("");
                setGiftUsernameInput("");
                setShowGiftModal(true);
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition active:scale-98"
            >
              <span>🎁</span>
              <span>Подарить никнейм бесплатно (Без оплаты)</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {searchedUsers.map((u) => (
              <div
                key={u.id}
                className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={u.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-white">
                          {u.first_name} {u.last_name || ""}
                        </span>
                        {u.is_verified && <span className="text-sky-400 text-xs">✓</span>}
                      </div>
                      <span className="text-[11px] text-pink-400 font-bold block">
                        @{u.username} (ID: {u.telegram_id})
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-400">
                    {u.wallet_coins} 🪙
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => handleToggleVerified(u.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      u.is_verified
                        ? "bg-sky-600/20 text-sky-300 border-sky-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                  >
                    {u.is_verified ? "Снять галочку" : "✓ Дать галочку"}
                  </button>

                  <div className="flex-1 flex items-center space-x-1">
                    <input
                      type="number"
                      placeholder="1000"
                      value={userCoinsInput[u.id] || ""}
                      onChange={(e) =>
                        setUserCoinsInput({ ...userCoinsInput, [u.id]: e.target.value })
                      }
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    />
                    <button
                      onClick={() => handleAddCoins(u.id)}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 px-2 rounded-xl text-[11px]"
                    >
                      + Монеты
                    </button>
                  </div>
                </div>

                {/* Controls Row 2: Ban & Inspect & Strike & Gift */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    onClick={() => handleToggleBan(u.id, u.is_banned)}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                      u.is_banned
                        ? "bg-rose-600 text-white border-rose-500"
                        : "bg-slate-800/80 text-rose-400 border-slate-700 hover:bg-rose-950/40"
                    }`}
                  >
                    {u.is_banned ? "Разбан" : "⛔ Бан"}
                  </button>

                  <button
                    onClick={() => handleIssueWarning(u.id)}
                    className="py-1.5 px-1 rounded-xl text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 transition-all flex items-center justify-center space-x-0.5"
                  >
                    <span>⚠️ ({u.warnings_count || 0}/3)</span>
                  </button>

                  <button
                    onClick={() => {
                      setGiftTargetUser(u);
                      setGiftTargetInput(u.username);
                      setGiftUsernameInput("");
                      setShowGiftModal(true);
                    }}
                    className="py-1.5 px-1 rounded-xl text-[10px] font-bold bg-gradient-to-r from-amber-600/30 to-yellow-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center justify-center space-x-0.5"
                  >
                    <span>🎁 Подарок</span>
                  </button>

                  <button
                    onClick={() => handleViewUserDetails(u.id)}
                    className="py-1.5 px-1 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition flex items-center justify-center space-x-0.5"
                  >
                    <span>👁️ Инфо</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsored Ads Management Tab */}
      {activeSubTab === "ads" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/40 rounded-3xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">
                Монетизация & Рекламный кабинет
              </span>
              <h3 className="text-sm font-black text-white mt-0.5">
                Коммерческая реклама в Ленте и Reels
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Размещайте рекламные посты брендов и спонсоров за реальные средства
              </p>
            </div>
            <button
              onClick={() => setShowCreateAdModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 whitespace-nowrap"
            >
              + Создать
            </button>
          </div>

          <div className="space-y-3">
            {ads.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
                Пока нет созданных рекламных кампаний. Нажмите "+ Создать".
              </div>
            ) : (
              ads.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${ad.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                      <span className="text-xs font-black text-white">{ad.title}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.is_active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"}`}>
                      {ad.is_active ? "🟢 Активна" : "⏸️ На паузе"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{ad.description}</p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Показы:</span>
                      <span className="font-bold text-white">{ad.impressions_count.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Клики:</span>
                      <span className="font-bold text-indigo-400">{ad.clicks_count.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">CTR:</span>
                      <span className="font-bold text-amber-400">
                        {ad.impressions_count > 0 ? ((ad.clicks_count / ad.impressions_count) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Спонсор: <b className="text-white">@{ad.advertiser_name}</b> (Бюджет: ${ad.budget_usd})</span>
                    <a href={ad.target_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                      Ссылка ↗
                    </a>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => handleToggleAd(ad.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                        ad.is_active
                          ? "bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700"
                          : "bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40"
                      }`}
                    >
                      {ad.is_active ? "⏸️ Приостановить" : "▶️ Запустить"}
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/40 transition"
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Policies & Management Authority Tab */}
      {activeSubTab === "policies" && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-slate-900 border border-emerald-500/40 rounded-3xl p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📜</span>
              <h3 className="text-sm font-black text-white">
                Законодательство & Регламент Экосистемы
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Руководство Venstogram обладает верховной юрисдикцией. Все изменения регламента и правил владения никнеймами вступают в силу немедленно после сохранения.
            </p>
          </div>

          {/* Policy Selector Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 space-x-1">
            {[
              { key: "username_terms", label: "🏷️ Регламент никнеймов" },
              { key: "general_rules", label: "⚖️ Законы РУз & Правила" },
              { key: "director_authority", label: "👑 Полномочия Руководства" },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSelectPolicyKey(p.key)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${
                  selectedPolicyKey === p.key
                    ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Policy Editor Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
            <div>
              <label className="text-xs font-bold text-white block mb-1">
                Заголовок документа:
              </label>
              <input
                type="text"
                value={policyTitle}
                onChange={(e) => setPolicyTitle(e.target.value)}
                placeholder="Заголовок регламента..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-white">
                  Текст регламента / Закона:
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Ключ: {selectedPolicyKey}
                </span>
              </div>
              <textarea
                value={policyContent}
                onChange={(e) => setPolicyContent(e.target.value)}
                rows={10}
                placeholder="Текст регламента..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl p-3 text-xs text-slate-200 outline-none font-mono leading-relaxed resize-y transition-colors"
              />
            </div>

            <button
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>{savingPolicy ? "Сохранение..." : "💾 Сохранить и применить регламент для всей экосистемы"}</span>
            </button>
          </div>

          {/* Quick Action: Reclaim Username from User back to Platform Reserve */}
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚡</span>
              <div>
                <h4 className="text-xs font-black text-white">
                  Право Руководства: Изъятие никнейма в фонд
                </h4>
                <span className="text-[10px] text-slate-400">
                  Возврат любого юзернейма в платформенный фонд и выставление в Маркетплейс
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={reclaimTarget}
                onChange={(e) => setReclaimTarget(e.target.value)}
                placeholder="Введите никнейм (например Aziza или @Laylo)..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
              <button
                onClick={() => handleReclaimUsername(reclaimTarget)}
                disabled={reclaiming || !reclaimTarget.trim()}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all whitespace-nowrap"
              >
                {reclaiming ? "Изъятие..." : "Изъять в фонд ⚡"}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Текущий держатель получит системное уведомление от бота, а его аккаунт переименуется в системный ID (user_id). Никнейм вернется в открытый Маркетплейс.
            </p>
          </div>
        </div>
      )}

      {/* Director Tab: Financial Analytics & Platform Overview */}
      {activeSubTab === "director" && overview && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 block font-semibold">Оборот кошельков & покупок</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">
                {(overview.kpi.total_turnover_coins || 0).toLocaleString()} 🪙
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                ≈ {((overview.kpi.total_turnover_coins || 0) * 100).toLocaleString()} UZS
              </span>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl">
              <span className="text-[10px] text-emerald-400 block font-semibold">Чистая выручка платформы</span>
              <span className="text-xl font-black text-emerald-300 mt-1 block">
                {(overview.kpi.platform_profit_coins || 0).toLocaleString()} 🪙
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                100% контроль директора
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-sm font-black text-white">{overview.kpi.total_users}</span>
              <span className="text-[10px] text-slate-400 block">Юзеров</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-sm font-black text-white">{overview.kpi.total_posts}</span>
              <span className="text-[10px] text-slate-400 block">Постов</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-sm font-black text-white">{orders.length}</span>
              <span className="text-[10px] text-slate-400 block">Заявок на имена</span>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white mb-2">Аудит-лог действий:</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px]">
              {auditLogs.length === 0 ? (
                <span className="text-slate-500">Логи отсутствуют</span>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-1.5 rounded-lg bg-slate-950 flex justify-between">
                    <span className="text-slate-300 font-mono">{log.action}</span>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Moderator Tab */}
      {activeSubTab === "moderator" && (
        <div className="space-y-3">
          <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-300">{t.reportsQueue}</h4>
              <span className="text-[11px] text-slate-400">AI-сканер автоматически скрывает подозрительный контент</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black">
              {reports.length}
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              Все жалобы обработаны! AI фильтры в штатном режиме.
            </div>
          ) : (
            <>
              <button
                onClick={handleClearAllReports}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <span>🗑️ Очистить все жалобы в 1 клик</span>
              </button>
              {reports.map((r) => (
                <div key={r.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Объект: {r.target_type} #{r.target_id}
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Причина: {r.reason}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* IT Admin Tab */}
      {activeSubTab === "it" && overview && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
            <h4 className="text-xs font-bold text-white">Инфраструктура & Сервер:</h4>
            
            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
              <span className="text-slate-400">Нагрузка CPU:</span>
              <span className="text-emerald-400 font-mono font-bold">{overview.system_health.cpu_percent}%</span>
            </div>

            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
              <span className="text-slate-400">Использование RAM:</span>
              <span className="text-emerald-400 font-mono font-bold">{overview.system_health.ram_percent}%</span>
            </div>

            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
              <span className="text-slate-400">Целостность БД SQLite:</span>
              <span className="text-sky-400 font-mono font-bold">{overview.system_health.db_integrity}</span>
            </div>

            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
              <span className="text-slate-400">Среда выполнения:</span>
              <span className="text-slate-200 font-mono text-[11px]">{overview.system_health.os}</span>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab: Cyber Defense & Attack/Prank Logs */}
      {activeSubTab === "security" && (() => {
        const securityLogs = auditLogs.filter(l => l.action === "security_ban");

        return (
          <div className="space-y-4">
            {/* Header Status Card */}
            <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/60 border border-rose-500/40 rounded-3xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-xl shadow-md text-rose-400">
                  🛡️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Кибербезопасность & Защита от пранков
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Автоматическая блокировка prompt injection, вредоносного кода и пранков
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-rose-400 block">
                  {securityLogs.length}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Заблокировано</span>
              </div>
            </div>

            {/* List of Security Incidents */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-slate-400 px-1 tracking-wider block">
                Журнал инцидентов и заблокированные нарушители:
              </span>

              {securityLogs.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-xs">
                  <span className="text-3xl block mb-2">✅</span>
                  <span className="font-bold text-white block">Система в полной безопасности!</span>
                  <span>Атак и вредоносных пранков на бота не зафиксировано.</span>
                </div>
              ) : (
                securityLogs.map((log) => {
                  const d = log.details || {};
                  return (
                    <div
                      key={log.id}
                      className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 space-y-2 shadow-md relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-white">
                              {d.username ? `@${d.username}` : `Telegram ID: ${d.telegram_id}`}
                            </span>
                            <span className="bg-rose-600/30 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
                              ⛔ BANNED
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            ID нарушителя: {d.telegram_id || "—"} • {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-rose-400 block">
                          Причина: {d.reason || "Попытка вредоносного запроса/пранка"}
                        </span>
                        {d.text && (
                          <div className="text-[11px] font-mono text-slate-300 bg-black/40 p-2 rounded-lg border border-slate-800 break-all select-all">
                            "{d.text}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal Zoom Preview for Receipt */}
      {previewReceiptUrl && (
        <div
          onClick={() => setPreviewReceiptUrl(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setPreviewReceiptUrl(null)}
              className="absolute -top-10 right-0 text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-full"
            >
              ✕ Закрыть
            </button>
            <img
              src={previewReceiptUrl}
              alt="Чек полный размер"
              className="w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700"
            />
          </div>
        </div>
      )}

      {/* User Details & Posts Inspector Modal */}
      {selectedUserDetail && (() => {
        const u = selectedUserDetail.user || selectedUserDetail;
        const curUsername = u.username || "";
        const isCustomName = curUsername && !curUsername.startsWith("user_");

        return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                    👁️
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Профиль: @{curUsername}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      ID: {u.telegram_id} | Роль: {u.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {/* User Bio and Stats Card */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-3">
                    <img
                      src={u.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2364748b'/%3E%3Cpath d='M22 84 C22 66, 34 58, 50 58 C66 58, 78 66, 78 84 Z' fill='%2364748b'/%3E%3C/svg%3E"}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {u.first_name} {u.last_name || ""}
                      </span>
                      <span className="text-xs text-pink-400 font-mono">@{curUsername}</span>
                      <div className="flex space-x-2 mt-1">
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {u.wallet_coins} 🪙
                        </span>
                        {u.is_banned && (
                          <span className="text-[10px] text-rose-400 font-bold bg-rose-500/20 px-2 py-0.5 rounded-full">
                            Заблокирован ⛔
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {u.ban_reason && (
                    <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-xl border border-rose-900/50">
                      Причина бана: {u.ban_reason}
                    </p>
                  )}
                </div>

                {/* Warnings / Strikes Status */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <span>⚠️</span>
                      <span>Статус нарушений (Закон 3-х страйков):</span>
                    </span>
                    <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      {u.warnings_count || 0} / 3
                    </span>
                  </div>
                  {u.warnings_history && u.warnings_history.length > 0 ? (
                    <div className="text-[10px] text-slate-400 space-y-1 pt-1.5 border-t border-slate-800">
                      {u.warnings_history.map((w, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg">
                          <span className="text-rose-300">Страйк #{w.strike || idx + 1}: {w.reason}</span>
                          <span className="text-slate-500 font-mono text-[9px]">{w.date?.slice(0, 10)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-emerald-400 block">Нарушений нет (аккаунт чист)</span>
                  )}
                </div>

                {/* Published Posts List */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-2">
                    Публикации ({selectedUserDetail.posts?.length || 0}):
                  </h4>
                  {(!selectedUserDetail.posts || selectedUserDetail.posts.length === 0) ? (
                    <p className="text-slate-500 text-xs text-center py-4 bg-slate-950 rounded-xl">
                      У пользователя пока нет публикаций
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUserDetail.posts.map((p) => (
                        <div key={p.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2.5">
                          {p.media_urls?.[0] ? (
                            <img
                              src={p.media_urls[0]}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                              📷
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">{p.caption || "Без описания"}</p>
                            <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-1">
                              <span>❤️ {p.likes_count}</span>
                              <span>💬 {p.comments_count}</span>
                              <span>👁️ {p.views_count}</span>
                              <span className={p.moderation_status === "approved" ? "text-emerald-400" : "text-amber-400"}>
                                {p.moderation_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions: Ban Toggle & Strike & Gift & Reclaim Username */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex space-x-2">
                <button
                  onClick={() => handleToggleBan(u.id, u.is_banned)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                    u.is_banned
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-rose-600 hover:bg-rose-500 text-white"
                  }`}
                >
                  {u.is_banned ? "✅ Разблокировать" : "⛔ Бан"}
                </button>

                <button
                  onClick={() => handleIssueWarning(u.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 transition whitespace-nowrap"
                >
                  ⚠️ Страйк
                </button>

                <button
                  onClick={() => {
                    setGiftTargetUser(u);
                    setGiftTargetInput(u.username);
                    setGiftUsernameInput("");
                    setShowGiftModal(true);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md transition whitespace-nowrap"
                >
                  🎁 Подарить
                </button>

                {isCustomName && (
                  <button
                    onClick={() => handleReclaimUsername(curUsername)}
                    disabled={reclaiming}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all whitespace-nowrap"
                  >
                    ⚡ Изъять
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Ad Campaign Modal */}
      {showCreateAdModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateAd}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <span>📢</span>
                <span>Новая рекламная кампания</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateAdModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Заголовок:</label>
              <input
                type="text"
                required
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="Например: Скидка 20% в автосалоне Tashkent Motors"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Текст описания:</label>
              <textarea
                rows="2"
                required
                value={adDescription}
                onChange={(e) => setAdDescription(e.target.value)}
                placeholder="Премиальные автомобили с официальной гарантией..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Ссылка на баннер / картинку (URL):</label>
              <input
                type="url"
                value={adImageUrl}
                onChange={(e) => setAdImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Целевая ссылка (канал, сайт, бот):</label>
              <input
                type="url"
                required
                value={adTargetUrl}
                onChange={(e) => setAdTargetUrl(e.target.value)}
                placeholder="https://t.me/tashkent_motors"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Имя рекламодателя:</label>
                <input
                  type="text"
                  value={adAdvertiser}
                  onChange={(e) => setAdAdvertiser(e.target.value)}
                  placeholder="Tashkent Motors"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Текст кнопки (CTA):</label>
                <input
                  type="text"
                  value={adCtaText}
                  onChange={(e) => setAdCtaText(e.target.value)}
                  placeholder="Перейти ↗"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Бюджет кампании ($):</label>
              <input
                type="number"
                value={adBudget}
                onChange={(e) => setAdBudget(e.target.value)}
                placeholder="100"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateAdModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={savingAd}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition"
              >
                {savingAd ? "Создание..." : "Запустить рекламу 🚀"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gift Username for Free Modal (Директор) */}
      {showGiftModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
          <form
            onSubmit={handleGiftUsername}
            className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl shadow-amber-500/10"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎁</span>
                <div>
                  <h3 className="text-sm font-black text-white">Подарить никнейм бесплатно</h3>
                  <span className="text-[10px] text-amber-300">Привилегия Директора платформы</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGiftModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Кому дарим (ID или @никнейм):
              </label>
              <input
                type="text"
                required
                value={giftTargetInput}
                onChange={(e) => setGiftTargetInput(e.target.value)}
                placeholder="Например: 1477103854 или oqyolai"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
              {giftTargetUser && (
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  Выбран: {giftTargetUser.first_name} (@{giftTargetUser.username})
                </span>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Какой никнейм подарить (без @):
              </label>
              <input
                type="text"
                required
                value={giftUsernameInput}
                onChange={(e) => setGiftUsernameInput(e.target.value)}
                placeholder="sherzod, shoxrux, madina..."
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                Никнейм перейдет пользователю <b>совершенно бесплатно и без оплаты</b>, аккаунт получит верификацию, и пользователю придет поздравительный пуш в Telegram!
              </span>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowGiftModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white"
              >
                Отмена
              </button>

              <button
                type="submit"
                disabled={giftingUsername}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-lg shadow-amber-500/30 transition active:scale-98"
              >
                {giftingUsername ? "Подарок..." : "🎁 Подарить!"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
