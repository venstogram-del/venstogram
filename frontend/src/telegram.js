// Telegram Mini App SDK integration helper

export const tg = window.Telegram?.WebApp || {
  initData: "",
  initDataUnsafe: {
    user: {
      id: 999999999,
      username: "demo_user",
      first_name: "Demo",
      last_name: "User",
      language_code: "ru"
    }
  },
  themeParams: {
    bg_color: "#0f172a",
    text_color: "#ffffff",
    button_color: "#3b82f6",
    button_text_color: "#ffffff"
  },
  expand: () => {},
  ready: () => {},
  enableClosingConfirmation: () => {},
  HapticFeedback: {
    impactOccurred: (style) => console.log(`[Haptic impact] ${style}`),
    notificationOccurred: (type) => console.log(`[Haptic notification] ${type}`),
    selectionChanged: () => console.log(`[Haptic selection]`)
  },
  BackButton: {
    show: () => {},
    hide: () => {},
    onClick: () => {}
  },
  BiometricManager: {
    isInited: true,
    isBiometricAvailable: true,
    biometricType: "finger",
    isAccessGranted: true,
    authenticate: (params, callback) => callback(true)
  },
  switchInlineQuery: (query, choose_chat_types) => {
    console.log(`[Telegram switchInlineQuery] ${query}`);
  }
};

export function initTelegramApp() {
  try {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.enableClosingConfirmation();
      
      // Adapt background colors
      if (window.Telegram.WebApp.themeParams?.bg_color) {
        document.body.style.backgroundColor = window.Telegram.WebApp.themeParams.bg_color;
      }
    }
  } catch (err) {
    console.warn("[Telegram Mini App Init Note]", err);
  }
}

export function triggerHaptic(type = "light") {
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (type === "success" || type === "error" || type === "warning") {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      } else if (type === "selection") {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
      }
    }
  } catch (e) {}
}

export function safeConfirm(message = "Вы уверены?") {
  return new Promise((resolve) => {
    try {
      if (window.Telegram?.WebApp?.showConfirm) {
        window.Telegram.WebApp.showConfirm(message, (ok) => {
          resolve(Boolean(ok));
        });
        return;
      }
    } catch (e) {}

    try {
      if (typeof window !== "undefined" && typeof window.confirm === "function") {
        const res = window.confirm(message);
        resolve(Boolean(res));
        return;
      }
    } catch (e) {}

    // Fallback: if confirm is blocked or unavailable, proceed
    resolve(true);
  });
}
