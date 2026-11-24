import React, { useState, useEffect } from "react";
import { triggerHaptic, authenticateBiometrics } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function WalletModal({ user, t, onClose, onUpdateUser }) {
  const [isUnlocked, setIsUnlocked] = useState(!user.has_pin && !user.biometric_enabled);
  const [pinInput, setPinInput] = useState("");
  const [activeTab, setActiveTab] = useState("topup"); // topup, history
  const [transactions, setTransactions] = useState([]);
  
  // Topup State
  const [topupAmount, setTopupAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState("click"); // click, payme, uzum, stars
  const [copiedCard, setCopiedCard] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    // If biometric enabled, auto prompt
    if (!isUnlocked && user.biometric_enabled) {
      triggerBiometricAuth();
    }
  }, []);

  const triggerBiometricAuth = async () => {
    const success = await authenticateBiometrics("Разблокировка кошелька Venstogram");
    if (success) {
      setIsUnlocked(true);
    }
  };

  const handleUnlockPin = async (e) => {
    e.preventDefault();
    if (!pinInput) return;

    try {
      await Api.post("/wallet/verify-pin", { pin: pinInput });
      triggerHaptic("success");
      setIsUnlocked(true);
    } catch (err) {
      triggerHaptic("error");
      alert("Неверный PIN-код!");
      setPinInput("");
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await Api.get("/wallet/transactions");
      setTransactions(res);
    } catch (e) {}
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic("light");
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleTopUp = async () => {
    setSubmittingOrder(true);
    triggerHaptic("medium");

    try {
      let uploadedReceiptUrl = "";
      if (receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);
        const uploadRes = await Api.post("/upload", formData);
        uploadedReceiptUrl = uploadRes.url || "";
      }

      const res = await Api.post("/wallet/topup", {
        amount_coins: topupAmount,
        payment_method: paymentMethod,
        receipt_url: uploadedReceiptUrl,
        note: orderNote.trim()
      });

      SoundEngine.playFanfare();
      triggerHaptic("success");
      setSubmittedOrder(res);
      setReceiptFile(null);
      setReceiptPreview("");
      setOrderNote("");
    } catch (err) {
      triggerHaptic("error");
      alert(err.message || "Ошибка отправки заявки");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👛</span>
            <div>
              <h3 className="text-base font-extrabold text-white">{t.wallet}</h3>
              <span className="text-[10px] text-emerald-400 font-semibold">Пополнение баланса Vensto Coins</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        {/* Lock Screen if Protected */}
        {!isUnlocked ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
              🔒
            </div>
            <h4 className="text-sm font-bold text-white text-center">{t.enterPin}</h4>

            <form onSubmit={handleUnlockPin} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                maxLength="6"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 text-center text-xl tracking-widest text-white outline-none focus:border-pink-500"
                autoFocus
              />

              <button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                {t.confirm}
              </button>

              <button
                type="button"
                onClick={triggerBiometricAuth}
                className="w-full text-slate-400 text-xs py-1.5 flex items-center justify-center space-x-1"
              >
                <span>👆</span>
                <span>{t.useBiometrics}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Wallet Screen */
          <div className="py-3 flex-1 overflow-y-auto space-y-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-tr from-amber-600/30 via-slate-900 to-yellow-600/20 border border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
              <span className="text-xs text-amber-300 font-semibold">Ваш баланс</span>
              <div className="my-2 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white">
                  {(user.wallet_coins || 0).toLocaleString()}
                </span>
                <span className="text-sm font-bold text-amber-400">Vensto Coins 🪙</span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                ≈ {((user.wallet_coins || 0) * 100).toLocaleString()} UZS (сум)
              </div>
            </div>

            {/* Sub-tabs (Only Пополнить and История) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab("topup");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === "topup"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                ➕ Пополнить баланс
              </button>

              <button
                onClick={() => {
                  triggerHaptic("light");
                  setActiveTab("history");
                  loadTransactions();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === "history"
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                📋 История транзакций
              </button>
            </div>

            {/* Top Up View */}
            {activeTab === "topup" && (
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-white">Выберите сумму монет:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[200, 500, 1000, 2500, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={`p-2 rounded-xl text-xs font-bold border ${
                        topupAmount === amt
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {amt} 🪙
                      <span className="block text-[10px] text-slate-500 font-normal">{(amt * 100).toLocaleString()} сум</span>
                    </button>
                  ))}
                </div>

                {/* Paynet Business Card & QR Widget */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Реквизиты для перевода (любой банк):
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

                  <div className="font-mono font-black text-sm text-emerald-400 tracking-wider">
                    8888 0144 9062 6927
                  </div>

                  <div className="text-[10px] text-slate-300 font-bold">
                    Qabul qiluvchi: <span className="text-amber-300">ABDULAZIZ KAMOLOV SHERZODBEK O'G'LI</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setShowQr(!showQr);
                    }}
                    className="w-full text-center py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 text-sky-300 hover:bg-slate-750 border border-slate-700"
                  >
                    {showQr ? "▲ Скрыть QR-код" : "📱 Показать Paynet QR-код для сканирования"}
                  </button>

                  {showQr && (
                    <div className="flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-700 mt-2">
                      <img
                        src="./paynet_qr.jpg"
                        alt="Paynet QR"
                        className="w-44 h-auto object-contain rounded-lg"
                      />
                      <span className="text-[10px] text-slate-800 font-extrabold mt-1 text-center">
                        Istalgan ilova orqali skanerlang va to'lang
                      </span>
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white mt-2">Платежный метод:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "click", label: "🔹 Click (Uzbekistan)" },
                    { id: "payme", label: "🔸 Payme (Uzbekistan)" },
                    { id: "uzum", label: "🍇 Uzum Bank" },
                    { id: "stars", label: "⭐ Telegram Stars" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left ${
                        paymentMethod === m.id
                          ? "bg-blue-600/30 border-blue-500 text-blue-300 ring-1 ring-blue-500"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Submitted Order Status or Action Form */}
                {submittedOrder ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl text-center space-y-2 mt-2">
                    <span className="text-3xl block">⏳</span>
                    <h4 className="text-sm font-black text-emerald-300">
                      Заявка #{submittedOrder.order_id} отправлена!
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Заявка на <b>+{submittedOrder.amount_coins?.toLocaleString()} 🪙</b> (
                      {submittedOrder.amount_uzs?.toLocaleString()} сум) передана на подтверждение Основателю платформы.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Монеты поступят на ваш баланс автоматически после проверки чека Директором.
                    </p>
                    <button
                      onClick={() => setSubmittedOrder(null)}
                      className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md"
                    >
                      Понятно
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Receipt Upload & Note */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300">Чек / Скриншот перевода:</span>
                        <label className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold px-2.5 py-1 rounded-lg cursor-pointer border border-slate-700 transition">
                          <span>{receiptFile ? "✓ Чек прикреплен" : "📎 Прикрепить чек"}</span>
                          <input type="file" accept="image/*" onChange={handleReceiptChange} className="hidden" />
                        </label>
                      </div>
                      {receiptPreview && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700">
                          <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptFile(null);
                              setReceiptPreview("");
                            }}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Примечание (ФИО плательщика или последние 4 цифры карты)"
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start space-x-2">
                      <span>🛡️</span>
                      <span>Оплатите точную сумму и прикрепите скриншот чека. После подтверждения перевода Основателем вам сразу придет окно с начислением монет в один клик!</span>
                    </div>

                    <button
                      onClick={handleTopUp}
                      disabled={submittingOrder}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all mt-1"
                    >
                      {submittingOrder ? "Отправка заявки..." : `Отправить заявку на ${(topupAmount * 100).toLocaleString()} UZS`}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* History View */}
            {activeTab === "history" && (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">История операций пока пуста</div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">{tx.description}</span>
                        <span className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`font-black ${tx.amount_coins >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.amount_coins >= 0 ? `+${tx.amount_coins}` : tx.amount_coins} 🪙
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
