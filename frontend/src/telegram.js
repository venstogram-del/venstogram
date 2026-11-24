// Telegram Mini App SDK integration helper

export const tg = window.Telegram?.WebApp || {
  initData: "",
  initDataUnsafe: {
    user: {
      id: 8787674425,
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

export function authenticateBiometrics(reason = "Подтвердите личность для доступа к кошельку") {
  return new Promise((resolve) => {
    try {
      const bio = window.Telegram?.WebApp?.BiometricManager;
      if (bio && bio.isBiometricAvailable) {
        bio.authenticate({ reason }, (success) => {
          triggerHaptic(success ? "success" : "error");
          resolve(success);
        });
      } else {
        resolve(null); // Not available on device, fallback to PIN
      }
    } catch (e) {
      resolve(null);
    }
  });
}
