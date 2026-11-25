import React, { useState } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function EmailAuthModal({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState("register"); // 'register', 'verify_code', 'login', 'forgot', 'reset_password'
  
  // Registration fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthYear, setBirthYear] = useState("2000");
  const [gender, setGender] = useState("Мужской");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);
    triggerHaptic("medium");

    try {
      const res = await Api.post("/auth/register-email", {
        email: email.trim().toLowerCase(),
        password: password.trim() || "VenstoPass2026!",
        username: username.trim().toLowerCase().replace(/^@/, ""),
        first_name: firstName.trim() || "User",
        last_name: lastName.trim() || "",
        middle_name: middleName.trim() || "",
        birth_year: parseInt(birthYear) || 2000,
        gender
      });

      setInfoMsg(res.message || "Код подтверждения отправлен на почту!");
      if (res.debug_code) {
        setCode(res.debug_code);
      }
      setMode("verify_code");
    } catch (err) {
      setErrorMsg(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg("Введите 6 цифр из письма");
      return;
    }

    const cleanPass = password.trim();
    if (!cleanPass || cleanPass.length < 4) {
      setErrorMsg("Пожалуйста, придумайте пароль (не менее 4 символов)");
      return;
    }

    if (newPassword && cleanPass !== newPassword.trim()) {
      setErrorMsg("Введенные пароли не совпадают");
      return;
    }

    setLoading(true);
    triggerHaptic("heavy");

    try {
      const res = await Api.post("/auth/verify-email-code", {
        email: email.trim().toLowerCase(),
        code: cleanCode,
        password: cleanPass
      });
      Api.setToken(res.access_token);
      SoundEngine.playFanfare();
      if (onAuthSuccess) onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    triggerHaptic("medium");

    try {
      const res = await Api.post("/auth/login-email", { email, password });
      Api.setToken(res.access_token);
      SoundEngine.playFanfare();
      if (onAuthSuccess) onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    triggerHaptic("light");

    try {
      const res = await Api.post("/auth/forgot-password", { email });
      setInfoMsg(res.message);
      if (res.debug_code) setCode(res.debug_code);
      setMode("reset_password");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    triggerHaptic("heavy");

    try {
      const res = await Api.post("/auth/reset-password", {
        email,
        code,
        new_password: newPassword
      });
      Api.setToken(res.access_token);
      SoundEngine.playFanfare();
      alert("Пароль успешно изменен! Вы вошли в свой аккаунт.");
      if (onAuthSuccess) onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-sm">
              ✉️
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {mode === "register" && "Регистрация в Venstogram"}
                {mode === "verify_code" && "Подтверждение Email"}
                {mode === "login" && "Вход по Email"}
                {mode === "forgot" && "Сброс пароля"}
                {mode === "reset_password" && "Новый пароль"}
              </h3>
              <span className="text-[10px] text-slate-400">
                {mode === "register" ? "Придумайте свободный никнейм и данные" : "Безопасный доступ через почту"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Official Security Service Banner */}
          <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 p-2.5 rounded-2xl flex items-center space-x-2 text-[11px] text-blue-200">
            <span className="text-base">🛡️</span>
            <div>
              <span className="font-semibold">Официальная почта безопасности:</span>
              <span className="text-amber-300 font-mono font-bold ml-1">venstogram@gmail.com</span>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/50 p-3 rounded-2xl text-xs text-rose-300 leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-2xl text-xs text-emerald-300 leading-relaxed">
              ✅ {infoMsg}
            </div>
          )}

          {/* 1. Register Form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Придумайте свободный никнейм (@username):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-pink-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="my_super_nick"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-pink-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  *Узбекские имена и VIP бренды продаются в Маркетплейсе за $500. Выберите свободный личный никнейм.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Имя:</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Алишер"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Фамилия:</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Усманов"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Отчество (по желанию):</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Баходирович"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Год рождения:</label>
                  <input
                    type="number"
                    min="1940"
                    max="2015"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Пол:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                  >
                    <option value="Мужской">Мужской 👨</option>
                    <option value="Женский">Женский 👩</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Электронная почта (Email):</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Пароль (можете указать сейчас или после кода):
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>{loading ? "Отправка кода..." : "Получить код на почту →"}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-400 space-y-1">
                <button type="button" onClick={() => setMode("login")} className="text-pink-400 font-bold hover:underline">
                  Уже есть аккаунт? Войти по Email
                </button>
              </div>
            </form>
          )}

          {/* 2. Verify Code Form */}
          {mode === "verify_code" && (
            <form onSubmit={handleVerifyCode} className="space-y-3.5">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-300">
                  Мы отправили 6-значный код подтверждения на почту: <b className="text-white">{email}</b>
                </p>
                <p className="text-[11px] text-amber-300/90 font-medium">
                  📩 Отправитель: <b>venstogram@gmail.com</b> (проверьте также папку Спам)
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1 text-center">
                  Введите 6-значный код из письма:
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-48 mx-auto block text-center font-mono text-2xl tracking-widest bg-slate-950 border-2 border-pink-500/50 rounded-2xl py-2 text-white outline-none focus:border-pink-500"
                />
              </div>

              {/* Придумайте пароль */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    🔑 Придумайте пароль (для входа с любого телефона):
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Придумайте пароль (мин. 4 символа)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    🔑 Повторите пароль для проверки:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Повторите введенный пароль"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6 || !password.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all"
              >
                {loading ? "Активация..." : "✓ Подтвердить код, сохранить пароль и войти"}
              </button>

              <button
                type="button"
                onClick={() => setMode("register")}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                ← Изменить email или данные
              </button>
            </form>
          )}

          {/* 3. Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Email:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Пароль:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all"
              >
                {loading ? "Вход..." : "Войти в аккаунт"}
              </button>

              <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
                <button type="button" onClick={() => setMode("forgot")} className="text-amber-400 hover:underline">
                  Забыли пароль?
                </button>
                <button type="button" onClick={() => setMode("register")} className="text-pink-400 font-bold hover:underline">
                  Создать аккаунт
                </button>
              </div>
            </form>
          )}

          {/* 4. Forgot Password Form */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <p className="text-xs text-slate-300">
                Введите ваш Email, указанный при регистрации. Мы вышлем код для сброса пароля:
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Email:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition-all"
              >
                {loading ? "Отправка кода..." : "Получить код сброса пароля"}
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                ← Вернуться ко входу
              </button>
            </form>
          )}

          {/* 5. Reset Password Form */}
          {mode === "reset_password" && (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Код из письма:</label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Новый пароль:</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all"
              >
                {loading ? "Сохранение..." : "Сохранить новый пароль и войти"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
