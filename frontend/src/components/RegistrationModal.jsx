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

  // Login & Recovery state
  const [viewMode, setViewMode] = useState("register"); // 'register', 'login', 'forgot', 'reset'
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newResetPassword, setNewResetPassword] = useState("");

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const cleanMail = (loginEmail || email).trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes("@")) {
      setErrorMsg("Укажите корректный адрес электронной почты");
      triggerHaptic("error");
      return;
    }
    if (!loginPassword) {
      setErrorMsg("Введите пароль");
      triggerHaptic("error");
      return;
    }

    setLoggingIn(true);
    triggerHaptic("medium");
    try {
      const res = await Api.post("/auth/login-email", {
        email: cleanMail,
        password: loginPassword
      });
      Api.setToken(res.access_token);
      SoundEngine.playFanfare();
      triggerHaptic("success");
      try {
        localStorage.setItem(`vensto_account_created_${res.user?.id || 1}`, "true");
        localStorage.setItem("vensto_lang", currentLang);
        if (res.user) {
          localStorage.setItem("vensto_cached_user", JSON.stringify(res.user));
        }
      } catch (e) {}
      if (onComplete) onComplete(res.user);
    } catch (err) {
      setErrorMsg(err.message || "Неверный Email или пароль");
      triggerHaptic("error");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const cleanMail = (loginEmail || email).trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes("@")) {
      setErrorMsg("Укажите ваш Email");
      return;
    }
    setLoggingIn(true);
    triggerHaptic("light");
    try {
      const res = await Api.post("/auth/forgot-password", { email: cleanMail });
      if (res.debug_code) setResetCode(res.debug_code);
      setViewMode("reset");
      alert(res.message || "Код сброса отправлен на вашу почту!");
    } catch (err) {
      setErrorMsg(err.message || "Ошибка отправки кода сброса");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const cleanMail = (loginEmail || email).trim().toLowerCase();
    if (!resetCode.trim()) {
      setErrorMsg("Введите 6-значный код из письма");
      return;
    }
    if (!newResetPassword || newResetPassword.length < 4) {
      setErrorMsg("Новый пароль должен содержать от 4 символов");
      return;
    }
    setLoggingIn(true);
    triggerHaptic("heavy");
    try {
      const res = await Api.post("/auth/reset-password", {
        email: cleanMail,
        code: resetCode.trim(),
        new_password: newResetPassword.trim()
      });
      Api.setToken(res.access_token);
      SoundEngine.playFanfare();
      triggerHaptic("success");
      alert("Пароль успешно обновлен! Добро пожаловать.");
      try {
        localStorage.setItem(`vensto_account_created_${res.user?.id || 1}`, "true");
        localStorage.setItem("vensto_lang", currentLang);
        if (res.user) {
          localStorage.setItem("vensto_cached_user", JSON.stringify(res.user));
        }
      } catch (e) {}
      if (onComplete) onComplete(res.user);
    } catch (err) {
      setErrorMsg(err.message || "Неверный код сброса");
    } finally {
      setLoggingIn(false);
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
        setStatusMsg(res.available ? tr.available : (res.message || tr.taken));
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
        const resolvedUser = res.user || {
          ...user,
          first_name: trimmedFirst,
          last_name: lastName.trim(),
          birth_year: bYear,
          username: trimmedUser,
          is_registered: true
        };
        localStorage.setItem("vensto_cached_user", JSON.stringify(resolvedUser));
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
    <div className="fixed inset-0 z-50 bg-slate-100/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 overflow-y-auto text-slate-900 font-sans">
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
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25 ring-1 ring-white/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-pink-500/30">
            <span className="text-white font-black text-3xl tracking-tighter">V</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {viewMode === "login" ? "Вход в Venstogram" : viewMode === "forgot" ? "Восстановление пароля" : viewMode === "reset" ? "Новый пароль" : tr.welcomeTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {viewMode === "login" ? "Введите Email и пароль для входа в свой профиль" : viewMode === "forgot" ? "Введите Email для получения кода сброса пароля" : viewMode === "reset" ? "Введите 6 цифр из письма и новый пароль" : tr.welcomeSubtitle}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 animate-in shake font-medium shadow-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 1. LOGIN VIEW */}
        {viewMode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl shadow-slate-200/50 text-slate-900">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Электронная почта (Email):
              </label>
              <input
                type="email"
                required
                value={loginEmail || email}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Пароль:
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-500 text-white shadow-pink-500/25 active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>{loggingIn ? "Вход в аккаунт..." : "🚀 Войти в свой аккаунт"}</span>
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setViewMode("forgot");
                  setErrorMsg("");
                }}
                className="text-amber-600 hover:text-amber-700 hover:underline"
              >
                Забыли пароль?
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setViewMode("register");
                  setErrorMsg("");
                }}
                className="text-pink-600 hover:text-pink-700 hover:underline"
              >
                ← Создать новый аккаунт
              </button>
            </div>
          </form>
        )}

        {/* 2. FORGOT PASSWORD VIEW */}
        {viewMode === "forgot" && (
          <form onSubmit={handleForgotSubmit} className="space-y-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl shadow-slate-200/50 text-slate-900">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Введите ваш Email для сброса пароля:
              </label>
              <input
                type="email"
                required
                value={loginEmail || email}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold shadow-amber-500/20 active:scale-98 flex items-center justify-center"
            >
              <span>{loggingIn ? "Отправка..." : "Получить код для сброса пароля →"}</span>
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setViewMode("login");
                  setErrorMsg("");
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold hover:underline"
              >
                ← Вернуться ко входу
              </button>
            </div>
          </form>
        )}

        {/* 3. RESET PASSWORD VIEW */}
        {viewMode === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl shadow-slate-200/50 text-slate-900">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                6-значный код из письма:
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Новый пароль:
              </label>
              <input
                type="password"
                required
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder="Придумайте новый пароль"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn || !resetCode.trim() || !newResetPassword}
              className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-emerald-500/20 active:scale-98 flex items-center justify-center"
            >
              <span>{loggingIn ? "Сохранение..." : "✓ Сохранить новый пароль и войти"}</span>
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setViewMode("login");
                  setErrorMsg("");
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold hover:underline"
              >
                ← Вернуться ко входу
              </button>
            </div>
          </form>
        )}

        {/* 4. REGISTRATION VIEW */}
        {viewMode === "register" && (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-xl shadow-slate-200/50 text-slate-900">
            {/* Step 1: Personal Information */}
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] text-pink-600 uppercase tracking-wider font-extrabold block mb-2">
                {tr.step1}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {/* First Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {tr.firstName} <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Azizbek"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {tr.lastName}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Karimov"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
                  />
                </div>
              </div>

              {/* Birth Year */}
              <div className="mt-2.5">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {tr.birthYear} <span className="text-pink-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1940"
                  max={new Date().getFullYear() - 6}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder={tr.birthYearPlaceholder}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition font-mono"
                />
              </div>
            </div>

            {/* Step 2: Account Creation & Nickname */}
            <div>
              <span className="text-[10px] text-amber-600 uppercase tracking-wider font-extrabold block mb-2">
                {tr.step2}
              </span>
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between mb-1">
                <span>{tr.chooseUsername} <span className="text-pink-500">*</span></span>
                {checking && <span className="text-[10px] text-slate-500 animate-pulse">{tr.checking}</span>}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-slate-400 text-xs font-mono font-bold">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="username"
                  className={`w-full bg-white border rounded-xl pl-8 pr-3.5 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-sm ${
                    available === true
                      ? "border-emerald-500 focus:border-emerald-500 shadow-emerald-500/10"
                      : available === false
                      ? "border-rose-500 focus:border-rose-500 shadow-rose-500/10"
                      : "border-slate-300 focus:border-pink-500"
                  }`}
                />
              </div>

              {/* Status message */}
              {statusMsg && (
                <p className={`text-[10px] mt-1 font-bold ${available ? "text-emerald-600" : "text-rose-600"}`}>
                  {available ? "✓ " : "✕ "} {statusMsg}
                </p>
              )}

              {/* Numeric suggestion chips if username is taken */}
              {suggestions && suggestions.length > 0 && (
                <div className="mt-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] text-slate-600 block font-semibold">
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
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center space-x-1"
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
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] text-sky-600 uppercase tracking-wider font-extrabold block mb-1">
                {tr.step3}
              </span>
              <div className="space-y-2.5">
                {/* Email Input & Send Code Button */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Электронная почта (Email):
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={tr.emailPlaceholder}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition"
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingCode || codeTimer > 0 || !email.includes("@")}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-40 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-pink-500/20 shrink-0"
                    >
                      {sendingCode ? "..." : codeTimer > 0 ? `${codeTimer}s` : tr.getCode}
                    </button>
                  </div>
                </div>

                {/* 6-Digit Email Code - ALWAYS VISIBLE */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>📩 {tr.enterCode}:</span>
                    {codeSent && (
                      <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                        ✓ {tr.codeSentTo} {email}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder={codeSent ? tr.enterCode : (currentLang === "uz_latn" ? "Emailga yuborilgan 6 ta raqam" : "Введите 6 цифр из письма")}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-sm ${
                      codeSent
                        ? "bg-emerald-50/80 border-emerald-400 text-slate-950 font-bold focus:border-emerald-500 ring-2 ring-emerald-400/20"
                        : "bg-white border-slate-300 focus:border-pink-500"
                    }`}
                  />
                </div>

                {/* Password creation */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    🔑 {tr.passwordTitle}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tr.passwordPlaceholder}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 transition shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Feature highlights unlock */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-[10px] text-slate-600 space-y-1">
              <span className="text-slate-900 font-bold block">{tr.featuresTitle}</span>
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
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-500 text-white shadow-pink-500/25 active:scale-98"
              }`}
            >
              <span>{saving ? tr.submitting : tr.submitBtn}</span>
            </button>

            {/* Account recovery / login link */}
            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setErrorMsg("");
                  setViewMode("login");
                  if (email && !loginEmail) setLoginEmail(email);
                  if (onOpenEmailAuth) {
                    try { onOpenEmailAuth("login"); } catch (e) {}
                  }
                }}
                className="text-xs text-pink-600 hover:text-pink-700 font-bold hover:underline"
              >
                Уже есть аккаунт? Войти или восстановить пароль ↵
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
