import React, { useState, useEffect } from "react";
import { triggerHaptic } from "../telegram.js";
import { SoundEngine } from "../sound.js";
import { Api } from "../api.js";

export function RegistrationModal({ user, onComplete }) {
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  
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
      setStatusMsg("Минимум 3 символа");
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

    const trimmedUser = username.trim().toLowerCase().replace(/^@/, "");
    if (!trimmedUser || trimmedUser.length < 3) {
      setErrorMsg("Никнейм должен быть от 3 символов (латиница, цифры и _)");
      triggerHaptic("error");
      return;
    }

    if (available === false) {
      setErrorMsg("Этот никнейм занят. Выберите другой или нажмите на вариант с цифрой ниже");
      triggerHaptic("error");
      return;
    }

    setSaving(true);
    triggerHaptic("heavy");

    try {
      const res = await Api.patch("/auth/me", {
        first_name: trimmedFirst,
        last_name: lastName.trim(),
        username: trimmedUser
      });

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
          username: trimmedUser
        });
      }
    } catch (err) {
      setErrorMsg(err.message || "Ошибка создания аккаунта. Попробуйте еще раз.");
      triggerHaptic("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl shadow-pink-500/10">
        
        {/* Header Icon & Welcome */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-pink-500/30">
            <span className="text-white font-black text-2xl tracking-tighter">V</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Создание аккаунта</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Добро пожаловать в <b>Venstogram</b> — первую социальную сеть нового поколения!
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/70 border border-rose-500/50 p-2.5 rounded-xl text-xs text-rose-300">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* First Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Ваше имя <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Например, Азизбек"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Фамилия <span className="text-slate-500 font-normal">(необязательно)</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Например, Каримов"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Username with live check */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
              <span>Придумайте ваш @никнейм <span className="text-pink-400">*</span></span>
              {checking && <span className="text-[10px] text-slate-400">Проверка...</span>}
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
                    ? "border-emerald-500 focus:border-emerald-400"
                    : available === false
                    ? "border-rose-500 focus:border-rose-400"
                    : "border-slate-800 focus:border-pink-500"
                }`}
              />
            </div>

            {/* Status message */}
            {statusMsg && (
              <p className={`text-[10px] mt-1 font-medium ${available ? "text-emerald-400" : "text-rose-400"}`}>
                {statusMsg}
              </p>
            )}

            {/* Suggestions Chips with digits */}
            {suggestions && suggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Свободные варианты с цифрой:</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setUsername(sug);
                      }}
                      className="bg-slate-950 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[10px] font-mono transition"
                    >
                      @{sug} +
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || available === false || !firstName.trim() || !username.trim()}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center space-x-2 mt-4 ${
              saving || available === false || !firstName.trim() || !username.trim()
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                : "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white shadow-pink-500/30 active:scale-98"
            }`}
          >
            <span>{saving ? "Создание аккаунта..." : "🚀 Создать себе аккаунт"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
