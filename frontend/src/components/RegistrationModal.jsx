import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function RegistrationModal({ user, onComplete }) {
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [birthYear, setBirthYear] = useState(user?.birth_year || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emailCode, setEmailCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  
  // Initial username candidate
  const initialUsername = (user?.username && !user.username.startsWith("user_"))
    ? user.username
    : "";
  const [username, setUsername] = useState(initialUsername);

  // Status of availability
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let interval = null;
    if (codeTimer > 0) {
      interval = setInterval(() => setCodeTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [codeTimer]);

  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Укажите корректный адрес электронной почты");
      triggerHaptic("error");
      return;
    }
    setSendingCode(true);
    setErrorMsg("");
    triggerHaptic("light");
    try {
      const res = await Api.post("/auth/send-code", {
        email: cleanEmail,
        username: username.trim().toLowerCase().replace(/^@/, "") || `u_${Date.now()}`,
        first_name: firstName.trim() || "Пользователь",
        last_name: lastName.trim() || "",
        password: "VenstoPassword2026!",
        birth_year: parseInt(birthYear) || 2000
      });
      setCodeSent(true);
      setCodeTimer(60);
      if (res.debug_code) {
        setEmailCode(res.debug_code);
      }
      triggerHaptic("success");
    } catch (e) {
      setErrorMsg(e.message || "Не удалось отправить код на почту");
      triggerHaptic("error");
    } finally {
      setSendingCode(false);
    }
  };

  // Live availability check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase().replace(/^@/, "");
    if (!trimmed) {
      setAvailable(null);
      setStatusMsg("");
      setSuggestions([]);
      return;
    }

    if (trimmed.length < 3) {
      setAvailable(false);
      setStatusMsg("Минимум 3 символа (латиница, цифры и _)");
      setSuggestions([]);
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await Api.get(`/users/check-username?username=${encodeURIComponent(trimmed)}`);
        setAvailable(res.available);
        setStatusMsg(res.message);
        setSuggestions(res.suggestions || []);
      } catch (err) {
        setAvailable(true);
        setStatusMsg(`@${trimmed} доступен для регистрации`);
        setSuggestions([]);
      } finally {
        setChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      setErrorMsg("Пожалуйста, введите ваше имя");
      triggerHaptic("error");
      return;
    }

    const bYear = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    if (!birthYear || isNaN(bYear) || bYear < 1940 || bYear > currentYear - 6) {
      setErrorMsg(`Пожалуйста, укажите реальный год рождения (от 1940 до ${currentYear - 6})`);
      triggerHaptic("error");
      return;
    }

    const trimmedUser = username.trim().toLowerCase().replace(/^@/, "");
    if (!trimmedUser || trimmedUser.length < 3) {
      setErrorMsg("Никнейм должен быть от 3 символов (только латиница, цифры и _)");
      triggerHaptic("error");
      return;
    }

    if (available === false) {
      setErrorMsg("Этот никнейм занят. Выберите другой или нажмите на предложенный вариант ниже");
      triggerHaptic("error");
      return;
    }

    setSaving(true);
    triggerHaptic("heavy");

    try {
      if (codeSent && emailCode.trim()) {
        try {
          await Api.post("/auth/verify-email-code", {
            email: email.trim().toLowerCase(),
            code: emailCode.trim()
          });
        } catch (vErr) {
          setErrorMsg(vErr.message || "Неверный код подтверждения из письма");
          setSaving(false);
          triggerHaptic("error");
          return;
        }
      }

      const patchData = {
        first_name: trimmedFirst,
        last_name: lastName.trim(),
        birth_year: bYear,
        username: trimmedUser,
        is_registered: true
      };
      if (email.trim()) {
        patchData.email = email.trim().toLowerCase();
      }
      const res = await Api.patch("/auth/me", patchData);

      try {
        localStorage.setItem(`vensto_account_created_${user?.id || 1}`, "true");
      } catch (e) {}

      SoundEngine.playFanfare();
      triggerHaptic("success");

      if (onComplete) {
        onComplete(res.user || {
          ...user,
          first_name: trimmedFirst,
          last_name: lastName.trim(),
          birth_year: bYear,
          username: trimmedUser,
          is_registered: true
        });
      }
    } catch (err) {
      setErrorMsg(err.message || "Ошибка регистрации. Попробуйте еще раз.");
      triggerHaptic("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-md mx-auto space-y-4 my-auto py-4">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/40">
            <span className="text-white font-black text-3xl tracking-tighter">V</span>
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Добро пожаловать в Venstogram
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Заполните данные для создания личного профиля и начала публикаций
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-500/60 p-3 rounded-2xl text-xs text-rose-200 animate-in shake">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
          {/* Step 1: Personal Information */}
          <div className="border-b border-slate-800/80 pb-3">
            <span className="text-[10px] text-pink-400 uppercase tracking-wider font-extrabold block mb-2">
              Шаг 1: Личные данные
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* First Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Имя <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Азизбек"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Фамилия
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Каримов"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                />
              </div>
            </div>

            {/* Birth Year */}
            <div className="mt-2.5">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Год рождения <span className="text-pink-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1940"
                max={new Date().getFullYear() - 6}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="Например: 2002"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition font-mono"
              />
            </div>
          </div>

          {/* Step 2: Account Creation & Nickname */}
          <div>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold block mb-2">
              Шаг 2: Создание аккаунта
            </span>
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
              <span>Придумайте ваш @никнейм <span className="text-pink-400">*</span></span>
              {checking && <span className="text-[10px] text-slate-400 animate-pulse">Проверка...</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-mono font-bold">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="ваш_никнейм"
                className={`w-full bg-slate-950 border rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition ${
                  available === true
                    ? "border-emerald-500 focus:border-emerald-400 shadow-sm shadow-emerald-500/20"
                    : available === false
                    ? "border-rose-500 focus:border-rose-400 shadow-sm shadow-rose-500/20"
                    : "border-slate-800 focus:border-pink-500"
                }`}
              />
            </div>

            {/* Status message */}
            {statusMsg && (
              <p className={`text-[10px] mt-1.5 font-bold ${available ? "text-emerald-400" : "text-rose-400"}`}>
                {available ? "✓ " : "✕ "} {statusMsg}
              </p>
            )}

            {/* Numeric suggestion chips if username is taken */}
            {suggestions && suggestions.length > 0 && (
              <div className="mt-2.5 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-semibold">
                  Свободные варианты с цифрами (нажмите для выбора):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setUsername(sug);
                      }}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center space-x-1"
                    >
                      <span>@{sug}</span>
                      <span className="text-[9px]">➕</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Email Security & Code */}
          <div className="border-t border-slate-800/80 pt-3">
            <span className="text-[10px] text-sky-400 uppercase tracking-wider font-extrabold block mb-1">
              Шаг 3: Email и безопасность (по желанию)
            </span>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ваша почта: name@gmail.com"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || codeTimer > 0 || !email.includes("@")}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-xl transition shrink-0"
                >
                  {sendingCode ? "..." : codeTimer > 0 ? `${codeTimer}с` : "Получить код"}
                </button>
              </div>

              {codeSent && (
                <div className="space-y-1 animate-in fade-in">
                  <span className="text-[10px] text-emerald-400 block font-semibold">
                    ✓ 6-значный код отправлен на {email}
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Введите 6 цифр из письма"
                    className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono text-center tracking-widest text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Feature highlights unlock */}
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
            <span className="text-white font-bold block">После создания аккаунта вам откроются:</span>
            <div className="flex items-center space-x-2">
              <span>📸 Лента и Stories</span>
              <span>•</span>
              <span>🎬 Reels</span>
              <span>•</span>
              <span>💬 Личные сообщения</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || available === false || !firstName.trim() || !birthYear || !username.trim()}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center space-x-2 ${
              saving || available === false || !firstName.trim() || !birthYear || !username.trim()
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                : "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white shadow-pink-500/30 active:scale-98"
            }`}
          >
            <span>{saving ? "Создание аккаунта..." : "🚀 Создать аккаунт и войти"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
