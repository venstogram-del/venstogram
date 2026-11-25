import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

const regTexts = {
  uz_latn: {
    welcomeTitle: "Venstogram-ga xush kelibsiz",
    welcomeSubtitle: "Shaxsiy profilingizni yaratish va postlarni chiqarish uchun ma'lumotlarni to'ldiring",
    step1: "1-Qadam: Shaxsiy ma'lumotlar",
    firstName: "Ism",
    lastName: "Familiya",
    birthYear: "Tug'ilgan yil",
    birthYearPlaceholder: "Masalan: 2002",
    step2: "2-Qadam: Foydalanuvchi nomi",
    chooseUsername: "O'zingizga @username tanlang",
    checking: "Tekshirilmoqda...",
    available: "ro'yxatdan o'tish uchun bo'sh",
    taken: "Bu username band. Boshqasini tanlang yoki quyidagilardan birini bosing",
    suggestionsTitle: "Bo'sh raqamli variantlar (tanlash uchun bosing):",
    step3: "3-Qadam: Email va xavfsizlik (ixtiyoriy)",
    emailPlaceholder: "Email manzilingiz: name@gmail.com",
    getCode: "Kodni olish",
    codeSentTo: "6-raqamli xavfsizlik kodi yuborildi:",
    enterCode: "Xatdagi 6 ta raqamni kiriting",
    featuresTitle: "Profil ochilgach sizga ochiladi:",
    featuresList: "📸 Lenta va Stories • 🎬 Reels • 💬 Xabarlar",
    submitBtn: "🚀 Ro'yxatdan o'tish va boshlash",
    submitting: "Profil yaratilmoqda...",
    passwordTitle: "Parol o'ylab toping (boshqa telefonlardan kirish uchun):",
    passwordPlaceholder: "Yangi parol kiriting",
    errFirstName: "Iltimos, ismingizni kiriting",
    errBirthYear: "Iltimos, haqiqiy tug'ilgan yilingizni kiriting",
    errUsername: "Username kamida 3 ta belgidan iborat bo'lishi kerak",
    errEmail: "To'g'ri email manzilini kiriting",
    errVerifyCode: "Xatdagi tasdiqlash kodi noto'g'ri"
  },
  ru: {
    welcomeTitle: "Добро пожаловать в Venstogram",
    welcomeSubtitle: "Заполните данные для создания личного профиля и начала публикаций",
    step1: "Шаг 1: Личные данные",
    firstName: "Имя",
    lastName: "Фамилия",
    birthYear: "Год рождения",
    birthYearPlaceholder: "Например: 2002",
    step2: "Шаг 2: Создание аккаунта",
    chooseUsername: "Придумайте ваш @никнейм",
    checking: "Проверка...",
    available: "доступен для регистрации",
    taken: "Этот никнейм занят. Выберите другой или нажмите вариант ниже",
    suggestionsTitle: "Свободные варианты с цифрами (нажмите для выбора):",
    step3: "Шаг 3: Email и безопасность (по желанию)",
    emailPlaceholder: "Ваша почта: name@gmail.com",
    getCode: "Получить код",
    codeSentTo: "6-значный код отправлен на",
    enterCode: "Введите 6 цифр из письма",
    featuresTitle: "После создания аккаунта вам откроются:",
    featuresList: "📸 Лента и Stories • 🎬 Reels • 💬 Личные сообщения",
    submitBtn: "🚀 Создать аккаунт и войти",
    submitting: "Создание аккаунта...",
    passwordTitle: "Придумайте пароль (для входа с любого телефона):",
    passwordPlaceholder: "Придумайте надежный пароль",
    errFirstName: "Пожалуйста, введите ваше имя",
    errBirthYear: "Пожалуйста, укажите реальный год рождения",
    errUsername: "Никнейм должен быть от 3 символов (латиница, цифры и _)",
    errEmail: "Укажите корректный адрес электронной почты",
    errVerifyCode: "Неверный код подтверждения из письма"
  },
  en: {
    welcomeTitle: "Welcome to Venstogram",
    welcomeSubtitle: "Fill in your details to create your personal profile and start posting",
    step1: "Step 1: Personal info",
    firstName: "First name",
    lastName: "Last name",
    birthYear: "Birth year",
    birthYearPlaceholder: "E.g.: 2002",
    step2: "Step 2: Create account",
    chooseUsername: "Choose your @username",
    checking: "Checking...",
    available: "available for registration",
    taken: "This username is taken. Choose another or click a suggestion below",
    suggestionsTitle: "Available suggestions (tap to select):",
    step3: "Step 3: Email & security (optional)",
    emailPlaceholder: "Your email: name@gmail.com",
    getCode: "Get code",
    codeSentTo: "6-digit security code sent to",
    enterCode: "Enter the 6 digits from email",
    featuresTitle: "Features unlocked after creating profile:",
    featuresList: "📸 Feed & Stories • 🎬 Reels • 💬 Direct Messages",
    submitBtn: "🚀 Create Profile & Start",
    submitting: "Creating profile...",
    passwordTitle: "Create a password (for logging in from other devices):",
    passwordPlaceholder: "Create a secure password",
    errFirstName: "Please enter your first name",
    errBirthYear: "Please enter your valid birth year",
    errUsername: "Username must be at least 3 characters",
    errEmail: "Please enter a valid email address",
    errVerifyCode: "Invalid email verification code"
  }
};

export function RegistrationModal({ user, onComplete, onOpenEmailAuth, lang = "uz_latn", onLanguageChange }) {
  const [currentLang, setCurrentLang] = useState(lang || "uz_latn");
  const tr = regTexts[currentLang] || regTexts.uz_latn;

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [birthYear, setBirthYear] = useState(user?.birth_year || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
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
      setErrorMsg(tr.errEmail);
      triggerHaptic("error");
      return;
    }
    setSendingCode(true);
    setErrorMsg("");
    triggerHaptic("light");
    try {
      const res = await Api.post("/auth/send-verification", {
        email: cleanEmail,
        username: username.trim().toLowerCase().replace(/^@/, "") || (user?.username || `u_${Date.now()}`),
        first_name: firstName.trim() || user?.first_name || "User",
        last_name: lastName.trim() || user?.last_name || "",
        birth_year: parseInt(birthYear) || user?.birth_year || 2000
      });
      setCodeSent(true);
      setCodeTimer(60);
      if (res.debug_code) {
        setEmailCode(res.debug_code);
      }
      triggerHaptic("success");
    } catch (e) {
      setErrorMsg(e.message || "Email error");
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
      setStatusMsg(tr.errUsername);
      setSuggestions([]);
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await Api.get(`/users/check-username?username=${encodeURIComponent(trimmed)}`);
        setAvailable(res.available);
        setStatusMsg(res.available ? tr.available : tr.taken);
        setSuggestions(res.suggestions || []);
      } catch (err) {
        setAvailable(true);
        setStatusMsg(tr.available);
        setSuggestions([]);
      } finally {
        setChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, currentLang]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedFirst = firstName.trim();
    if (!trimmedFirst) {
      setErrorMsg(tr.errFirstName);
      triggerHaptic("error");
      return;
    }

    const bYear = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    if (!birthYear || isNaN(bYear) || bYear < 1940 || bYear > currentYear - 6) {
      setErrorMsg(`${tr.errBirthYear} (1940 - ${currentYear - 6})`);
      triggerHaptic("error");
      return;
    }

    const trimmedUser = username.trim().toLowerCase().replace(/^@/, "");
    if (!trimmedUser || trimmedUser.length < 3) {
      setErrorMsg(tr.errUsername);
      triggerHaptic("error");
      return;
    }

    if (available === false) {
      setErrorMsg(tr.taken);
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
            code: emailCode.trim(),
            password: password.trim() || undefined
          });
        } catch (vErr) {
          setErrorMsg(vErr.message || tr.errVerifyCode);
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
      if (password.trim()) {
        patchData.password = password.trim();
      }
      const res = await Api.patch("/auth/me", patchData);

      try {
        localStorage.setItem(`vensto_account_created_${user?.id || 1}`, "true");
        localStorage.setItem("vensto_lang", currentLang);
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
      setErrorMsg(err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
      triggerHaptic("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-md mx-auto space-y-4 my-auto py-4">
        
        {/* Language switch selector */}
        <div className="flex items-center justify-center space-x-2 pb-1">
          {[
            { code: "uz_latn", label: "🇺🇿 O'zbek" },
            { code: "ru", label: "🇷🇺 Русский" },
            { code: "en", label: "🇬🇧 English" }
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setCurrentLang(l.code);
                if (onLanguageChange) onLanguageChange(l.code);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                currentLang === l.code
                  ? "bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-white/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/40">
            <span className="text-white font-black text-3xl tracking-tighter">V</span>
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {tr.welcomeTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {tr.welcomeSubtitle}
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
              {tr.step1}
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* First Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {tr.firstName} <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Azizbek"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {tr.lastName}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Karimov"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                />
              </div>
            </div>

            {/* Birth Year */}
            <div className="mt-2.5">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {tr.birthYear} <span className="text-pink-400">*</span>
              </label>
              <input
                type="number"
                required
                min="1940"
                max={new Date().getFullYear() - 6}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder={tr.birthYearPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition font-mono"
              />
            </div>
          </div>

          {/* Step 2: Account Creation & Nickname */}
          <div>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold block mb-2">
              {tr.step2}
            </span>
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
              <span>{tr.chooseUsername} <span className="text-pink-400">*</span></span>
              {checking && <span className="text-[10px] text-slate-400 animate-pulse">{tr.checking}</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-mono font-bold">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="username"
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
                  {tr.suggestionsTitle}
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
              {tr.step3}
            </span>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tr.emailPlaceholder}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || codeTimer > 0 || !email.includes("@")}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-xl transition shrink-0"
                >
                  {sendingCode ? "..." : codeTimer > 0 ? `${codeTimer}s` : tr.getCode}
                </button>
              </div>

              {codeSent && (
                <div className="space-y-1 animate-in fade-in">
                  <span className="text-[10px] text-emerald-400 block font-semibold">
                    ✓ {tr.codeSentTo} {email}
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder={tr.enterCode}
                    className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono text-center tracking-widest text-sm"
                  />
                </div>
              )}

              {/* Password creation */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  🔑 {tr.passwordTitle}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tr.passwordPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Feature highlights unlock */}
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
            <span className="text-white font-bold block">{tr.featuresTitle}</span>
            <div className="flex items-center space-x-2">
              <span>{tr.featuresList}</span>
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
            <span>{saving ? tr.submitting : tr.submitBtn}</span>
          </button>

          {/* Account recovery / login link */}
          <div className="text-center pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                if (onOpenEmailAuth) onOpenEmailAuth();
              }}
              className="text-xs text-pink-400 hover:text-pink-300 font-bold hover:underline"
            >
              Уже есть аккаунт? Войти или восстановить пароль ↵
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
