import React, { useState, useEffect, useRef } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function MarketplaceView({ user, t, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("usernames"); // usernames, verified, promo
  const [listings, setListings] = useState([]);
  const [category, setCategory] = useState("all");
  const [plans, setPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(25);
  
  // Order Modal State
  const [selectedListing, setSelectedListing] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadListings();
    loadVerifiedPlans();
  }, [category]);

  const loadListings = async () => {
    try {
      const res = await Api.get(`/marketplace/usernames?category=${category}`);
      setListings(res || []);
    } catch (e) {}
  };

  const loadVerifiedPlans = async () => {
    try {
      const res = await Api.get("/marketplace/verified/plans");
      setPlans(res || []);
    } catch (e) {}
  };

  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
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
        throw new Error("Ошибка загрузки чека");
      }

      const data = await res.json();
      setReceiptUrl(data.url);
      triggerHaptic("success");
    } catch (err) {
      alert("Не удалось загрузить скриншот: " + err.message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!receiptUrl) {
      alert("Пожалуйста, прикрепите скриншот чека об оплате!");
      return;
    }

    setSubmittingOrder(true);
    triggerHaptic("heavy");
    SoundEngine.playFanfare();

    try {
      const res = await Api.post(`/marketplace/usernames/${selectedListing.id}/order`, {
        receipt_url: receiptUrl,
        notes: orderNotes
      });
      alert(res.message);
      setSelectedListing(null);
      setReceiptUrl("");
      setOrderNotes("");
      loadListings();
    } catch (err) {
      alert("Ошибка отправки заявки: " + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleBuyVerified = async (months) => {
    triggerHaptic("heavy");
    SoundEngine.playFanfare();

    try {
      const res = await Api.post("/marketplace/verified/buy", { months });
      alert(res.message);
      onUpdateUser({ ...user, is_verified: true, verified_until: res.verified_until });
    } catch (err) {
      triggerHaptic("error");
      alert(err.message);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/40 rounded-3xl p-4 text-center shadow-lg">
        <span className="text-2xl block mb-1">💎</span>
        <h2 className="text-base font-black text-white">Официальный Маркетплейс VENSTOGRAM</h2>
        <p className="text-[11px] text-slate-300 mt-1 max-w-sm mx-auto">
          Редкие имена, официальная галочка и пакеты продвижения для бизнеса.
          Оплата переводом с прикреплением чека.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("usernames");
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "usernames"
              ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          🏷️ Никнеймы
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("verified");
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "verified"
              ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          ✓ Галочка
        </button>
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("promo");
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "promo"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          🚀 Бизнес
        </button>
      </div>

      {/* Tab 1: Usernames Marketplace Content */}
      {activeTab === "usernames" && (() => {
        const filteredListings = listings.filter((item) =>
          item.username.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
        const displayedListings = filteredListings.slice(0, visibleCount);

        return (
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(25);
                }}
                placeholder="🔍 Найти имя (Aziza, Laylo, Madina, Sevara)..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Categories & Count */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: "all", label: "🌟 Все" },
                  { id: "ultra_rare", label: "💎 Эксклюзив & 2-значные ($30,000)" },
                  { id: "uzbek_names", label: "🇺🇿 Узбекские имена ($500)" },
                  { id: "vip_brands", label: "👑 VIP Бренды ($10k-$20k)" },
                  { id: "uzbek_cities", label: "🏛️ Города ($10k)" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setVisibleCount(25);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      category === cat.id
                        ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between px-1">
              <span>Доступно: <b className="text-white">{filteredListings.length}</b> никнеймов</span>
              {category === "uzbek_names" && <span className="text-amber-400 font-bold">Фиксированная цена: $500</span>}
            </div>

            {/* Listings Cards */}
            {displayedListings.length === 0 ? (
              <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                По запросу "{searchQuery}" ничего не найдено. Попробуйте другое имя.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {displayedListings.map((item) => {
                  const priceUsd = item.price_usd || 500;
                  const priceUzs = item.price_uzs || priceUsd * 13000;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-black text-white tracking-tight">@{item.username}</span>
                            {(item.category === "ultra_rare" || item.username === "ou") && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                💎 2-ЗНАЧНЫЙ РЕДКИЙ ($30,000)
                              </span>
                            )}
                            {item.category === "vip_brands" && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                👑 VIP BRAND
                              </span>
                            )}
                            {item.category === "uzbek_cities" && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                🏛️ ГОРОД
                              </span>
                            )}
                            {item.category === "uzbek_names" && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                                🇺🇿 ИМЯ
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
                            🛡️ Продавец: VENSTOGRAM OFFICIAL
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-amber-300 block">
                            ${priceUsd.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ≈ {priceUzs.toLocaleString()} сум
                          </span>
                        </div>
                      </div>

                      {/* Buy Button */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            triggerHaptic("medium");
                            setSelectedListing(item);
                            setReceiptUrl("");
                            setOrderNotes("");
                            setAgreedToTerms(false);
                          }}
                          className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
                        >
                          <span>💳 Купить @{item.username}</span>
                          <span>— ${priceUsd.toLocaleString()}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination / Load More */}
            {filteredListings.length > visibleCount && (
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setVisibleCount((prev) => prev + 25);
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-pink-400 font-bold text-xs rounded-xl border border-slate-800 transition-colors"
              >
                Показать ещё (+25) — осталось {filteredListings.length - visibleCount} ↓
              </button>
            )}
          </div>
        );
      })()}

      {/* Tab 2: Venstogram Verified Showcase */}
      {activeTab === "verified" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-sky-950/80 via-blue-900/40 to-slate-900 border border-sky-500/40 rounded-3xl p-5 text-center relative overflow-hidden shadow-xl">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-sky-500/30">
              ✓
            </div>
            <h3 className="text-lg font-black text-white">{t.verifiedBadge}</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              Один раз подключил галочку — и твои видео взлетают в рекомендации! Официальный статус, доверие и 3x-5x охваты.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="space-y-2.5">
            {plans.map((p) => (
              <div
                key={p.months}
                className="bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 flex items-center justify-between transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{p.label}</h4>
                  <span className="text-xs text-sky-400 font-semibold">{p.coins.toLocaleString()} Vensto Coins</span>
                </div>
                <button
                  onClick={() => handleBuyVerified(p.months)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-sky-500/20 transition-transform active:scale-95"
                >
                  Подключить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Business Promotion Showcase */}
      {activeTab === "promo" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-950/80 via-orange-950/40 to-slate-900 border border-amber-500/40 rounded-3xl p-5 text-center relative overflow-hidden shadow-xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/30">
              🚀
            </div>
            <h3 className="text-lg font-black text-white">Продвижение бизнеса в VENSTOGRAM</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
              Быстрый рост продаж, целевые показы в ленте и Reels для малого бизнеса, магазинов и брендов Узбекистана.
            </p>
          </div>

          {/* Promo Packages */}
          <div className="space-y-3">
            {[
              {
                id: "small_business",
                title: "🌱 Старт: Малый бизнес",
                views: "10 000 гарантированных показов",
                features: ["Показ в общей ленте и Reels", "Приоритет в поиске (лупа)", "Метка «Спонсировано»"],
                coins: 500,
                priceUzs: "50 000 сум"
              },
              {
                id: "pro_business",
                title: "⚡ PRO Бизнес & Онлайн-магазины",
                views: "50 000 показов + ТОП рекомендаций",
                features: ["Закрепление в рекомендациях на 7 дней", "Прямая кнопка на Telegram-канал/сайт", "3x прирост подписчиков"],
                coins: 2000,
                priceUzs: "200 000 сум",
                popular: true
              },
              {
                id: "vip_brand",
                title: "👑 VIP Бренд & Корпорации",
                views: "200 000 целевых просмотров",
                features: ["Масштабный охват по всему Узбекистану", "Рассылка через Telegram-бота", "Персональный менеджер и синяя галочка"],
                coins: 7500,
                priceUzs: "750 000 сум"
              }
            ].map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-slate-900 border rounded-3xl p-4 space-y-3 relative overflow-hidden transition-all shadow-lg ${
                  pkg.popular ? "border-amber-500/70 ring-1 ring-amber-500/30" : "border-slate-800"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    ХИТ ПРОДАЖ 🔥
                  </span>
                )}

                <div>
                  <h4 className="text-sm font-black text-white">{pkg.title}</h4>
                  <span className="text-xs font-bold text-amber-400 block mt-0.5">{pkg.views}</span>
                </div>

                <div className="space-y-1">
                  {pkg.features.map((f, i) => (
                    <div key={i} className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                      <span className="text-emerald-400">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-base font-black text-white">{pkg.coins} 🪙</span>
                    <span className="text-[10px] text-slate-400 block">≈ {pkg.priceUzs}</span>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic("heavy");
                      if (user.wallet_coins >= pkg.coins) {
                        onUpdateUser({ ...user, wallet_coins: user.wallet_coins - pkg.coins });
                        alert(`Пакет «${pkg.title}» успешно запущен! Ваши показы уже идут в ленту.`);
                      } else {
                        // Open checkout modal with Paynet QR
                        setSelectedListing({
                          id: 999,
                          username: `Бизнес_Промо_${pkg.id}`,
                          price_usd: Math.round(pkg.coins / 130),
                          price_uzs: parseInt(pkg.priceUzs.replace(/\D/g, "")) || 50000
                        });
                      }
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
                  >
                    Запустить промо 🚀
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Modal with Screenshot Upload and Paynet QR */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Оплата {selectedListing.username}</h3>
                <span className="text-xs text-pink-400 font-bold">
                  Стоимость: ${selectedListing.price_usd?.toLocaleString() || 500} ({(selectedListing.price_uzs || (selectedListing.price_usd * 13000))?.toLocaleString()} UZS)
                </span>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Payment Requisites & Paynet QR Code */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-white block">Оплата через Paynet / Click / Payme / Uzum:</span>

              {/* QR Code Card */}
              <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-700 shadow-md">
                <img
                  src="./paynet_qr.jpg"
                  alt="QR kodni skanerlang"
                  className="w-52 h-auto object-contain rounded-xl shadow"
                />
                <span className="text-[11px] text-slate-800 font-extrabold mt-2 text-center">
                  📱 Отсканируйте QR-код в любом приложении
                </span>
                <span className="text-[9px] text-slate-500 font-semibold text-center">
                  (Paynet, Payme, Click, Uzum Bank, NBU, Agrobank, Kapitalbank)
                </span>
              </div>

              {/* Card Number & Recipient Box */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Biznes karta raqami:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText("8888014490626927");
                      }
                      setCopiedCard(true);
                      setTimeout(() => setCopiedCard(false), 2500);
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-pink-400 px-2 py-0.5 rounded-lg font-bold border border-slate-700"
                  >
                    {copiedCard ? "✓ Скопировано!" : "📋 Скопировать"}
                  </button>
                </div>

                <div className="font-mono font-black text-base text-emerald-400 tracking-wider">
                  8888 0144 9062 6927
                </div>

                <div className="text-[11px] text-slate-200 font-bold">
                  Qabul qiluvchi: <span className="text-amber-300">ABDULAZIZ KAMOLOV SHERZODBEK O'G'LI</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                Оплатите точную сумму и прикрепите скриншот чека ниже. После подтверждения администратором заказ будет мгновенно активирован!
              </p>
            </div>

            {/* Screenshot Upload Form */}
            <form onSubmit={handleSubmitOrder} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  Прикрепить скриншот чека об оплате:
                </label>

                {receiptUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-500/60 p-1 bg-slate-950">
                    <img
                      src={receiptUrl}
                      alt="Чек"
                      className="w-full h-44 object-contain rounded-xl bg-black"
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptUrl("")}
                      className="absolute top-3 right-3 bg-rose-600 text-white rounded-full p-1 text-xs shadow-lg"
                    >
                      ✕ Удалить
                    </button>
                    <span className="text-[10px] text-emerald-400 font-bold block text-center py-1">
                      ✓ Скриншот успешно прикреплен
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReceiptFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingReceipt}
                      className="w-full border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl p-5 text-center transition-all bg-slate-950/60 flex flex-col items-center justify-center space-y-1.5"
                    >
                      <span className="text-2xl">📸</span>
                      <span className="text-xs font-bold text-pink-400">
                        {uploadingReceipt ? "Загрузка фото..." : "Нажмите, чтобы выбрать скриншот из галереи"}
                      </span>
                      <span className="text-[10px] text-slate-500">Поддерживаются форматы JPG, PNG, WEBP</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Комментарий или контакт для связи (опционально):
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ваш номер или Telegram @..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              {/* Legal Terms & Ownership Regulations Banner */}
              <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3.5 space-y-2 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">⚖️</span>
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    Регламент владения и правила платформы
                  </span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc pl-4 leading-snug">
                  <li>
                    <b>Личное пользование:</b> Никнейм закрепляется за покупателем на правах эксклюзивного личного пользования внутри экосистемы Venstogram.
                  </li>
                  <li className="text-amber-200">
                    <b>Запрет перепродажи:</b> <u>Перепродажа, передача или уступка никнейма третьим лицам категорически запрещена.</u> Вы можете менять имя профиля, фото и описание, но никнейм не подлежит вторичной продаже.
                  </li>
                  <li className="text-amber-300">
                    <b>Право Руководства:</b> Руководство платформы сохраняет за собой безоговорочное право изменять условия регламента, правила экосистемы и статус никнеймов в соответствии с интересами платформы и законами РУз.
                  </li>
                </ul>

                <label className="flex items-start space-x-2.5 pt-2 border-t border-amber-500/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      triggerHaptic("selection");
                      setAgreedToTerms(e.target.checked);
                    }}
                    className="mt-0.5 rounded border-slate-700 text-pink-600 focus:ring-pink-500 w-4 h-4 bg-slate-900"
                  />
                  <span className="text-[11px] font-bold text-white select-none">
                    Я принимаю Регламент Venstogram, подтверждаю запрет перепродажи и согласен с условиями Руководства
                  </span>
                </label>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!receiptUrl || !agreedToTerms || submittingOrder}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30"
                >
                  {submittingOrder ? "Отправка..." : "Отправить чек на проверку"}
                </button>
              </div>

              {/* Tech Support Notice in Checkout */}
              <div className="text-center pt-1 text-[10px] text-slate-400">
                <span>Вопросы по оплате? Техподдержка: </span>
                <a href="tel:+998507775152" className="text-emerald-400 font-mono font-bold hover:underline">+998 50 777 51 52</a>
                <span> • </span>
                <a href="https://t.me/yuksak_it" target="_blank" rel="noreferrer" className="text-sky-400 font-mono font-bold hover:underline">@yuksak_it</a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
