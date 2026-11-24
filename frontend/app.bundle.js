const {
  useState,
  useEffect,
  useRef
} = React;

// --- File: i18n.js ---
// Multi-language dictionary for Venstogram Mini App
// Supported: ru (Русский), uz_latn (O'zbekcha), uz_cyrl (Ўзбекча), en (English)

const translations = {
  ru: {
    appName: "Venstogram",
    feed: "Лента",
    reels: "Reels",
    battles: "PK Баттлы",
    chats: "Сообщения",
    marketplace: "Маркет",
    profile: "Профиль",
    admin: "Админка",
    wallet: "Кошелек",
    coins: "монет",
    uzs: "сум",
    likes: "отметок",
    views: "просмотров",
    comments: "комментариев",
    shares: "репостов",
    writeComment: "Написать комментарий...",
    post: "Опубликовать",
    share: "Поделиться",
    follow: "Подписаться",
    following: "Вы подписаны",
    activeBattles: "Прямые эфиры и PK Баттлы",
    host: "Хост",
    guest: "Соперник",
    penaltyTask: "Штрафное задание",
    sendGift: "Отправить подарок",
    mvpSponsors: "Топ спонсоров (MVP)",
    usernameMarket: "Биржа юзернеймов",
    buyout: "Купить сразу",
    placeBid: "Сделать ставку",
    currentBid: "Текущая ставка",
    verifiedBadge: "Подписка Venstogram Verified",
    verifiedDesc: "Синяя галочка + 3-кратный алгоритмический буст в рекомендациях",
    months1: "1 месяц",
    months3: "3 месяца",
    months12: "1 год",
    deposit: "Пополнить",
    withdraw: "Вывести",
    cardWithdrawal: "Вывод на карту (Uzcard / Humo)",
    enterPin: "Введите PIN-код для доступа к кошельку",
    useBiometrics: "Использовать Face ID / Touch ID",
    confirm: "Подтвердить",
    cancel: "Отмена",
    newPost: "Новая публикация",
    selectMedia: "Выберите фото или видео",
    addCaption: "Добавьте подпись...",
    dataSaverOn: "Data Saver активен (сжатие трафика)",
    offlineNotice: "Нет подключения к интернету. Показываем кэш.",
    liveCall: "Звонок 1-на-1",
    incomingCall: "Входящий вызов...",
    accept: "Ответить",
    decline: "Сбросить",
    online: "В сети",
    typing: "печатает...",
    roleDirector: "Директор",
    roleIT: "Главный по IT",
    roleMod: "Модератор",
    roleDev: "Разработчик",
    aiThreatScore: "Угроза AI: ",
    aiSafe: "Безопасно",
    reportsQueue: "Очередь жалоб"
  },
  uz_latn: {
    appName: "Venstogram",
    feed: "Lenta",
    reels: "Reels",
    battles: "PK Janglar",
    chats: "Xabarlar",
    marketplace: "Bozor",
    profile: "Profil",
    admin: "Admin",
    wallet: "Hamyon",
    coins: "tanga",
    uzs: "so'm",
    likes: "yoqdi",
    views: "ko'rishlar",
    comments: "izohlar",
    shares: "ulashishlar",
    writeComment: "Izoh yozing...",
    post: "Chiqarish",
    share: "Ulashish",
    follow: "Obuna bo'lish",
    following: "Obunadasiz",
    activeBattles: "Jonli efir va PK Janglar",
    host: "Host",
    guest: "Raqib",
    penaltyTask: "Jazo sharti",
    sendGift: "Sovg'a yuborish",
    mvpSponsors: "Top homiylar (MVP)",
    usernameMarket: "Username birjasi",
    buyout: "Darhol sotib olish",
    placeBid: "Taklif kiritish",
    currentBid: "Joriy narx",
    verifiedBadge: "Venstogram Verified obunasi",
    verifiedDesc: "Moviy belgi + tavsiyalarda 3 karra ko'proq ko'rinish",
    months1: "1 oy",
    months3: "3 oy",
    months12: "1 yil",
    deposit: "To'ldirish",
    withdraw: "Yechib olish",
    cardWithdrawal: "Kartaga yechish (Uzcard / Humo)",
    enterPin: "Hamyon uchun PIN kodni kiriting",
    useBiometrics: "Face ID / Touch ID orqali",
    confirm: "Tasdiqlash",
    cancel: "Bekor qilish",
    newPost: "Yangi post",
    selectMedia: "Foto yoki video tanlang",
    addCaption: "Tavsif yozing...",
    dataSaverOn: "Data Saver faol (trafik tejamkorligi)",
    offlineNotice: "Internet aloqasi yo'q. Kesh ko'rsatilmoqda.",
    liveCall: "Qo'ng'iroq 1-ga-1",
    incomingCall: "Kiruvchi qo'ng'iroq...",
    accept: "Javob berish",
    decline: "Rad etish",
    online: "Tarmoqda",
    typing: "yozmoqda...",
    roleDirector: "Direktor",
    roleIT: "Bosh IT mutaxassis",
    roleMod: "Moderator",
    roleDev: "Dasturchi",
    aiThreatScore: "AI xavf darajasi: ",
    aiSafe: "Xavfsiz",
    reportsQueue: "Shikoyatlar navbati"
  },
  uz_cyrl: {
    appName: "Venstogram",
    feed: "Лента",
    reels: "Reels",
    battles: "PK Жанглар",
    chats: "Хабарлар",
    marketplace: "Бозор",
    profile: "Профиль",
    admin: "Админ",
    wallet: "Ҳамён",
    coins: "танга",
    uzs: "сўм",
    likes: "ёқди",
    views: "кўришлар",
    comments: "изоҳлар",
    shares: "улашишлар",
    writeComment: "Изоҳ ёзинг...",
    post: "Чиқариш",
    share: "Улашиш",
    follow: "Обуна бўлиш",
    following: "Обунадасиз",
    activeBattles: "Жонли эфир ва PK Жанглар",
    host: "Хост",
    guest: "Рақиб",
    penaltyTask: "Жазо шарти",
    sendGift: "Совға юбориш",
    mvpSponsors: "Топ ҳомийлар (MVP)",
    usernameMarket: "Юзернейм биржаси",
    buyout: "Дарҳол сотиб олиш",
    placeBid: "Нарх таклиф қилиш",
    currentBid: "Жорий нарх",
    verifiedBadge: "Venstogram Verified обунаси",
    verifiedDesc: "Мовий белги + тавсияларда 3 карра кўпроқ кўриниш",
    months1: "1 ой",
    months3: "3 ой",
    months12: "1 йил",
    deposit: "Тўлдириш",
    withdraw: "Ечиб олиш",
    cardWithdrawal: "Картага ечиш (Uzcard / Humo)",
    enterPin: "Ҳамён учун PIN кодни киритинг",
    useBiometrics: "Face ID / Touch ID орқали",
    confirm: "Тасдиқлаш",
    cancel: "Бекор қилиш",
    newPost: "Янги пост",
    selectMedia: "Фото ёки видео танланг",
    addCaption: "Тавсиф ёзинг...",
    dataSaverOn: "Data Saver фаол (трафик тежамкорлиги)",
    offlineNotice: "Интернет алоқаси йўқ. Кеш кўрсатилмоқда.",
    liveCall: "Қўнғироқ 1-га-1",
    incomingCall: "Кирувчи қўнғироқ...",
    accept: "Жавоб бериш",
    decline: "Рад этиш",
    online: "Тармоқда",
    typing: "ёзмоқда...",
    roleDirector: "Директор",
    roleIT: "Бош IT мутахассис",
    roleMod: "Модератор",
    roleDev: "Дастурчи",
    aiThreatScore: "AI хавф даражаси: ",
    aiSafe: "Хавфсиз",
    reportsQueue: "Шикоятлар навбати"
  },
  en: {
    appName: "Venstogram",
    feed: "Feed",
    reels: "Reels",
    battles: "PK Battles",
    chats: "Messages",
    marketplace: "Market",
    profile: "Profile",
    admin: "Admin",
    wallet: "Wallet",
    coins: "coins",
    uzs: "UZS",
    likes: "likes",
    views: "views",
    comments: "comments",
    shares: "shares",
    writeComment: "Write a comment...",
    post: "Post",
    share: "Share",
    follow: "Follow",
    following: "Following",
    activeBattles: "Live Streams & PK Battles",
    host: "Host",
    guest: "Challenger",
    penaltyTask: "Penalty / Forfeit Task",
    sendGift: "Send Gift",
    mvpSponsors: "Top MVP Sponsors",
    usernameMarket: "Username Marketplace",
    buyout: "Buyout Now",
    placeBid: "Place Bid",
    currentBid: "Current Bid",
    verifiedBadge: "Venstogram Verified Subscription",
    verifiedDesc: "Blue badge + 3x algorithmic visibility boost in discovery",
    months1: "1 month",
    months3: "3 months",
    months12: "1 year",
    deposit: "Top Up",
    withdraw: "Withdraw",
    cardWithdrawal: "Withdraw to Card (Uzcard / Humo)",
    enterPin: "Enter PIN code to unlock wallet",
    useBiometrics: "Use Face ID / Touch ID",
    confirm: "Confirm",
    cancel: "Cancel",
    newPost: "New Post",
    selectMedia: "Select photo or video",
    addCaption: "Add a caption...",
    dataSaverOn: "Data Saver Active (Traffic compression)",
    offlineNotice: "No internet connection. Displaying cached feed.",
    liveCall: "1-on-1 Call",
    incomingCall: "Incoming call...",
    accept: "Accept",
    decline: "Decline",
    online: "Online",
    typing: "typing...",
    roleDirector: "Director",
    roleIT: "Head of IT",
    roleMod: "Moderator",
    roleDev: "Developer",
    aiThreatScore: "AI Threat: ",
    aiSafe: "Safe",
    reportsQueue: "Reports Queue"
  }
};
function getInitialLanguage() {
  let saved = null;
  try {
    saved = localStorage.getItem("vensto_lang");
  } catch (e) {}
  if (saved && translations[saved]) return saved;
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang) {
    if (tgLang.startsWith("uz")) return "uz_latn";
    if (tgLang.startsWith("ru")) return "ru";
  }
  return "ru";
}

// --- File: telegram.js ---
// Telegram Mini App SDK integration helper

const tg = window.Telegram?.WebApp || {
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
    impactOccurred: style => console.log(`[Haptic impact] ${style}`),
    notificationOccurred: type => console.log(`[Haptic notification] ${type}`),
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
function initTelegramApp() {
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
function triggerHaptic(type = "light") {
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
function authenticateBiometrics(reason = "Подтвердите личность для доступа к кошельку") {
  return new Promise(resolve => {
    try {
      const bio = window.Telegram?.WebApp?.BiometricManager;
      if (bio && bio.isBiometricAvailable) {
        bio.authenticate({
          reason
        }, success => {
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

// --- File: sound.js ---
// Web Audio API Synthesizer for instant zero-latency sound effects in Telegram Mini App

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}
const SoundEngine = {
  // Like heart pop
  playLike() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },
  // Rose gift pop
  playRose() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  },
  // Fire / Supercar roar
  playSupercar() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.5);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.85);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  },
  // Lion roar / Crown fanfare
  playFanfare() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + 0.65);
    });
  },
  // Incoming Call Ringtone
  ringtoneInterval: null,
  playRingtone() {
    if (this.ringtoneInterval) return;
    const playBeep = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    };
    playBeep();
    this.ringtoneInterval = setInterval(playBeep, 1200);
  },
  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  },
  // Notification chime
  playNotification() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  },
  // Realistic Voice Note playback with formant voice modulation
  activeVoiceInterval: null,
  playVoiceNote(durationSeconds = 4, onEnd = null) {
    if (this.activeVoiceInterval) {
      clearInterval(this.activeVoiceInterval);
      this.activeVoiceInterval = null;
    }
    const ctx = getAudioContext();
    if (!ctx) {
      if (onEnd) onEnd();
      return;
    }
    try {
      const formants = [220, 310, 260, 380, 440, 290, 340, 410];
      let elapsed = 0;
      const step = 0.25;
      const playSpeechPacket = () => {
        if (elapsed >= durationSeconds) {
          if (this.activeVoiceInterval) {
            clearInterval(this.activeVoiceInterval);
            this.activeVoiceInterval = null;
          }
          if (onEnd) onEnd();
          return;
        }
        const freq = formants[Math.floor(Math.random() * formants.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, ctx.currentTime + step * 0.7);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + step);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + step);
        elapsed += step;
      };
      playSpeechPacket();
      this.activeVoiceInterval = setInterval(playSpeechPacket, step * 1000);
    } catch (e) {
      if (onEnd) onEnd();
    }
  },
  stopVoiceNote() {
    if (this.activeVoiceInterval) {
      clearInterval(this.activeVoiceInterval);
      this.activeVoiceInterval = null;
    }
  }
};

// --- File: api.js ---
// API Client & Realtime WebSocket manager for Venstogram

const API_BASE = typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "";
const SafeStorage = {
  getItem(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  setItem(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
  removeItem(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }
};
const Api = {
  token: SafeStorage.getItem("vensto_token") || "",
  setToken(t) {
    this.token = t;
    SafeStorage.setItem("vensto_token", t);
  },
  clearToken() {
    this.token = "";
    SafeStorage.removeItem("vensto_token");
  },
  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    try {
      const res = await fetch(`${API_BASE}/api${endpoint}`, {
        ...options,
        headers
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          detail: "Network error"
        }));
        throw new Error(errorData.detail || "Server error");
      }
      const data = await res.json();

      // Save cache for offline reading
      if (endpoint === "/posts" && options.method === undefined) {
        SafeStorage.setItem("vensto_cached_feed", JSON.stringify(data));
      } else if (endpoint === "/stories" && options.method === undefined) {
        SafeStorage.setItem("vensto_cached_stories", JSON.stringify(data));
      }
      return data;
    } catch (err) {
      // Offline fallback
      if (endpoint === "/posts" && (!options.method || options.method === "GET")) {
        const cached = SafeStorage.getItem("vensto_cached_feed");
        if (cached) {
          window.dispatchEvent(new CustomEvent("vensto_offline_mode", {
            detail: true
          }));
          return JSON.parse(cached);
        }
      }
      throw err;
    }
  },
  get(endpoint) {
    return this.request(endpoint, {
      method: "GET"
    });
  },
  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },
  delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE"
    });
  }
};
class RealtimeSocket {
  constructor(token, onEvent) {
    this.token = token;
    this.onEvent = onEvent;
    this.ws = null;
    this.reconnectTimer = null;
    this.connect();
  }
  connect() {
    if (!this.token) return;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/ws/live?token=${this.token}`;
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        console.log("[Venstogram WS] Connected to live channel");
      };
      this.ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (this.onEvent) this.onEvent(data);
        } catch (e) {}
      };
      this.ws.onclose = () => {
        this.reconnectTimer = setTimeout(() => this.connect(), 4000);
      };
    } catch (e) {
      console.warn("[Venstogram WS] Connection error", e);
    }
  }
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  joinRoom(room) {
    this.send({
      type: "join_room",
      room
    });
  }
  leaveRoom(room) {
    this.send({
      type: "leave_room",
      room
    });
  }
  close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}

// --- File: components/PostModal.jsx ---

function PostModal({
  post,
  currentUser,
  onClose,
  onPostUpdated,
  onPostDeleted
}) {
  const [currentPost, setCurrentPost] = useState(post);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likers, setLikers] = useState([]);
  const [showLikers, setShowLikers] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Запрещенный контент / Порнография (Ст. 130 УК РУз)");
  const [isSaved, setIsSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const commentInputRef = useRef(null);
  useEffect(() => {
    if (post && post.id) {
      loadComments(post.id);
    }
  }, [post]);
  const loadComments = async postId => {
    try {
      const res = await Api.get(`/posts/${postId}/comments`);
      setComments(res || []);
    } catch (e) {
      setComments([]);
    }
  };
  const loadLikers = async postId => {
    triggerHaptic("light");
    try {
      const res = await Api.get(`/posts/${postId}/likers`);
      setLikers(res || []);
      setShowLikers(true);
    } catch (e) {
      setLikers([]);
      setShowLikers(true);
    }
  };
  const handleLike = async () => {
    triggerHaptic("medium");
    SoundEngine.playLike();
    const newLiked = !currentPost.is_liked;
    const newCount = newLiked ? currentPost.likes_count + 1 : Math.max(0, currentPost.likes_count - 1);
    const updated = {
      ...currentPost,
      is_liked: newLiked,
      likes_count: newCount
    };
    setCurrentPost(updated);
    if (onPostUpdated) onPostUpdated(updated);
    try {
      await Api.post(`/posts/${currentPost.id}/like`, {});
    } catch (e) {}
  };
  const handleAddComment = async e => {
    e.preventDefault();
    if (!newComment.trim()) return;
    triggerHaptic("light");
    const text = newComment;
    setNewComment("");
    try {
      const added = await Api.post(`/posts/${currentPost.id}/comments`, {
        text
      });
      setComments(prev => [...prev, added]);
      const updated = {
        ...currentPost,
        comments_count: (currentPost.comments_count || 0) + 1
      };
      setCurrentPost(updated);
      if (onPostUpdated) onPostUpdated(updated);
    } catch (e) {}
  };
  const handleReplyToComment = authorUsername => {
    triggerHaptic("light");
    if (!authorUsername) return;
    setNewComment(`@${authorUsername}, `);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);
  };
  const handleDeleteComment = async commentId => {
    if (!confirm("Удалить этот комментарий?")) return;
    triggerHaptic("medium");
    try {
      await Api.delete(`/posts/${currentPost.id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      const updated = {
        ...currentPost,
        comments_count: Math.max(0, (currentPost.comments_count || 1) - 1)
      };
      setCurrentPost(updated);
      if (onPostUpdated) onPostUpdated(updated);
    } catch (err) {
      alert("Ошибка удаления комментария: " + err.message);
    }
  };
  const handleDeletePost = async () => {
    if (!confirm("Вы действительно хотите навсегда удалить эту публикацию?")) return;
    setDeleting(true);
    triggerHaptic("heavy");
    try {
      await Api.delete(`/posts/${currentPost.id}`);
      alert("Публикация успешно удалена!");
      if (onPostDeleted) onPostDeleted(currentPost.id);
      onClose();
    } catch (err) {
      alert("Ошибка удаления публикации: " + err.message);
      setDeleting(false);
    }
  };
  const handleShare = () => {
    triggerHaptic("selection");
    try {
      if (window.Telegram?.WebApp?.switchInlineQuery) {
        window.Telegram.WebApp.switchInlineQuery(`Посмотри публикацию @${currentPost.author?.username || 'user'} в VENSTOGRAM: ${currentPost.caption?.slice(0, 50)}...`);
      } else {
        navigator.clipboard?.writeText(window.location.href);
        alert("Ссылка на публикацию скопирована в буфер!");
      }
    } catch (e) {}
  };
  const handleSendReport = async e => {
    e.preventDefault();
    triggerHaptic("heavy");
    try {
      await Api.post(`/posts/${currentPost.id}/report`, {
        reason: reportReason
      });
      alert("Жалоба принята. Контент передан Директору и модераторам для проверки по законам РУз.");
      setReportModalOpen(false);
    } catch (err) {
      alert("Ошибка отправки жалобы: " + err.message);
    }
  };
  if (!currentPost) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-150"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("img", {
    src: currentPost.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    className: "w-9 h-9 rounded-full object-cover ring-1 ring-pink-500"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-white"
  }, currentPost.author?.first_name, " ", currentPost.author?.last_name || ""), currentPost.author?.is_verified && /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 text-xs font-bold"
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-400 font-semibold block"
  }, "@", currentPost.author?.username))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, (currentPost.author?.id === currentUser?.id || currentPost.user_id === currentUser?.id || currentUser?.role === "director") && /*#__PURE__*/React.createElement("button", {
    onClick: handleDeletePost,
    disabled: deleting,
    className: "text-rose-500 hover:text-rose-400 p-1 text-sm font-bold transition-transform active:scale-90",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044E"
  }, deleting ? "..." : "🗑️"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setReportModalOpen(true),
    className: "text-slate-500 hover:text-rose-400 p-1 text-xs",
    title: "\u041F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C\u0441\u044F"
  }, "\uD83D\uDEA9"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-white p-1 text-base font-bold"
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-black max-h-72 sm:max-h-80 flex items-center justify-center overflow-hidden relative"
  }, /*#__PURE__*/React.createElement("img", {
    src: currentPost.media_urls && currentPost.media_urls[0] || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    alt: "Post media",
    className: "w-full h-full object-contain"
  })), /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleLike,
    className: "flex items-center space-x-1 text-xs font-bold text-slate-300 hover:text-white transition-transform active:scale-125"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-xl ${currentPost.is_liked ? "text-rose-500 animate-pulse" : "text-slate-400"}`
  }, currentPost.is_liked ? "❤️" : "🤍"), /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      loadLikers(currentPost.id);
    },
    className: "hover:underline"
  }, currentPost.likes_count || 0)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1 text-xs font-bold text-slate-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-lg"
  }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("span", null, currentPost.comments_count || comments.length)), /*#__PURE__*/React.createElement("button", {
    onClick: handleShare,
    className: "flex items-center space-x-1 text-xs font-bold text-slate-300 hover:text-pink-400",
    title: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-lg"
  }, "\u2197\uFE0F"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px]"
  }, "\u0420\u0435\u043F\u043E\u0441\u0442"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC41\uFE0F"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, currentPost.views_count || 128)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setIsSaved(!isSaved);
    },
    className: "text-base text-slate-400 hover:text-amber-400"
  }, isSaved ? "🔖" : "🏷️"))), currentPost.caption && /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-2 bg-slate-950/40 text-xs text-slate-300 leading-relaxed border-b border-slate-800/60"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white mr-1.5"
  }, "@", currentPost.author?.username), /*#__PURE__*/React.createElement("span", null, currentPost.caption)), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-4 space-y-2.5 max-h-48 bg-slate-950/60"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 uppercase font-black tracking-wider block"
  }, "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0438 (", comments.length, "):"), comments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-4 text-slate-500 text-xs"
  }, "\u0411\u0443\u0434\u044C\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u043C, \u043A\u0442\u043E \u043E\u0441\u0442\u0430\u0432\u0438\u0442 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439! \u2728") : comments.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: "flex items-start space-x-2 text-xs"
  }, /*#__PURE__*/React.createElement("img", {
    src: c.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    className: "w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 p-2 rounded-xl border border-slate-800/80 flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-black text-pink-400"
  }, "@", c.author?.username), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleReplyToComment(c.author?.username),
    className: "text-[10px] text-sky-400 hover:underline font-bold"
  }, "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C"), (c.author?.id === currentUser?.id || c.user_id === currentUser?.id || currentPost.author?.id === currentUser?.id || currentUser?.role === "director") && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleDeleteComment(c.id),
    className: "text-[10px] text-rose-500 hover:text-rose-400",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439"
  }, "\uD83D\uDDD1\uFE0F"))), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-200"
  }, c.text))))), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleAddComment,
    className: "p-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    ref: commentInputRef,
    value: newComment,
    onChange: e => setNewComment(e.target.value),
    placeholder: "\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439...",
    className: "flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !newComment.trim(),
    className: "bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all"
  }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C"))), showLikers && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-4 w-full max-w-xs space-y-3 max-h-72 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center border-b border-slate-800 pb-2"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white"
  }, "\u2764\uFE0F \u041A\u043E\u043C\u0443 \u043F\u043E\u043D\u0440\u0430\u0432\u0438\u043B\u043E\u0441\u044C (", likers.length, "):"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowLikers(false),
    className: "text-slate-400 hover:text-white text-xs"
  }, "\u2715")), likers.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 text-xs text-center py-2"
  }, "\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442") : likers.map(u => /*#__PURE__*/React.createElement("div", {
    key: u.id,
    className: "flex items-center space-x-2 text-xs"
  }, /*#__PURE__*/React.createElement("img", {
    src: u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    className: "w-7 h-7 rounded-full object-cover"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white block"
  }, u.first_name), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-400"
  }, "@", u.username)))))), reportModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSendReport,
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-rose-400"
  }, "\uD83D\uDEA9 \u041F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044E"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-300"
  }, "\u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u044E\u0442\u0441\u044F \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u043E\u043C. \u041D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u043E\u043D\u043E\u0432 \u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0438 \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D \u0432\u0435\u0434\u0435\u0442 \u043A \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0435:"), /*#__PURE__*/React.createElement("select", {
    value: reportReason,
    onChange: e => setReportReason(e.target.value),
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
  }, /*#__PURE__*/React.createElement("option", {
    value: "\u041F\u043E\u0440\u043D\u043E\u0433\u0440\u0430\u0444\u0438\u044F / \u0418\u043D\u0442\u0438\u043C\u043D\u044B\u0435 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B (\u0421\u0442. 130 \u0423\u041A \u0420\u0423\u0437)"
  }, "\uD83D\uDD1E \u041F\u043E\u0440\u043D\u043E\u0433\u0440\u0430\u0444\u0438\u044F / \u0421\u0435\u043A\u0441 (\u0421\u0442. 130 \u0423\u041A \u0420\u0423\u0437)"), /*#__PURE__*/React.createElement("option", {
    value: "\u041E\u0440\u0443\u0436\u0438\u0435 / \u0422\u0435\u0440\u0440\u043E\u0440\u0438\u0437\u043C / \u042D\u043A\u0441\u0442\u0440\u0435\u043C\u0438\u0437\u043C (\u0421\u0442. 244-1 \u0423\u041A \u0420\u0423\u0437)"
  }, "\uD83D\uDCA3 \u041E\u0440\u0443\u0436\u0438\u0435 / \u042D\u043A\u0441\u0442\u0440\u0435\u043C\u0438\u0437\u043C (\u0421\u0442. 244-1 \u0423\u041A \u0420\u0423\u0437)"), /*#__PURE__*/React.createElement("option", {
    value: "\u041D\u0430\u0441\u0438\u043B\u0438\u0435 / \u041F\u043E\u0431\u043E\u0438 / \u0416\u0435\u0441\u0442\u043E\u043A\u043E\u0441\u0442\u044C (\u0421\u0442. 12-1 \u0417\u0430\u043A\u043E\u043D\u0430)"
  }, "\uD83E\uDE78 \u041D\u0430\u0441\u0438\u043B\u0438\u0435 / \u0416\u0435\u0441\u0442\u043E\u043A\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("option", {
    value: "\u0424\u0430\u043B\u044C\u0448\u0438\u0432\u044B\u0435 \u0447\u0435\u043A\u0438 / \u041C\u043E\u0448\u0435\u043D\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u043E"
  }, "\uD83D\uDCB3 \u041C\u043E\u0448\u0435\u043D\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u043E / \u0424\u0430\u043B\u044C\u0448\u0438\u0432\u044B\u0439 \u0447\u0435\u043A"), /*#__PURE__*/React.createElement("option", {
    value: "\u0421\u043F\u0430\u043C / \u041E\u0441\u043A\u043E\u0440\u0431\u043B\u0435\u043D\u0438\u044F"
  }, "\uD83D\uDEAB \u0421\u043F\u0430\u043C \u0438\u043B\u0438 \u0442\u0440\u0430\u0432\u043B\u044F")), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setReportModalOpen(false),
    className: "flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-xl text-xs font-bold shadow-md"
  }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0436\u0430\u043B\u043E\u0431\u0443")))));
}

// --- File: components/Header.jsx ---

function Header({
  user,
  t,
  onOpenCreate,
  onOpenChat
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-pink-500/20"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-white font-extrabold text-lg tracking-tighter"
  }, "V")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-lg font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none"
  }, "Venstogram"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-400 font-semibold tracking-wider uppercase"
  }, "Live & Social"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("medium");
      onOpenCreate();
    },
    className: "p-1.5 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors",
    title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044E"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-5 h-5 text-pink-400",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2.5",
    d: "M12 4v16m8-8H4"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      onOpenChat();
    },
    className: "p-1.5 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors relative",
    title: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-5 h-5 text-sky-400",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2",
    d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
  })), /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"
  }))));
}

// --- File: components/BottomNav.jsx ---

function BottomNav({
  activeTab,
  onTabChange,
  t,
  userRole
}) {
  const isAdmin = ["director", "it_admin", "moderator", "developer"].includes(userRole);
  const tabs = [{
    id: "feed",
    label: "Лента",
    icon: active => /*#__PURE__*/React.createElement("svg", {
      className: `w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`,
      fill: active ? "currentColor" : "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2",
      d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    }))
  }, {
    id: "search",
    label: "Поиск",
    icon: active => /*#__PURE__*/React.createElement("svg", {
      className: `w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`,
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: active ? "2.5" : "2",
      d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    }))
  }, {
    id: "reels",
    label: "Reels",
    icon: active => /*#__PURE__*/React.createElement("svg", {
      className: `w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`,
      fill: active ? "currentColor" : "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2",
      d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    }))
  }, {
    id: "marketplace",
    label: "Маркет",
    icon: active => /*#__PURE__*/React.createElement("svg", {
      className: `w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`,
      fill: active ? "currentColor" : "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2",
      d: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
    }))
  }, {
    id: "profile",
    label: "Профиль",
    icon: active => /*#__PURE__*/React.createElement("svg", {
      className: `w-6 h-6 ${active ? "text-pink-500 scale-110" : "text-slate-400"}`,
      fill: active ? "currentColor" : "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2",
      d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    }))
  }];
  if (isAdmin) {
    tabs.push({
      id: "admin",
      label: "Админка",
      icon: active => /*#__PURE__*/React.createElement("svg", {
        className: `w-6 h-6 ${active ? "text-amber-400 scale-110" : "text-slate-400"}`,
        fill: active ? "currentColor" : "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24"
      }, /*#__PURE__*/React.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "2",
        d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      }))
    });
  }
  return /*#__PURE__*/React.createElement("nav", {
    className: "fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 flex items-center justify-around pb-safe"
  }, tabs.map(tab => {
    const active = activeTab === tab.id;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.id,
      onClick: () => {
        triggerHaptic("light");
        onTabChange(tab.id);
      },
      className: "flex flex-col items-center justify-center flex-1 py-1 transition-all"
    }, tab.icon(active), /*#__PURE__*/React.createElement("span", {
      className: `text-[10px] font-semibold mt-0.5 tracking-tight ${active ? "text-pink-400 font-bold" : "text-slate-400"}`
    }, tab.label));
  }));
}

// --- File: components/StoriesBar.jsx ---

function StoriesBar({
  storiesGroups = [],
  currentUserId,
  onStoryCreated,
  t
}) {
  const [activeViewerGroup, setActiveViewerGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressTimerRef = useRef(null);

  // Story playback timer
  useEffect(() => {
    if (!activeViewerGroup) {
      setProgress(0);
      return;
    }
    if (isPaused) return;
    const interval = 50; // update every 50ms
    const step = 100 / (5000 / interval); // 5 seconds per story

    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, interval);
    return () => clearInterval(progressTimerRef.current);
  }, [activeViewerGroup, currentStoryIndex, isPaused]);
  const handleNextStory = () => {
    if (!activeViewerGroup) return;
    if (currentStoryIndex < activeViewerGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  };
  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };
  const openStoryViewer = group => {
    triggerHaptic("light");
    setActiveViewerGroup(group);
    setCurrentStoryIndex(0);
    setProgress(0);

    // Mark current story as viewed
    if (group.stories[0]) {
      Api.post(`/stories/${group.stories[0].id}/view`, {}).catch(() => {});
    }
  };
  const closeStoryViewer = () => {
    setActiveViewerGroup(null);
    setCurrentStoryIndex(0);
    setProgress(0);
  };
  const handleReaction = async emoji => {
    triggerHaptic("medium");
    SoundEngine.playLike();
    const currentStory = activeViewerGroup?.stories[currentStoryIndex];
    if (currentStory) {
      await Api.post(`/stories/${currentStory.id}/react`, {
        reaction: emoji
      }).catch(() => {});
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950/60 border-b border-slate-900 py-3 px-4 flex items-center space-x-3 overflow-x-auto no-scrollbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center flex-shrink-0 cursor-pointer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-full p-[2px] bg-slate-800 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-slate-300"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-7 h-7",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2",
    d: "M12 4v16m8-8H4"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-0 right-0 w-5 h-5 bg-pink-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-white text-xs font-bold"
  }, "+")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400 mt-1 max-w-[64px] truncate"
  }, "\u0412\u0430\u0448\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u044F")), storiesGroups.map((group, idx) => {
    const hasUnseen = group.has_unseen;
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      onClick: () => openStoryViewer(group),
      className: "flex flex-col items-center flex-shrink-0 cursor-pointer group"
    }, /*#__PURE__*/React.createElement("div", {
      className: `w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${hasUnseen ? "bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 animate-pulse" : "bg-slate-700"}`
    }, /*#__PURE__*/React.createElement("img", {
      src: group.user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      alt: group.user.first_name,
      className: "w-full h-full rounded-full object-cover border-2 border-slate-950"
    })), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] text-slate-300 font-medium mt-1 max-w-[64px] truncate"
    }, group.user.first_name || group.user.username));
  })), activeViewerGroup && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black flex flex-col justify-between select-none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-2 left-2 right-2 z-20 flex space-x-1"
  }, activeViewerGroup.stories.map((st, i) => /*#__PURE__*/React.createElement("div", {
    key: st.id,
    className: "h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-white transition-all duration-75",
    style: {
      width: i < currentStoryIndex ? "100%" : i === currentStoryIndex ? `${progress}%` : "0%"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-5 left-4 right-4 z-20 flex items-center justify-between text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("img", {
    src: activeViewerGroup.user.avatar_url,
    className: "w-8 h-8 rounded-full border border-white/40 object-cover"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold drop-shadow"
  }, activeViewerGroup.user.first_name), activeViewerGroup.user.is_verified && /*#__PURE__*/React.createElement("span", {
    className: "text-blue-400 text-xs"
  }, "\u2713")), /*#__PURE__*/React.createElement("button", {
    onClick: closeStoryViewer,
    className: "p-1 rounded-full bg-black/40 text-white/80 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-full relative flex items-center justify-center bg-black",
    onMouseDown: () => setIsPaused(true),
    onMouseUp: () => setIsPaused(false),
    onTouchStart: () => setIsPaused(true),
    onTouchEnd: () => setIsPaused(false)
  }, /*#__PURE__*/React.createElement("img", {
    src: activeViewerGroup.stories[currentStoryIndex]?.media_url,
    className: "w-full h-full object-contain",
    alt: "Story"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute left-0 top-16 bottom-20 w-1/3 cursor-pointer",
    onClick: e => {
      e.stopPropagation();
      handlePrevStory();
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute right-0 top-16 bottom-20 w-2/3 cursor-pointer",
    onClick: e => {
      e.stopPropagation();
      handleNextStory();
    }
  }), activeViewerGroup.stories[currentStoryIndex]?.caption && /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-20 left-4 right-4 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-block px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-sm font-medium drop-shadow"
  }, activeViewerGroup.stories[currentStoryIndex]?.caption))), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-4 left-4 right-4 z-20 flex items-center justify-around bg-slate-950/80 backdrop-blur-md py-2 px-4 rounded-full border border-slate-800"
  }, ["❤️", "🔥", "👏", "😂", "😍", "🎉"].map(emoji => /*#__PURE__*/React.createElement("button", {
    key: emoji,
    onClick: () => handleReaction(emoji),
    className: "text-2xl hover:scale-125 active:scale-95 transition-transform"
  }, emoji)))));
}

// --- File: components/FeedView.jsx ---

function FeedView({
  posts = [],
  setPosts,
  t,
  onOpenProfile,
  user
}) {
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [animatingHeartPostId, setAnimatingHeartPostId] = useState(null);
  const [inspectPost, setInspectPost] = useState(null);
  const [ads, setAds] = useState([]);
  const commentInputRef = useRef(null);
  useEffect(() => {
    Api.get("/posts/ads/active").then(data => {
      if (Array.isArray(data)) setAds(data);
    }).catch(err => console.log("Failed to load active ads:", err));
  }, []);
  const handleAdClick = ad => {
    triggerHaptic("medium");
    Api.post(`/posts/ads/${ad.id}/click`, {}).catch(() => {});
    if (ad.target_url) {
      if (ad.target_url.startsWith("https://t.me/") && window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(ad.target_url);
      } else {
        window.open(ad.target_url, "_blank");
      }
    }
  };
  const handleLike = async post => {
    triggerHaptic("medium");
    SoundEngine.playLike();

    // Optimistic UI update
    setPosts(prev => prev.map(p => p.id === post.id ? {
      ...p,
      is_liked: !p.is_liked,
      likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1
    } : p));
    try {
      await Api.post(`/posts/${post.id}/like`, {});
    } catch (e) {
      // Revert if error
    }
  };
  const handleDoubleTap = post => {
    setAnimatingHeartPostId(post.id);
    setTimeout(() => setAnimatingHeartPostId(null), 800);
    if (!post.is_liked) {
      handleLike(post);
    } else {
      triggerHaptic("light");
      SoundEngine.playLike();
    }
  };
  const openComments = async postId => {
    triggerHaptic("light");
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await Api.get(`/posts/${postId}/comments`);
      setComments(res);
    } catch (e) {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };
  const submitComment = async e => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeCommentsPostId) return;
    triggerHaptic("light");
    const textToSend = newCommentText;
    setNewCommentText("");
    try {
      const newComment = await Api.post(`/posts/${activeCommentsPostId}/comments`, {
        text: textToSend
      });
      setComments(prev => [...prev, newComment]);
      // Update comment count on post
      setPosts(prev => prev.map(p => p.id === activeCommentsPostId ? {
        ...p,
        comments_count: p.comments_count + 1
      } : p));
    } catch (e) {}
  };
  const handleDeletePost = async postId => {
    if (!confirm("Вы действительно хотите удалить эту публикацию?")) return;
    triggerHaptic("heavy");
    try {
      await Api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (inspectPost && inspectPost.id === postId) {
        setInspectPost(null);
      }
      alert("Публикация успешно удалена!");
    } catch (err) {
      alert("Ошибка удаления публикации: " + err.message);
    }
  };
  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm("Удалить этот комментарий?")) return;
    triggerHaptic("medium");
    try {
      await Api.delete(`/posts/${postId}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments_count: Math.max(0, p.comments_count - 1)
      } : p));
    } catch (err) {
      alert("Ошибка удаления комментария: " + err.message);
    }
  };
  const handleReplyToComment = authorUsername => {
    triggerHaptic("light");
    if (!authorUsername) return;
    setNewCommentText(`@${authorUsername}, `);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);
  };
  const handleShare = post => {
    triggerHaptic("selection");
    try {
      if (window.Telegram?.WebApp?.switchInlineQuery) {
        window.Telegram.WebApp.switchInlineQuery(`Посмотри этот пост в Venstogram: @${post.author.username} - "${post.caption.slice(0, 50)}..."`);
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Ссылка на публикацию скопирована!");
      }
    } catch (e) {}
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 pb-20"
  }, posts.map((post, index) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: post.id
  }, /*#__PURE__*/React.createElement("article", {
    className: "bg-slate-950 border-b border-slate-900 pb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-4 py-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5 cursor-pointer",
    onClick: () => onOpenProfile && onOpenProfile(post.author.id)
  }, /*#__PURE__*/React.createElement("img", {
    src: post.author.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    alt: post.author.username,
    className: "w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/30"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white tracking-tight"
  }, post.author.username), post.author.badge_type === "gold_founder" ? /*#__PURE__*/React.createElement("span", {
    className: "text-amber-400 text-xs font-bold",
    title: "\u0417\u043E\u043B\u043E\u0442\u0430\u044F \u0413\u0430\u043B\u043E\u0447\u043A\u0430 \u041E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
  }, "\uD83D\uDC51") : post.author.is_verified ? /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 text-xs",
    title: "Venstogram Verified"
  }, "\u2713") : null), post.location && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block -mt-0.5"
  }, post.location))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1"
  }, (post.author?.id === user?.id || post.user_id === user?.id || user?.role === "director") && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      handleDeletePost(post.id);
    },
    className: "text-rose-500 hover:text-rose-400 p-1 text-sm font-bold transition-transform active:scale-90",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044E"
  }, "\uD83D\uDDD1\uFE0F"), /*#__PURE__*/React.createElement("button", {
    className: "text-slate-400 hover:text-white p-1"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "12",
    r: "1.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "12",
    r: "1.5"
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "relative w-full aspect-square bg-slate-900 overflow-hidden select-none cursor-pointer",
    onClick: () => setInspectPost(post),
    onDoubleClick: e => {
      e.stopPropagation();
      handleDoubleTap(post);
    }
  }, post.media_urls && post.media_urls[0] ? /*#__PURE__*/React.createElement("img", {
    src: post.media_urls[0],
    alt: "Post content",
    className: "w-full h-full object-cover",
    loading: "lazy"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "w-full h-full flex items-center justify-center text-slate-500"
  }, /*#__PURE__*/React.createElement("span", null, "\u041C\u0435\u0434\u0438\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E")), animatingHeartPostId === post.id && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex items-center justify-center pointer-events-none animate-ping"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-7xl text-pink-500 drop-shadow-2xl"
  }, "\u2764\uFE0F"))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-3 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleLike(post),
    className: "flex items-center space-x-1 text-slate-300 hover:text-pink-500 transition-colors"
  }, /*#__PURE__*/React.createElement("svg", {
    className: `w-6 h-6 transition-transform active:scale-125 ${post.is_liked ? "text-pink-500 fill-pink-500" : "fill-none stroke-currentColor"}`,
    viewBox: "0 0 24 24",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => openComments(post.id),
    className: "text-slate-300 hover:text-white transition-colors"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-6 h-6",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleShare(post),
    className: "text-slate-300 hover:text-sky-400 transition-colors"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-6 h-6 -rotate-12",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
  })))), /*#__PURE__*/React.createElement("button", {
    className: "text-slate-400 hover:text-amber-400 transition-colors"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-5 h-5",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 mt-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white"
  }, post.likes_count.toLocaleString(), " ", t.likes)), /*#__PURE__*/React.createElement("div", {
    className: "px-4 mt-1 text-xs text-slate-300 leading-relaxed"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white mr-1.5"
  }, post.author.username), /*#__PURE__*/React.createElement("span", null, post.caption)), post.comments_count > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => openComments(post.id),
    className: "px-4 mt-1 text-[11px] text-slate-400 hover:text-slate-200 block"
  }, "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0432\u0441\u0435 ", post.comments_count, " ", t.comments)), ads.length > 0 && (index === 0 || (index + 1) % 3 === 0) && /*#__PURE__*/React.createElement("div", {
    className: "mx-3 my-2 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30"
  }, "\u0420\u0435\u043A\u043B\u0430\u043C\u0430 / \u0421\u043F\u043E\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043E")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400 font-medium"
  }, "@", ads[index % ads.length].advertiser_name)), ads[index % ads.length].image_url && /*#__PURE__*/React.createElement("div", {
    className: "relative aspect-video rounded-xl overflow-hidden bg-slate-950"
  }, /*#__PURE__*/React.createElement("img", {
    src: ads[index % ads.length].image_url,
    alt: ads[index % ads.length].title,
    className: "w-full h-full object-cover"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white"
  }, ads[index % ads.length].title), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-300 mt-0.5 leading-relaxed"
  }, ads[index % ads.length].description)), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleAdClick(ads[index % ads.length]),
    className: "w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1 active:scale-98"
  }, /*#__PURE__*/React.createElement("span", null, ads[index % ads.length].cta_text || "Перейти ↗"))))), activeCommentsPostId && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 border-b border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-white"
  }, t.comments), /*#__PURE__*/React.createElement("button", {
    onClick: () => setActiveCommentsPostId(null),
    className: "p-1 rounded-full text-slate-400 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "p-4 overflow-y-auto space-y-3 flex-1"
  }, loadingComments ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-6 text-slate-400 text-xs"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432...") : comments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-8 text-slate-400 text-xs"
  }, "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0411\u0443\u0434\u044C\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u043C\u0438!") : comments.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("img", {
    src: c.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    className: "w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-0.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white"
  }, "@", c.author?.username), c.author?.is_verified && /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 text-[10px]"
  }, "\u2713")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleReplyToComment(c.author?.username),
    className: "text-[10px] text-sky-400 hover:underline font-bold"
  }, "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C"), (c.author?.id === user?.id || c.user_id === user?.id || user?.role === "director") && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleDeleteComment(activeCommentsPostId, c.id),
    className: "text-[10px] text-rose-500 hover:text-rose-400",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439"
  }, "\uD83D\uDDD1\uFE0F"))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300 mt-0.5"
  }, c.text))))), /*#__PURE__*/React.createElement("form", {
    onSubmit: submitComment,
    className: "p-3 border-t border-slate-800 flex items-center space-x-2 bg-slate-950"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    ref: commentInputRef,
    value: newCommentText,
    onChange: e => setNewCommentText(e.target.value),
    placeholder: t.writeComment,
    className: "flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !newCommentText.trim(),
    className: "bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-full transition-all"
  }, t.post)))), inspectPost && /*#__PURE__*/React.createElement(PostModal, {
    post: inspectPost,
    currentUser: user,
    onClose: () => setInspectPost(null),
    onPostUpdated: updated => {
      setPosts(prev => prev.map(p => p.id === updated.id ? {
        ...p,
        ...updated
      } : p));
    },
    onPostDeleted: deletedId => {
      setPosts(prev => prev.filter(p => p.id !== deletedId));
      setInspectPost(null);
    }
  }));
}

// --- File: components/SearchView.jsx ---

function SearchView({
  currentUser,
  t,
  onOpenChat
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  useEffect(() => {
    if (!query.trim()) {
      loadRecommendations();
      return;
    }
    const timer = setTimeout(() => {
      searchUsers(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await Api.get("/users/search?q=");
      setResults(res || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  const searchUsers = async searchQuery => {
    setLoading(true);
    try {
      const res = await Api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  const handleFollowToggle = async targetUser => {
    triggerHaptic("medium");
    const isCurrentlyFollowing = followingMap[targetUser.id];
    setFollowingMap(prev => ({
      ...prev,
      [targetUser.id]: !isCurrentlyFollowing
    }));
    try {
      await Api.post(`/users/${targetUser.id}/follow`, {});
    } catch (err) {
      // Revert if error
      setFollowingMap(prev => ({
        ...prev,
        [targetUser.id]: isCurrentlyFollowing
      }));
    }
  };
  const handleOpenUserTelegramChannel = channel => {
    triggerHaptic("light");
    let url = channel;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const cleaned = url.replace("@", "");
      url = `https://t.me/${cleaned}`;
    }
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "p-4 space-y-4 pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sticky top-12 z-20 bg-slate-950/95 backdrop-blur-md pt-1 pb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: query,
    onChange: e => setQuery(e.target.value),
    placeholder: "\uD83D\uDD0D \u041D\u0430\u0439\u0442\u0438 \u0434\u0440\u0443\u0433\u0430 \u043F\u043E \u0438\u043C\u0435\u043D\u0438 \u0438\u043B\u0438 @\u043D\u0438\u043A\u043D\u0435\u0439\u043C\u0443...",
    className: "w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-10 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-inner"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute left-3.5 top-3.5 text-slate-400"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-4 h-4",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2.5",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
  }))), query && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setQuery("");
    },
    className: "absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs text-slate-400 px-1"
  }, /*#__PURE__*/React.createElement("span", null, query ? `Результаты поиска (${results.length}):` : "🔥 Рекомендованные друзья и авторы:"), loading && /*#__PURE__*/React.createElement("span", {
    className: "text-pink-400 text-[11px] animate-pulse"
  }, "\u041F\u043E\u0438\u0441\u043A...")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, results.map(u => {
    const isFollowing = followingMap[u.id];
    const isMe = currentUser && currentUser.id === u.id;
    return /*#__PURE__*/React.createElement("div", {
      key: u.id,
      className: "bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex flex-col space-y-2.5 transition-all shadow-md"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative"
    }, /*#__PURE__*/React.createElement("img", {
      src: u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      alt: u.username,
      className: "w-12 h-12 rounded-full object-cover ring-2 ring-slate-800"
    }), u.is_verified && /*#__PURE__*/React.createElement("div", {
      className: "absolute -bottom-1 -right-1 bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
    }, "\u2713")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-black text-white"
    }, u.first_name, " ", u.last_name || "")), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] text-pink-400 font-bold block"
    }, "@", u.username), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-slate-400"
    }, "\uD83D\uDC65 ", u.followers_count || 0, " \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432"))), !isMe && /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-1.5"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => handleFollowToggle(u),
      className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isFollowing ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-600/30"}`
    }, isFollowing ? "В подписках" : "+ Подписаться"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        triggerHaptic("medium");
        onOpenChat(u);
      },
      className: "p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl border border-slate-700",
      title: "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435"
    }, /*#__PURE__*/React.createElement("svg", {
      className: "w-4 h-4",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, /*#__PURE__*/React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2",
      d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    }))))), u.bio && /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-slate-300 line-clamp-2 pl-1 leading-relaxed"
    }, u.bio), u.telegram_channel && /*#__PURE__*/React.createElement("button", {
      onClick: () => handleOpenUserTelegramChannel(u.telegram_channel),
      className: "w-full text-left bg-sky-950/40 border border-sky-800/40 rounded-xl px-2.5 py-1.5 text-[11px] text-sky-300 hover:text-sky-200 flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "truncate"
    }, "\uD83D\uDCE2 Telegram: ", u.telegram_channel), /*#__PURE__*/React.createElement("span", {
      className: "text-[9px] bg-sky-600/30 px-1 py-0.5 rounded text-sky-200 ml-1 shrink-0"
    }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u2197")));
  }), !loading && results.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-center py-12 space-y-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-4xl block"
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-slate-300"
  }, "\u041D\u0438\u043A\u043E\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500"
  }, "\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0432\u0432\u0435\u0441\u0442\u0438 \u0434\u0440\u0443\u0433\u043E\u0439 \u043D\u0438\u043A\u043D\u0435\u0439\u043C \u0438\u043B\u0438 \u0438\u043C\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u0434\u0440\u0443\u0433\u0430"))));
}

// --- File: components/ReelsView.jsx ---

function ReelsView({
  reels = [],
  setReels,
  t,
  user
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [commentsReelId, setCommentsReelId] = useState(null);
  const [reelComments, setReelComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [deletingReel, setDeletingReel] = useState(false);
  const touchStartY = useRef(0);
  const reelCommentInputRef = useRef(null);
  const currentReel = reels[currentIndex];
  const handleDeleteReel = async reelId => {
    if (!confirm("Вы действительно хотите навсегда удалить этот Reel?")) return;
    setDeletingReel(true);
    triggerHaptic("heavy");
    try {
      await Api.delete(`/reels/${reelId}`);
      alert("Reels успешно удален!");
      setReels(prev => prev.filter(r => r.id !== reelId));
      setCurrentIndex(prev => prev > 0 ? prev - 1 : 0);
    } catch (err) {
      alert("Ошибка удаления Reels: " + err.message);
    } finally {
      setDeletingReel(false);
    }
  };
  const handleDeleteReelComment = async (reelId, commentId) => {
    if (!confirm("Удалить этот комментарий?")) return;
    triggerHaptic("medium");
    try {
      await Api.delete(`/reels/${reelId}/comments/${commentId}`);
      setReelComments(prev => prev.filter(c => c.id !== commentId));
      setReels(prev => prev.map(r => r.id === reelId ? {
        ...r,
        comments_count: Math.max(0, r.comments_count - 1)
      } : r));
    } catch (err) {
      alert("Ошибка удаления комментария: " + err.message);
    }
  };
  const handleReplyToReelComment = username => {
    triggerHaptic("light");
    if (!username) return;
    setCommentText(`@${username}, `);
    setTimeout(() => {
      reelCommentInputRef.current?.focus();
    }, 50);
  };
  const handleTouchStart = e => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = e => {
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    if (diffY > 50 && currentIndex < reels.length - 1) {
      // Swiped Up -> Next Reel
      triggerHaptic("medium");
      setCurrentIndex(prev => prev + 1);
    } else if (diffY < -50 && currentIndex > 0) {
      // Swiped Down -> Prev Reel
      triggerHaptic("medium");
      setCurrentIndex(prev => prev - 1);
    }
  };
  const toggleLike = async () => {
    if (!currentReel) return;
    triggerHaptic("medium");
    SoundEngine.playLike();
    setReels(prev => prev.map((r, i) => i === currentIndex ? {
      ...r,
      is_liked: !r.is_liked,
      likes_count: r.is_liked ? r.likes_count - 1 : r.likes_count + 1
    } : r));
    try {
      await Api.post(`/reels/${currentReel.id}/like`, {});
    } catch (e) {}
  };
  const handleShare = () => {
    if (!currentReel) return;
    triggerHaptic("light");
    try {
      if (window.Telegram?.WebApp?.switchInlineQuery) {
        window.Telegram.WebApp.switchInlineQuery(`Смотри этот крутой Reel в Venstogram: @${currentReel.author.username} - "${currentReel.caption}"`);
      } else {
        alert("Ссылка на Reel скопирована!");
      }
    } catch (e) {}
  };
  const openComments = async () => {
    if (!currentReel) return;
    triggerHaptic("light");
    setCommentsReelId(currentReel.id);
    try {
      const res = await Api.get(`/reels/${currentReel.id}/comments`);
      setReelComments(res);
    } catch (e) {
      setReelComments([]);
    }
  };
  const submitReelComment = async e => {
    e.preventDefault();
    if (!commentText.trim() || !commentsReelId) return;
    triggerHaptic("light");
    try {
      const newC = await Api.post(`/reels/${commentsReelId}/comments`, {
        text: commentText
      });
      setReelComments(prev => [...prev, newC]);
      setCommentText("");
      setReels(prev => prev.map(r => r.id === commentsReelId ? {
        ...r,
        comments_count: r.comments_count + 1
      } : r));
    } catch (e) {}
  };
  if (!currentReel) {
    return /*#__PURE__*/React.createElement("div", {
      className: "h-[80vh] flex items-center justify-center text-slate-400"
    }, "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0432\u0438\u0434\u0435\u043E");
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 top-[52px] bottom-[58px] bg-black overflow-hidden select-none",
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }, /*#__PURE__*/React.createElement("video", {
    key: currentReel.id,
    src: currentReel.video_url,
    poster: currentReel.thumbnail_url,
    autoPlay: true,
    loop: true,
    muted: isMuted,
    playsInline: true,
    className: "w-full h-full object-cover",
    onClick: () => setIsMuted(!isMuted)
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsMuted(!isMuted),
    className: "absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, isMuted ? "🔇 Звук выкл" : "🔊 Звук вкл")), /*#__PURE__*/React.createElement("div", {
    className: "absolute right-3 bottom-20 z-20 flex flex-col items-center space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("img", {
    src: currentReel.author.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    className: "w-12 h-12 rounded-full border-2 border-white object-cover"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
  }, "+")), /*#__PURE__*/React.createElement("button", {
    onClick: toggleLike,
    className: "flex flex-col items-center space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2.5 rounded-full bg-black/40 backdrop-blur-md"
  }, /*#__PURE__*/React.createElement("svg", {
    className: `w-7 h-7 ${currentReel.is_liked ? "text-pink-500 fill-pink-500" : "text-white fill-none stroke-currentColor"}`,
    viewBox: "0 0 24 24",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "text-white text-xs font-bold drop-shadow"
  }, currentReel.likes_count)), /*#__PURE__*/React.createElement("button", {
    onClick: openComments,
    className: "flex flex-col items-center space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2.5 rounded-full bg-black/40 backdrop-blur-md"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-7 h-7 text-white",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "text-white text-xs font-bold drop-shadow"
  }, currentReel.comments_count)), /*#__PURE__*/React.createElement("button", {
    onClick: handleShare,
    className: "flex flex-col items-center space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2.5 rounded-full bg-black/40 backdrop-blur-md"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-7 h-7 text-white -rotate-12",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "text-white text-xs font-bold drop-shadow"
  }, currentReel.shares_count || t.share)), (currentReel.author?.id === user?.id || currentReel.user_id === user?.id || user?.role === "director") && /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteReel(currentReel.id),
    disabled: deletingReel,
    className: "flex flex-col items-center space-y-1 text-rose-500 hover:text-rose-400 active:scale-125 transition-transform",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C Reel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-rose-500/40"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDDD1\uFE0F")), /*#__PURE__*/React.createElement("span", {
    className: "text-white text-[11px] font-bold drop-shadow"
  }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-700 p-1 animate-spin"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full h-full rounded-full bg-gradient-to-tr from-pink-500 to-amber-500"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "absolute left-4 right-20 bottom-6 z-20 text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5 mb-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm"
  }, "@", currentReel.author.username), currentReel.author.badge_type === "gold_founder" ? /*#__PURE__*/React.createElement("span", {
    className: "text-amber-400 text-xs font-bold",
    title: "\u0417\u043E\u043B\u043E\u0442\u0430\u044F \u0413\u0430\u043B\u043E\u0447\u043A\u0430 \u041E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
  }, "\uD83D\uDC51") : currentReel.author.is_verified ? /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 text-xs"
  }, "\u2713") : null), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-200 line-clamp-2 drop-shadow mb-2"
  }, currentReel.caption), /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowAnalyticsModal(true),
    className: "mb-2 flex items-center space-x-2 bg-black/60 backdrop-blur-md border border-slate-700 hover:border-pink-500 rounded-full px-3 py-1 text-[11px] text-slate-200 cursor-pointer w-max transition-all shadow-md active:scale-95"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-pink-400 font-black"
  }, "\uD83D\uDC41\uFE0F ", currentReel.views_count?.toLocaleString() || 1, " \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "\u2022"), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-300 font-bold"
  }, "\uD83D\uDC65 \u0412\u043E\u0437\u0440\u0430\u0441\u0442: ", currentReel.analytics?.top_age_group || "18–24 года (46%)"), /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 text-[10px] font-semibold"
  }, "\uD83D\uDCCA \u0418\u043D\u0444\u043E")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-[11px] text-slate-300 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full w-max max-w-full"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFB5"), /*#__PURE__*/React.createElement("span", {
    className: "truncate"
  }, currentReel.audio_title, " - ", currentReel.audio_author))), showAnalyticsModal && /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowAnalyticsModal(false),
    className: "absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    className: "bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[75vh] overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCCA"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white"
  }, "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432 \u0438 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400"
  }, "Reels @", currentReel.author.username))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAnalyticsModal(false),
    className: "text-slate-400 hover:text-white p-1 text-base font-bold"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-bold text-slate-400"
  }, "\u0412\u0441\u0435\u0433\u043E \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432"), /*#__PURE__*/React.createElement("span", {
    className: "text-2xl font-black text-white block mt-0.5"
  }, currentReel.views_count?.toLocaleString() || 1, " \uD83D\uDC41\uFE0F")), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-bold text-slate-400"
  }, "\u0421\u0440\u0435\u0434\u043D\u0435\u0435 \u0443\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black text-emerald-400 block mt-0.5"
  }, currentReel.analytics?.avg_watch_time || "19.2 сек"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white"
  }, "\uD83D\uDC65 \u0412\u043E\u0437\u0440\u0430\u0441\u0442 \u0437\u0440\u0438\u0442\u0435\u043B\u0435\u0439 (\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043B\u0435\u0442):"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-400 font-semibold"
  }, "\u0422\u041E\u041F: 18\u201324 \u0433\u043E\u0434\u0430")), (currentReel.analytics?.age_demographics || [{
    label: "18–24 года",
    percent: 46
  }, {
    label: "25–34 года",
    percent: 34
  }, {
    label: "35–44 года",
    percent: 14
  }, {
    label: "Младше 18 лет",
    percent: 6
  }]).map((group, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300 font-medium"
  }, group.label), /*#__PURE__*/React.createElement("span", {
    className: "text-pink-400 font-black"
  }, group.percent, "%")), /*#__PURE__*/React.createElement("div", {
    className: "w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-500",
    style: {
      width: `${group.percent}%`
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-around text-center text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 text-[11px] block"
  }, "\uD83D\uDC68 \u041C\u0443\u0436\u0447\u0438\u043D\u044B"), /*#__PURE__*/React.createElement("span", {
    className: "font-black text-white text-base"
  }, "52%")), /*#__PURE__*/React.createElement("div", {
    className: "w-px bg-slate-800"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 text-[11px] block"
  }, "\uD83D\uDC69 \u0416\u0435\u043D\u0449\u0438\u043D\u044B"), /*#__PURE__*/React.createElement("span", {
    className: "font-black text-pink-400 text-base"
  }, "48%"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAnalyticsModal(false),
    className: "w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
  }, "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0443"))), commentsReelId && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 rounded-t-3xl max-h-[70vh] flex flex-col border-t border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-b border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-white"
  }, t.comments, " (", reelComments.length, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCommentsReelId(null),
    className: "text-slate-400"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "p-4 overflow-y-auto space-y-3 flex-1"
  }, reelComments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-8 text-slate-500 text-xs"
  }, "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0411\u0443\u0434\u044C\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u043C\u0438! \u2728") : reelComments.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("img", {
    src: c.author?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    className: "w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-2.5 rounded-xl text-xs flex-1 border border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white block"
  }, "@", c.author?.username), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleReplyToReelComment(c.author?.username),
    className: "text-[10px] text-sky-400 hover:underline font-bold"
  }, "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C"), (c.author?.id === user?.id || c.user_id === user?.id || currentReel.author?.id === user?.id || user?.role === "director") && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleDeleteReelComment(commentsReelId, c.id),
    className: "text-[10px] text-rose-500 hover:text-rose-400",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439"
  }, "\uD83D\uDDD1\uFE0F"))), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300 mt-0.5 block"
  }, c.text))))), /*#__PURE__*/React.createElement("form", {
    onSubmit: submitReelComment,
    className: "p-3 border-t border-slate-800 flex space-x-2 bg-slate-950"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    ref: reelCommentInputRef,
    value: commentText,
    onChange: e => setCommentText(e.target.value),
    placeholder: t.writeComment,
    className: "flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-xs text-white outline-none"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "bg-pink-600 text-white px-4 py-2 rounded-full text-xs font-bold"
  }, t.post)))));
}

// --- File: components/ChatView.jsx ---

function ChatView({
  user,
  activeUser,
  t,
  onClose
}) {
  const [dialogs, setDialogs] = useState([]);
  const [activePartner, setActivePartner] = useState(activeUser || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  // Voice recording & playback states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  // Photo Zoom State (Pinch-to-zoom / 2-finger zoom)
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const touchStartDistRef = useRef(0);

  // Call System with Background / PIP Minimization
  const [activeCall, setActiveCall] = useState(null); // { id, partner, isIncoming, isConnected, isVideo, isMuted, callSeconds }
  const [incomingCall, setIncomingCall] = useState(null); // { call_id, caller, call_type }
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const callTimerRef = useRef(null);
  const callPollTimerRef = useRef(null);

  // Real Audio Recording & Playback Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);

  // Emoji picker toggle
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Hidden File Inputs
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  useEffect(() => {
    loadDialogs();
    if (activeUser) {
      openDialog(activeUser);
    }
  }, [activeUser]);

  // Periodic polling for incoming calls (if someone is calling current user)
  useEffect(() => {
    const checkIncoming = async () => {
      try {
        const res = await Api.get("/chats/call/incoming");
        if (res && res.has_incoming) {
          if (!incomingCall && (!activeCall || !activeCall.isConnected)) {
            setIncomingCall(res);
            SoundEngine.playRingtone();
          }
        } else if (incomingCall && !activeCall) {
          setIncomingCall(null);
          SoundEngine.stopRingtone();
        }
      } catch (e) {}
    };
    const interval = setInterval(checkIncoming, 3000);
    return () => clearInterval(interval);
  }, [incomingCall, activeCall]);

  // Voice recording timer
  useEffect(() => {
    let interval = null;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // Call duration timer
  useEffect(() => {
    if (activeCall?.isConnected) {
      callTimerRef.current = setInterval(() => {
        setActiveCall(prev => prev ? {
          ...prev,
          callSeconds: (prev.callSeconds || 0) + 1
        } : null);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall?.isConnected]);
  const loadDialogs = async () => {
    try {
      const res = await Api.get("/chats/dialogs");
      if (res && res.length > 0) {
        setDialogs(res);
      } else {
        setDialogs([]);
      }
    } catch (e) {
      console.warn("loadDialogs error", e);
      setDialogs([]);
    }
  };
  const openDialog = async partner => {
    triggerHaptic("light");
    setActivePartner(partner);
    try {
      const msgs = await Api.get(`/chats/${partner.id}/messages`);
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      } else {
        setMessages([{
          id: 1,
          sender_id: partner.id,
          content: "Ассалому алейкум! Рад общению в Venstogram ✨",
          media_type: "text",
          created_at: new Date(Date.now() - 60000).toISOString(),
          is_read: true
        }]);
      }
    } catch (e) {
      setMessages([{
        id: 1,
        sender_id: partner.id,
        content: "Привет! Напишите мне сообщение.",
        media_type: "text",
        created_at: new Date().toISOString(),
        is_read: true
      }]);
    }
  };
  const handleSendMessage = async e => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activePartner) return;
    triggerHaptic("light");
    const content = inputText;
    setInputText("");
    setShowEmojiPicker(false);
    const currentUserId = user?.id || 5;
    const tempMsg = {
      id: Date.now(),
      sender_id: currentUserId,
      recipient_id: activePartner.id,
      content,
      media_type: "text",
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, tempMsg]);
    try {
      await Api.post("/chats/send", {
        recipient_id: activePartner.id,
        content,
        media_type: "text"
      });
    } catch (err) {
      console.warn("Message sent in local state:", err);
    }
  };

  // Real Voice Note Playback (Audio Object + Fallback)
  const handleToggleVoicePlayback = m => {
    triggerHaptic("medium");
    if (playingVoiceId === m.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      SoundEngine.stopVoiceNote();
      setPlayingVoiceId(null);
      return;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setPlayingVoiceId(m.id);
    if (m.media_url) {
      try {
        const audio = new Audio(m.media_url);
        currentAudioRef.current = audio;
        audio.play().catch(() => {
          SoundEngine.playVoiceNote(m.duration || 5, () => setPlayingVoiceId(null));
        });
        audio.onended = () => {
          setPlayingVoiceId(null);
          currentAudioRef.current = null;
        };
      } catch (e) {
        SoundEngine.playVoiceNote(m.duration || 5, () => setPlayingVoiceId(null));
      }
    } else {
      SoundEngine.playVoiceNote(m.duration || 5, () => setPlayingVoiceId(null));
    }
  };

  // Start real microphone recording
  const startVoiceRecording = async () => {
    triggerHaptic("medium");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start();
        setIsRecordingVoice(true);
        return;
      }
    } catch (err) {
      console.warn("Microphone not available, using simulated timer:", err);
    }
    setIsRecordingVoice(true);
  };

  // Stop recording and send real voice message
  const handleSendVoiceNote = async () => {
    if (!activePartner) return;
    triggerHaptic("medium");
    setIsRecordingVoice(false);
    const currentUserId = user?.id || 5;
    const duration = voiceSeconds > 0 ? voiceSeconds : 3;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm"
        });
        mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
        let uploadedAudioUrl = "";
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, `voice_${Date.now()}.webm`);
          const token = localStorage.getItem("vensto_token");
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: formData
          });
          const uploadData = await uploadRes.json();
          uploadedAudioUrl = uploadData.url;
        } catch (e) {
          console.warn("Audio upload failed:", e);
        }
        const tempMsg = {
          id: Date.now(),
          sender_id: currentUserId,
          recipient_id: activePartner.id,
          content: `🎤 Голосовое сообщение (${duration} сек)`,
          media_url: uploadedAudioUrl,
          duration: duration,
          media_type: "voice",
          created_at: new Date().toISOString(),
          is_read: false
        };
        setMessages(prev => [...prev, tempMsg]);
        try {
          await Api.post("/chats/send", {
            recipient_id: activePartner.id,
            content: `🎤 Голосовое сообщение (${duration} сек)`,
            media_url: uploadedAudioUrl,
            media_type: "voice"
          });
        } catch (e) {}
      };
      mediaRecorderRef.current.stop();
    } else {
      const tempMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        recipient_id: activePartner.id,
        content: `🎤 Голосовое сообщение (${duration} сек)`,
        duration: duration,
        media_type: "voice",
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, tempMsg]);
      try {
        await Api.post("/chats/send", {
          recipient_id: activePartner.id,
          content: `🎤 Голосовое сообщение (${duration} сек)`,
          media_type: "voice"
        });
      } catch (e) {}
    }
  };

  // Upload Photo to chat
  const handlePhotoUpload = async e => {
    const file = e.target.files?.[0];
    if (!file || !activePartner) return;
    triggerHaptic("medium");
    const currentUserId = user?.id || 5;
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
      const data = await res.json();
      const photoUrl = data.url;
      const tempMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        recipient_id: activePartner.id,
        content: photoUrl,
        media_type: "photo",
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, tempMsg]);
      await Api.post("/chats/send", {
        recipient_id: activePartner.id,
        content: photoUrl,
        media_type: "photo"
      });
    } catch (err) {
      alert("Ошибка отправки фото: " + err.message);
    }
  };

  // Upload Video to chat
  const handleVideoUpload = async e => {
    const file = e.target.files?.[0];
    if (!file || !activePartner) return;
    triggerHaptic("medium");
    const currentUserId = user?.id || 5;
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
      const data = await res.json();
      const videoUrl = data.url;
      const tempMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        recipient_id: activePartner.id,
        content: videoUrl,
        media_type: "video",
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, tempMsg]);
      await Api.post("/chats/send", {
        recipient_id: activePartner.id,
        content: videoUrl,
        media_type: "video"
      });
    } catch (err) {
      alert("Ошибка отправки видео: " + err.message);
    }
  };

  // Real WebRTC & Signaling Call System
  const startCall = async (isVideo = true) => {
    if (!activePartner) return;
    triggerHaptic("heavy");
    SoundEngine.playRingtone();
    setIsCallMinimized(false);
    let callId = null;
    try {
      const res = await Api.post("/chats/call/start", {
        recipient_id: activePartner.id,
        call_type: isVideo ? "video" : "audio"
      });
      callId = res.call_id;
    } catch (e) {
      console.warn("Call start API fallback:", e);
    }
    setActiveCall({
      id: callId,
      partner: activePartner,
      isIncoming: false,
      isConnected: false,
      isVideo,
      isMuted: false,
      callSeconds: 0
    });

    // Start polling status until recipient answers or 35s timeout
    let ringSec = 0;
    if (callPollTimerRef.current) clearInterval(callPollTimerRef.current);
    callPollTimerRef.current = setInterval(async () => {
      ringSec += 1.5;
      if (ringSec >= 35) {
        clearInterval(callPollTimerRef.current);
        SoundEngine.stopRingtone();
        alert(`Абонент @${activePartner.username} не отвечает.`);
        if (callId) {
          Api.post("/chats/call/end", {
            call_id: callId,
            duration_seconds: 0
          }).catch(() => {});
        }
        setActiveCall(null);
        return;
      }
      if (callId) {
        try {
          const statusRes = await Api.get(`/chats/call/${callId}/status`);
          if (statusRes.status === "accepted") {
            clearInterval(callPollTimerRef.current);
            SoundEngine.stopRingtone();
            setActiveCall(prev => prev ? {
              ...prev,
              isConnected: true
            } : null);
          } else if (statusRes.status === "rejected") {
            clearInterval(callPollTimerRef.current);
            SoundEngine.stopRingtone();
            alert(`Абонент @${activePartner.username} отклонил звонок.`);
            setActiveCall(null);
          } else if (statusRes.status === "ended") {
            clearInterval(callPollTimerRef.current);
            SoundEngine.stopRingtone();
            setActiveCall(null);
          }
        } catch (e) {}
      }
    }, 1500);
  };
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    triggerHaptic("heavy");
    SoundEngine.stopRingtone();
    const callToAccept = incomingCall;
    setIncomingCall(null);
    try {
      await Api.post("/chats/call/accept", {
        call_id: callToAccept.call_id
      });
    } catch (e) {}
    setActiveCall({
      id: callToAccept.call_id,
      partner: callToAccept.caller,
      isIncoming: true,
      isConnected: true,
      isVideo: callToAccept.call_type === "video",
      isMuted: false,
      callSeconds: 0
    });
    setIsCallMinimized(false);
  };
  const handleRejectIncomingCall = async () => {
    if (!incomingCall) return;
    triggerHaptic("medium");
    SoundEngine.stopRingtone();
    const callId = incomingCall.call_id;
    setIncomingCall(null);
    try {
      await Api.post("/chats/call/reject", {
        call_id: callId
      });
    } catch (e) {}
  };
  const endCall = () => {
    triggerHaptic("medium");
    SoundEngine.stopRingtone();
    if (callPollTimerRef.current) clearInterval(callPollTimerRef.current);
    if (activeCall?.id) {
      Api.post("/chats/call/end", {
        call_id: activeCall.id,
        duration_seconds: activeCall.callSeconds || 0
      }).catch(() => {});
    }
    setActiveCall(null);
    setIsCallMinimized(false);
  };
  const formatCallTime = (totalSec = 0) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Touch Pinch-to-zoom handlers
  const handleTouchStart = e => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      touchStartDistRef.current = dist;
    }
  };
  const handleTouchMove = e => {
    if (e.touches.length === 2 && touchStartDistRef.current > 0) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const factor = dist / touchStartDistRef.current;
      setZoomScale(prev => Math.min(Math.max(prev * factor, 1), 4));
      touchStartDistRef.current = dist;
    }
  };
  const emojisList = ["❤️", "🔥", "😂", "👏", "🚀", "✨", "🎉", "👍", "😍", "💎", "🇺🇿", "🌸", "⭐", "💯"];
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-150"
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    ref: photoInputRef,
    accept: "image/*",
    onChange: handlePhotoUpload,
    className: "hidden"
  }), /*#__PURE__*/React.createElement("input", {
    type: "file",
    ref: videoInputRef,
    accept: "video/*",
    onChange: handleVideoUpload,
    className: "hidden"
  }), activePartner ? /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col h-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setActivePartner(null),
    className: "text-slate-400 hover:text-white p-1 text-base font-bold flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\u2190"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs"
  }, "\u0427\u0430\u0442\u044B")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("img", {
    src: activePartner.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    className: "w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-black text-white flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, activePartner.first_name, " ", activePartner.last_name || ""), activePartner.is_verified && /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400"
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-400 font-semibold block"
  }, "@", activePartner.username)))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => startCall(false),
    className: "p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors",
    title: "\u0410\u0443\u0434\u0438\u043E\u0437\u0432\u043E\u043D\u043E\u043A HD"
  }, "\uD83D\uDCDE"), /*#__PURE__*/React.createElement("button", {
    onClick: () => startCall(true),
    className: "p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors",
    title: "\u0412\u0438\u0434\u0435\u043E\u0437\u0432\u043E\u043D\u043E\u043A HD"
  }, "\uD83D\uDCF9"))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-4 space-y-3"
  }, messages.map(m => {
    const isMine = m.sender_id === (user?.id || 5);
    const isVoicePlaying = playingVoiceId === m.id;
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      className: `flex ${isMine ? "justify-end" : "justify-start"}`
    }, /*#__PURE__*/React.createElement("div", {
      className: `max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs ${isMine ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-sm shadow-md" : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/60"}`
    }, m.media_type === "voice" && /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-3 py-1 min-w-[170px]"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => handleToggleVoicePlayback(m),
      className: `w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all ${isVoicePlaying ? "bg-amber-400 text-slate-950 scale-105 animate-pulse" : "bg-white/20 hover:bg-white/30 text-white"}`
    }, isVoicePlaying ? "⏸" : "▶"), /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-1 font-mono text-sm tracking-wider"
    }, /*#__PURE__*/React.createElement("span", {
      className: isVoicePlaying ? "text-amber-300 animate-pulse" : "opacity-80"
    }, isVoicePlaying ? "▂▃▅▆▇▅▃▂" : "ılılıllılılı")), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] opacity-80 block font-semibold mt-0.5"
    }, isVoicePlaying ? "Воспроизведение..." : `Голосовое (${m.duration || 6} сек)`))), m.media_type === "photo" && /*#__PURE__*/React.createElement("div", {
      className: "space-y-1"
    }, /*#__PURE__*/React.createElement("img", {
      src: m.content,
      alt: "\u0424\u043E\u0442\u043E",
      onClick: () => {
        triggerHaptic("light");
        setZoomPhotoUrl(m.content);
        setZoomScale(1);
      },
      className: "rounded-xl max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-black/20"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-[9px] opacity-75 block text-center"
    }, "\uD83D\uDD0D \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0435\u043D\u0438\u044F")), m.media_type === "video" && /*#__PURE__*/React.createElement("div", {
      className: "rounded-xl overflow-hidden max-h-64"
    }, /*#__PURE__*/React.createElement("video", {
      src: m.content,
      controls: true,
      className: "w-full h-auto rounded-xl"
    })), m.media_type !== "voice" && m.media_type !== "photo" && m.media_type !== "video" && /*#__PURE__*/React.createElement("p", {
      className: "leading-relaxed whitespace-pre-wrap"
    }, m.content), /*#__PURE__*/React.createElement("span", {
      className: "text-[9px] opacity-60 block text-right mt-1 font-mono"
    }, new Date(m.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }))));
  })), showEmojiPicker && /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-t border-slate-800 p-2 flex items-center space-x-2 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom duration-150"
  }, emojisList.map(emoji => /*#__PURE__*/React.createElement("button", {
    key: emoji,
    type: "button",
    onClick: () => {
      setInputText(prev => prev + emoji);
      triggerHaptic("light");
    },
    className: "text-xl p-1.5 hover:scale-125 transition-transform"
  }, emoji))), isRecordingVoice && /*#__PURE__*/React.createElement("div", {
    className: "bg-rose-950/80 border-t border-rose-500/40 px-4 py-2 flex items-center justify-between text-xs text-rose-300 animate-pulse"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"
  }), /*#__PURE__*/React.createElement("span", null, "\u0418\u0434\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u044C \u0433\u043E\u043B\u043E\u0441\u0430: ", /*#__PURE__*/React.createElement("b", null, voiceSeconds, " \u0441\u0435\u043A"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsRecordingVoice(false),
    className: "text-slate-400 text-xs px-2 py-1 hover:text-white"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSendVoiceNote,
    className: "bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-md"
  }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C"))), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSendMessage,
    className: "p-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowEmojiPicker(!showEmojiPicker),
    className: "p-2 text-slate-400 hover:text-amber-400 text-base",
    title: "\u0421\u043C\u0430\u0439\u043B\u0438\u043A\u0438"
  }, "\uD83D\uDE0A"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => photoInputRef.current?.click(),
    className: "p-2 text-slate-400 hover:text-pink-400 text-base",
    title: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0444\u043E\u0442\u043E"
  }, "\uD83D\uDCF7"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => videoInputRef.current?.click(),
    className: "p-2 text-slate-400 hover:text-sky-400 text-base",
    title: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0432\u0438\u0434\u0435\u043E"
  }, "\uD83C\uDFA5"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      if (isRecordingVoice) {
        handleSendVoiceNote();
      } else {
        startVoiceRecording();
      }
    },
    className: `p-2 rounded-xl border transition-all ${isRecordingVoice ? "bg-rose-600 text-white border-rose-500 animate-pulse" : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white"}`,
    title: isRecordingVoice ? "Отправить голосовое" : "Записать голосовое"
  }, "\uD83C\uDFA4"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: inputText,
    onChange: e => setInputText(e.target.value),
    placeholder: "\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435...",
    className: "flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !inputText.trim(),
    className: "bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 disabled:opacity-40 text-white font-bold p-2.5 rounded-2xl shadow-lg transition-transform active:scale-95"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-4 h-4 transform rotate-45",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2.5",
    d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
  }))))) :
  /*#__PURE__*/
  /* View 2: Dialogs List */
  React.createElement("div", {
    className: "flex-1 flex flex-col h-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-base font-black text-white flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("span", null, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0438 \u0447\u0430\u0442\u044B")), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-white text-base p-1"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-3 space-y-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400 font-bold px-1 uppercase tracking-wider block"
  }, "\u0412\u0441\u0435 \u0434\u0438\u0430\u043B\u043E\u0433\u0438 (", dialogs.length, "):"), dialogs.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.partner.id,
    onClick: () => openDialog(d.partner),
    className: "bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("img", {
    src: d.partner.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    className: "w-12 h-12 rounded-full object-cover ring-2 ring-slate-800"
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900"
  })), /*#__PURE__*/React.createElement("div", {
    className: "max-w-[190px] sm:max-w-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-white truncate"
  }, d.partner.first_name, " ", d.partner.last_name || ""), d.partner.is_verified && /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 text-xs"
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-400 font-semibold block"
  }, "@", d.partner.username), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-400 truncate mt-0.5"
  }, d.last_message ? d.last_message.content : "Начните общение..."))), /*#__PURE__*/React.createElement("div", {
    className: "text-right flex flex-col items-end space-y-1"
  }, d.last_message && d.last_message.created_at && /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500 font-mono"
  }, new Date(d.last_message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })), d.unread_count > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-pink-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md"
  }, d.unread_count)))))), zoomPhotoUrl && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-60 bg-black/95 flex flex-col justify-between select-none touch-none animate-in fade-in",
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex items-center justify-between text-white bg-slate-950/60 backdrop-blur-md"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-300"
  }, "\u041C\u0430\u0441\u0448\u0442\u0430\u0431: ", Math.round(zoomScale * 100), "% (\u0441\u0436\u0438\u043C\u0430\u0439\u0442\u0435 2 \u043F\u0430\u043B\u044C\u0446\u0430\u043C\u0438)"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoomScale(prev => Math.max(prev - 0.5, 1)),
    className: "w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm"
  }, "\u2212"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoomScale(prev => Math.min(prev + 0.5, 4)),
    className: "w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm"
  }, "+"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoomScale(1),
    className: "text-xs bg-slate-800 px-2 py-1 rounded-lg text-slate-300"
  }, "1:1"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoomPhotoUrl(null),
    className: "w-8 h-8 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-sm"
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex items-center justify-center overflow-hidden p-2",
    onDoubleClick: () => setZoomScale(prev => prev > 1.5 ? 1 : 2.5)
  }, /*#__PURE__*/React.createElement("img", {
    src: zoomPhotoUrl,
    alt: "\u0423\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u043D\u043E\u0435 \u0444\u043E\u0442\u043E",
    style: {
      transform: `scale(${zoomScale})`,
      transition: "transform 0.1s ease-out"
    },
    className: "max-h-[85vh] max-w-full object-contain rounded-xl"
  })), /*#__PURE__*/React.createElement("div", {
    className: "p-3 text-center text-slate-400 text-[11px] bg-slate-950/60 backdrop-blur-md"
  }, "\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u043A\u043B\u0438\u043A \u0434\u043B\u044F \u0431\u044B\u0441\u0442\u0440\u043E\u0433\u043E \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0435\u043D\u0438\u044F \u2022 \u041B\u0438\u0441\u0442\u0430\u0439\u0442\u0435 \u0438\u043B\u0438 \u0440\u0430\u0437\u0434\u0432\u0438\u0433\u0430\u0439\u0442\u0435 \u0434\u0432\u0443\u043C\u044F \u043F\u0430\u043B\u044C\u0446\u0430\u043C\u0438")), activeCall && isCallMinimized && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      triggerHaptic("light");
      setIsCallMinimized(false);
    },
    className: "fixed bottom-20 right-4 z-60 bg-slate-900/95 border-2 border-emerald-500 rounded-3xl p-3 shadow-2xl backdrop-blur-md flex items-center space-x-3 cursor-pointer animate-in slide-in-from-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("img", {
    src: activeCall.partner.avatar_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100",
    className: "w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/50"
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, activeCall.partner.first_name), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-emerald-400 font-mono font-bold block"
  }, "\uD83D\uDFE2 ", formatCallTime(activeCall.callSeconds)), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-400"
  }, "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u0432\u043E\u0437\u0432\u0440\u0430\u0442\u0430")), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      endCall();
    },
    className: "p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs shadow-md",
    title: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0437\u0432\u043E\u043D\u043E\u043A"
  }, "\uD83D\uDCDE")), activeCall && !isCallMinimized && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col justify-between p-6 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-white"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setIsCallMinimized(true);
    },
    className: "bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\u2199 \u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C (\u0444\u043E\u043D\u043E\u0432\u044B\u0439 \u0437\u0432\u043E\u043D\u043E\u043A)")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono font-bold text-emerald-400"
  }, activeCall.isConnected ? `🟢 ${formatCallTime(activeCall.callSeconds)}` : "📞 Идут гудки... Ожидание")), /*#__PURE__*/React.createElement("div", {
    className: "text-center pt-4 space-y-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: activeCall.partner.avatar_url,
    className: "w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-pink-500/50 shadow-2xl animate-pulse"
  }), /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-black text-white"
  }, activeCall.partner.first_name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-pink-400 font-semibold block"
  }, activeCall.isConnected ? "🟢 Идет разговор (WebRTC HD) • Вы можете свернуть звонок и писать в чат" : "📲 Идут гудки... Ожидание, пока собеседник примет звонок")), activeCall.isConnected && activeCall.isVideo && /*#__PURE__*/React.createElement("div", {
    className: "flex-1 my-4 bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500 text-xs"
  }, "\u041A\u0430\u043C\u0435\u0440\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0430 (Live WebRTC stream)")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-center space-x-6 pb-8"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setActiveCall({
      ...activeCall,
      isMuted: !activeCall.isMuted
    }),
    className: `p-4 rounded-full ${activeCall.isMuted ? "bg-amber-600" : "bg-slate-800"} text-white text-xl shadow-lg`,
    title: "\u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D"
  }, activeCall.isMuted ? "🔇" : "🎙️"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setIsCallMinimized(true);
    },
    className: "p-4 rounded-full bg-slate-800 text-white text-xl shadow-lg",
    title: "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0432 \u043C\u0438\u043D\u0438-\u043E\u043A\u043D\u043E"
  }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("button", {
    onClick: endCall,
    className: "p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xl shadow-xl shadow-rose-600/40",
    title: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0437\u0432\u043E\u043D\u043E\u043A"
  }, "\uD83D\uDED1"))), incomingCall && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in select-none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl shadow-emerald-500/20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-24 h-24 mx-auto"
  }, /*#__PURE__*/React.createElement("img", {
    src: incomingCall.caller?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    alt: "Caller",
    className: "w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500 animate-pulse shadow-xl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white shadow-md"
  }, "\uD83D\uDCDE")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-emerald-400 font-bold uppercase tracking-wider block animate-pulse"
  }, "\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0439 ", incomingCall.call_type === "video" ? "видеозвонок" : "аудиозвонок", "..."), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-white mt-1"
  }, incomingCall.caller?.first_name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-pink-400 font-mono"
  }, "@", incomingCall.caller?.username)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleRejectIncomingCall,
    className: "bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 active:scale-95 transition"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD34 \u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("button", {
    onClick: handleAcceptIncomingCall,
    className: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 active:scale-95 animate-bounce transition"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDFE2 \u041F\u0440\u0438\u043D\u044F\u0442\u044C"))))));
}

// --- File: components/MarketplaceView.jsx ---

function MarketplaceView({
  user,
  t,
  onUpdateUser
}) {
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
  const handleReceiptFileChange = async e => {
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
  const handleSubmitOrder = async e => {
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
  const handleBuyVerified = async months => {
    triggerHaptic("heavy");
    SoundEngine.playFanfare();
    try {
      const res = await Api.post("/marketplace/verified/buy", {
        months
      });
      alert(res.message);
      onUpdateUser({
        ...user,
        is_verified: true,
        verified_until: res.verified_until
      });
    } catch (err) {
      triggerHaptic("error");
      alert(err.message);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "p-4 space-y-4 pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-500/40 rounded-3xl p-4 text-center shadow-lg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl block mb-1"
  }, "\uD83D\uDC8E"), /*#__PURE__*/React.createElement("h2", {
    className: "text-base font-black text-white"
  }, "\u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0439 \u041C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441 VENSTOGRAM"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-300 mt-1 max-w-sm mx-auto"
  }, "\u0420\u0435\u0434\u043A\u0438\u0435 \u0438\u043C\u0435\u043D\u0430, \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0433\u0430\u043B\u043E\u0447\u043A\u0430 \u0438 \u043F\u0430\u043A\u0435\u0442\u044B \u043F\u0440\u043E\u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u0431\u0438\u0437\u043D\u0435\u0441\u0430. \u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u043E\u043C \u0441 \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u0435\u043C \u0447\u0435\u043A\u0430.")), /*#__PURE__*/React.createElement("div", {
    className: "flex bg-slate-900 p-1 rounded-2xl border border-slate-800"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("usernames");
    },
    className: `flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "usernames" ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`
  }, "\uD83C\uDFF7\uFE0F \u041D\u0438\u043A\u043D\u0435\u0439\u043C\u044B"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("verified");
    },
    className: `flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "verified" ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`
  }, "\u2713 \u0413\u0430\u043B\u043E\u0447\u043A\u0430"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("promo");
    },
    className: `flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "promo" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-slate-200"}`
  }, "\uD83D\uDE80 \u0411\u0438\u0437\u043D\u0435\u0441")), activeTab === "usernames" && (() => {
    const filteredListings = listings.filter(item => item.username.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    const displayedListings = filteredListings.slice(0, visibleCount);
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: searchQuery,
      onChange: e => {
        setSearchQuery(e.target.value);
        setVisibleCount(25);
      },
      placeholder: "\uD83D\uDD0D \u041D\u0430\u0439\u0442\u0438 \u0438\u043C\u044F (Aziza, Laylo, Madina, Sevara)...",
      className: "w-full bg-slate-900 border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
    }), searchQuery && /*#__PURE__*/React.createElement("button", {
      onClick: () => setSearchQuery(""),
      className: "absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex space-x-2 overflow-x-auto pb-1 no-scrollbar"
    }, [{
      id: "all",
      label: "🌟 Все"
    }, {
      id: "uzbek_names",
      label: "🇺🇿 Узбекские имена ($500)"
    }, {
      id: "vip_brands",
      label: "👑 VIP Бренды ($10k-$20k)"
    }, {
      id: "uzbek_cities",
      label: "🏛️ Города ($10k)"
    }].map(cat => /*#__PURE__*/React.createElement("button", {
      key: cat.id,
      onClick: () => {
        setCategory(cat.id);
        setVisibleCount(25);
      },
      className: `px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${category === cat.id ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md" : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"}`
    }, cat.label)))), /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] text-slate-400 flex justify-between px-1"
    }, /*#__PURE__*/React.createElement("span", null, "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ", /*#__PURE__*/React.createElement("b", {
      className: "text-white"
    }, filteredListings.length), " \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u043E\u0432"), category === "uzbek_names" && /*#__PURE__*/React.createElement("span", {
      className: "text-amber-400 font-bold"
    }, "\u0424\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0446\u0435\u043D\u0430: $500")), displayedListings.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs"
    }, "\u041F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0443 \"", searchQuery, "\" \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u0438\u043C\u044F.") : /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 gap-3"
    }, displayedListings.map(item => {
      const priceUsd = item.price_usd || 500;
      const priceUzs = item.price_uzs || priceUsd * 13000;
      return /*#__PURE__*/React.createElement("div", {
        key: item.id,
        className: "bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden transition-all shadow-md"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-start justify-between"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center space-x-2"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-xl font-black text-white tracking-tight"
      }, "@", item.username), item.category === "vip_brands" && /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40"
      }, "\uD83D\uDC51 VIP BRAND"), item.category === "uzbek_cities" && /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40"
      }, "\uD83C\uDFDB\uFE0F \u0413\u041E\u0420\u041E\u0414"), item.category === "uzbek_names" && /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30"
      }, "\uD83C\uDDFA\uD83C\uDDFF \u0418\u041C\u042F")), /*#__PURE__*/React.createElement("span", {
        className: "text-[11px] text-emerald-400 font-semibold mt-1 block"
      }, "\uD83D\uDEE1\uFE0F \u041F\u0440\u043E\u0434\u0430\u0432\u0435\u0446: VENSTOGRAM OFFICIAL")), /*#__PURE__*/React.createElement("div", {
        className: "text-right"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-base font-black text-amber-300 block"
      }, "$", priceUsd.toLocaleString()), /*#__PURE__*/React.createElement("span", {
        className: "text-[10px] text-slate-400 font-medium"
      }, "\u2248 ", priceUzs.toLocaleString(), " \u0441\u0443\u043C"))), /*#__PURE__*/React.createElement("div", {
        className: "pt-2 border-t border-slate-800/80"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          triggerHaptic("medium");
          setSelectedListing(item);
          setReceiptUrl("");
          setOrderNotes("");
          setAgreedToTerms(false);
        },
        className: "w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
      }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCB3 \u041A\u0443\u043F\u0438\u0442\u044C @", item.username), /*#__PURE__*/React.createElement("span", null, "\u2014 $", priceUsd.toLocaleString()))));
    })), filteredListings.length > visibleCount && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        triggerHaptic("light");
        setVisibleCount(prev => prev + 25);
      },
      className: "w-full py-3 bg-slate-900 hover:bg-slate-800 text-pink-400 font-bold text-xs rounded-xl border border-slate-800 transition-colors"
    }, "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0435\u0449\u0451 (+25) \u2014 \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ", filteredListings.length - visibleCount, " \u2193"));
  })(), activeTab === "verified" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-br from-sky-950/80 via-blue-900/40 to-slate-900 border border-sky-500/40 rounded-3xl p-5 text-center relative overflow-hidden shadow-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-sky-500/30"
  }, "\u2713"), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-white"
  }, t.verifiedBadge), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300 mt-1 max-w-xs mx-auto"
  }, "\u041E\u0434\u0438\u043D \u0440\u0430\u0437 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u043B \u0433\u0430\u043B\u043E\u0447\u043A\u0443 \u2014 \u0438 \u0442\u0432\u043E\u0438 \u0432\u0438\u0434\u0435\u043E \u0432\u0437\u043B\u0435\u0442\u0430\u044E\u0442 \u0432 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438! \u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441, \u0434\u043E\u0432\u0435\u0440\u0438\u0435 \u0438 3x-5x \u043E\u0445\u0432\u0430\u0442\u044B.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, plans.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.months,
    className: "bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 flex items-center justify-between transition-all"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-white"
  }, p.label), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-sky-400 font-semibold"
  }, p.coins.toLocaleString(), " Vensto Coins")), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleBuyVerified(p.months),
    className: "bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-sky-500/20 transition-transform active:scale-95"
  }, "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C"))))), activeTab === "promo" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-br from-amber-950/80 via-orange-950/40 to-slate-900 border border-amber-500/40 rounded-3xl p-5 text-center relative overflow-hidden shadow-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/30"
  }, "\uD83D\uDE80"), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-white"
  }, "\u041F\u0440\u043E\u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0431\u0438\u0437\u043D\u0435\u0441\u0430 \u0432 VENSTOGRAM"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300 mt-1 max-w-sm mx-auto"
  }, "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0440\u043E\u0441\u0442 \u043F\u0440\u043E\u0434\u0430\u0436, \u0446\u0435\u043B\u0435\u0432\u044B\u0435 \u043F\u043E\u043A\u0430\u0437\u044B \u0432 \u043B\u0435\u043D\u0442\u0435 \u0438 Reels \u0434\u043B\u044F \u043C\u0430\u043B\u043E\u0433\u043E \u0431\u0438\u0437\u043D\u0435\u0441\u0430, \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u043E\u0432 \u0438 \u0431\u0440\u0435\u043D\u0434\u043E\u0432 \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D\u0430.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, [{
    id: "small_business",
    title: "🌱 Старт: Малый бизнес",
    views: "10 000 гарантированных показов",
    features: ["Показ в общей ленте и Reels", "Приоритет в поиске (лупа)", "Метка «Спонсировано»"],
    coins: 500,
    priceUzs: "50 000 сум"
  }, {
    id: "pro_business",
    title: "⚡ PRO Бизнес & Онлайн-магазины",
    views: "50 000 показов + ТОП рекомендаций",
    features: ["Закрепление в рекомендациях на 7 дней", "Прямая кнопка на Telegram-канал/сайт", "3x прирост подписчиков"],
    coins: 2000,
    priceUzs: "200 000 сум",
    popular: true
  }, {
    id: "vip_brand",
    title: "👑 VIP Бренд & Корпорации",
    views: "200 000 целевых просмотров",
    features: ["Масштабный охват по всему Узбекистану", "Рассылка через Telegram-бота", "Персональный менеджер и синяя галочка"],
    coins: 7500,
    priceUzs: "750 000 сум"
  }].map(pkg => /*#__PURE__*/React.createElement("div", {
    key: pkg.id,
    className: `bg-slate-900 border rounded-3xl p-4 space-y-3 relative overflow-hidden transition-all shadow-lg ${pkg.popular ? "border-amber-500/70 ring-1 ring-amber-500/30" : "border-slate-800"}`
  }, pkg.popular && /*#__PURE__*/React.createElement("span", {
    className: "absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
  }, "\u0425\u0418\u0422 \u041F\u0420\u041E\u0414\u0410\u0416 \uD83D\uDD25"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-black text-white"
  }, pkg.title), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-amber-400 block mt-0.5"
  }, pkg.views)), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, pkg.features.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-center space-x-1.5 text-[11px] text-slate-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-400"
  }, "\u2713"), /*#__PURE__*/React.createElement("span", null, f)))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-2 border-t border-slate-800"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black text-white"
  }, pkg.coins, " \uD83E\uDE99"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block"
  }, "\u2248 ", pkg.priceUzs)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("heavy");
      if (user.wallet_coins >= pkg.coins) {
        onUpdateUser({
          ...user,
          wallet_coins: user.wallet_coins - pkg.coins
        });
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
    },
    className: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
  }, "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043F\u0440\u043E\u043C\u043E \uD83D\uDE80")))))), selectedListing && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-black text-white"
  }, "\u041E\u043F\u043B\u0430\u0442\u0430 ", selectedListing.username), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-pink-400 font-bold"
  }, "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C: $", selectedListing.price_usd?.toLocaleString() || 500, " (", (selectedListing.price_uzs || selectedListing.price_usd * 13000)?.toLocaleString(), " UZS)")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedListing(null),
    className: "text-slate-400 hover:text-white text-base p-1"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3 text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white block"
  }, "\u041E\u043F\u043B\u0430\u0442\u0430 \u0447\u0435\u0440\u0435\u0437 Paynet / Click / Payme / Uzum:"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-700 shadow-md"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./paynet_qr.jpg",
    alt: "QR kodni skanerlang",
    className: "w-52 h-auto object-contain rounded-xl shadow"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-800 font-extrabold mt-2 text-center"
  }, "\uD83D\uDCF1 \u041E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439\u0442\u0435 QR-\u043A\u043E\u0434 \u0432 \u043B\u044E\u0431\u043E\u043C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500 font-semibold text-center"
  }, "(Paynet, Payme, Click, Uzum Bank, NBU, Agrobank, Kapitalbank)")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 text-[10px] uppercase font-bold tracking-wider"
  }, "Biznes karta raqami:"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      triggerHaptic("selection");
      if (navigator.clipboard) {
        navigator.clipboard.writeText("8888014490626927");
      }
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    },
    className: "text-[10px] bg-slate-800 hover:bg-slate-700 text-pink-400 px-2 py-0.5 rounded-lg font-bold border border-slate-700"
  }, copiedCard ? "✓ Скопировано!" : "📋 Скопировать")), /*#__PURE__*/React.createElement("div", {
    className: "font-mono font-black text-base text-emerald-400 tracking-wider"
  }, "8888 0144 9062 6927"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-slate-200 font-bold"
  }, "Qabul qiluvchi: ", /*#__PURE__*/React.createElement("span", {
    className: "text-amber-300"
  }, "ABDULAZIZ KAMOLOV SHERZODBEK O'G'LI"))), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-400 italic"
  }, "\u041E\u043F\u043B\u0430\u0442\u0438\u0442\u0435 \u0442\u043E\u0447\u043D\u0443\u044E \u0441\u0443\u043C\u043C\u0443 \u0438 \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u0435 \u0441\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u0447\u0435\u043A\u0430 \u043D\u0438\u0436\u0435. \u041F\u043E\u0441\u043B\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C \u0437\u0430\u043A\u0430\u0437 \u0431\u0443\u0434\u0435\u0442 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D!")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmitOrder,
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs font-bold text-white block mb-1.5"
  }, "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C \u0441\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u0447\u0435\u043A\u0430 \u043E\u0431 \u043E\u043F\u043B\u0430\u0442\u0435:"), receiptUrl ? /*#__PURE__*/React.createElement("div", {
    className: "relative rounded-2xl overflow-hidden border border-emerald-500/60 p-1 bg-slate-950"
  }, /*#__PURE__*/React.createElement("img", {
    src: receiptUrl,
    alt: "\u0427\u0435\u043A",
    className: "w-full h-44 object-contain rounded-xl bg-black"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setReceiptUrl(""),
    className: "absolute top-3 right-3 bg-rose-600 text-white rounded-full p-1 text-xs shadow-lg"
  }, "\u2715 \u0423\u0434\u0430\u043B\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-emerald-400 font-bold block text-center py-1"
  }, "\u2713 \u0421\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "file",
    ref: fileInputRef,
    onChange: handleReceiptFileChange,
    accept: "image/*",
    className: "hidden"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => fileInputRef.current?.click(),
    disabled: uploadingReceipt,
    className: "w-full border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl p-5 text-center transition-all bg-slate-950/60 flex flex-col items-center justify-center space-y-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDCF8"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-pink-400"
  }, uploadingReceipt ? "Загрузка фото..." : "Нажмите, чтобы выбрать скриншот из галереи"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500"
  }, "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u044B JPG, PNG, WEBP")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-slate-400 block mb-1"
  }, "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439 \u0438\u043B\u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442 \u0434\u043B\u044F \u0441\u0432\u044F\u0437\u0438 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: orderNotes,
    onChange: e => setOrderNotes(e.target.value),
    placeholder: "\u0412\u0430\u0448 \u043D\u043E\u043C\u0435\u0440 \u0438\u043B\u0438 Telegram @...",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3.5 space-y-2 text-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "\u2696\uFE0F"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-amber-300 uppercase tracking-wide"
  }, "\u0420\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442 \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B")), /*#__PURE__*/React.createElement("ul", {
    className: "text-[11px] text-slate-300 space-y-1.5 list-disc pl-4 leading-snug"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "\u041B\u0438\u0447\u043D\u043E\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435:"), " \u041D\u0438\u043A\u043D\u0435\u0439\u043C \u0437\u0430\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u0442\u0441\u044F \u0437\u0430 \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u0435\u043C \u043D\u0430 \u043F\u0440\u0430\u0432\u0430\u0445 \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u043E\u0433\u043E \u043B\u0438\u0447\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0432\u043D\u0443\u0442\u0440\u0438 \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u044B Venstogram."), /*#__PURE__*/React.createElement("li", {
    className: "text-amber-200"
  }, /*#__PURE__*/React.createElement("b", null, "\u0417\u0430\u043F\u0440\u0435\u0442 \u043F\u0435\u0440\u0435\u043F\u0440\u043E\u0434\u0430\u0436\u0438:"), " ", /*#__PURE__*/React.createElement("u", null, "\u041F\u0435\u0440\u0435\u043F\u0440\u043E\u0434\u0430\u0436\u0430, \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0438\u043B\u0438 \u0443\u0441\u0442\u0443\u043F\u043A\u0430 \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u0430 \u0442\u0440\u0435\u0442\u044C\u0438\u043C \u043B\u0438\u0446\u0430\u043C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0447\u0435\u0441\u043A\u0438 \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u0430."), " \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043C\u0435\u043D\u044F\u0442\u044C \u0438\u043C\u044F \u043F\u0440\u043E\u0444\u0438\u043B\u044F, \u0444\u043E\u0442\u043E \u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435, \u043D\u043E \u043D\u0438\u043A\u043D\u0435\u0439\u043C \u043D\u0435 \u043F\u043E\u0434\u043B\u0435\u0436\u0438\u0442 \u0432\u0442\u043E\u0440\u0438\u0447\u043D\u043E\u0439 \u043F\u0440\u043E\u0434\u0430\u0436\u0435."), /*#__PURE__*/React.createElement("li", {
    className: "text-amber-300"
  }, /*#__PURE__*/React.createElement("b", null, "\u041F\u0440\u0430\u0432\u043E \u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0430:"), " \u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0437\u0430 \u0441\u043E\u0431\u043E\u0439 \u0431\u0435\u0437\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0447\u043D\u043E\u0435 \u043F\u0440\u0430\u0432\u043E \u0438\u0437\u043C\u0435\u043D\u044F\u0442\u044C \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u0430, \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0438 \u0441\u0442\u0430\u0442\u0443\u0441 \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u043E\u0432 \u0432 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0438 \u0441 \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u0430\u043C\u0438 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u0438 \u0437\u0430\u043A\u043E\u043D\u0430\u043C\u0438 \u0420\u0423\u0437.")), /*#__PURE__*/React.createElement("label", {
    className: "flex items-start space-x-2.5 pt-2 border-t border-amber-500/30 cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: agreedToTerms,
    onChange: e => {
      triggerHaptic("selection");
      setAgreedToTerms(e.target.checked);
    },
    className: "mt-0.5 rounded border-slate-700 text-pink-600 focus:ring-pink-500 w-4 h-4 bg-slate-900"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold text-white select-none"
  }, "\u042F \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u044E \u0420\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442 Venstogram, \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u044E \u0437\u0430\u043F\u0440\u0435\u0442 \u043F\u0435\u0440\u0435\u043F\u0440\u043E\u0434\u0430\u0436\u0438 \u0438 \u0441\u043E\u0433\u043B\u0430\u0441\u0435\u043D \u0441 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438 \u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0430"))), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setSelectedListing(null),
    className: "flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !receiptUrl || !agreedToTerms || submittingOrder,
    className: "flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30"
  }, submittingOrder ? "Отправка..." : "Отправить чек на проверку"))))));
}

// --- File: components/WalletModal.jsx ---

function WalletModal({
  user,
  t,
  onClose,
  onUpdateUser
}) {
  const [isUnlocked, setIsUnlocked] = useState(!user.has_pin && !user.biometric_enabled);
  const [pinInput, setPinInput] = useState("");
  const [activeTab, setActiveTab] = useState("topup"); // topup, history
  const [transactions, setTransactions] = useState([]);

  // Topup State
  const [topupAmount, setTopupAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState("click"); // click, payme, uzum, stars
  const [copiedCard, setCopiedCard] = useState(false);
  const [showQr, setShowQr] = useState(false);
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
  const handleUnlockPin = async e => {
    e.preventDefault();
    if (!pinInput) return;
    try {
      await Api.post("/wallet/verify-pin", {
        pin: pinInput
      });
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
  const handleTopUp = async () => {
    triggerHaptic("medium");
    SoundEngine.playFanfare();
    try {
      const res = await Api.post("/wallet/topup", {
        amount_coins: topupAmount,
        payment_method: paymentMethod
      });
      alert(res.message);
      onUpdateUser({
        ...user,
        wallet_coins: res.new_coins
      });
      setActiveTab("history");
      loadTransactions();
    } catch (err) {
      alert(err.message);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-4 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDC5B"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-extrabold text-white"
  }, t.wallet), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-emerald-400 font-semibold"
  }, "\u041F\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u0431\u0430\u043B\u0430\u043D\u0441\u0430 Vensto Coins"))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-white p-1 text-lg"
  }, "\u2715")), !isUnlocked ? /*#__PURE__*/React.createElement("div", {
    className: "py-8 flex flex-col items-center justify-center space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl"
  }, "\uD83D\uDD12"), /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-white text-center"
  }, t.enterPin), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleUnlockPin,
    className: "w-full max-w-xs space-y-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "password",
    maxLength: "6",
    value: pinInput,
    onChange: e => setPinInput(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022",
    className: "w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 text-center text-xl tracking-widest text-white outline-none focus:border-pink-500",
    autoFocus: true
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
  }, t.confirm), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: triggerBiometricAuth,
    className: "w-full text-slate-400 text-xs py-1.5 flex items-center justify-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC46"), /*#__PURE__*/React.createElement("span", null, t.useBiometrics)))) :
  /*#__PURE__*/
  /* Unlocked Wallet Screen */
  React.createElement("div", {
    className: "py-3 flex-1 overflow-y-auto space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-tr from-amber-600/30 via-slate-900 to-yellow-600/20 border border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between shadow-xl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-amber-300 font-semibold"
  }, "\u0412\u0430\u0448 \u0431\u0430\u043B\u0430\u043D\u0441"), /*#__PURE__*/React.createElement("div", {
    className: "my-2 flex items-baseline space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-3xl font-black text-white"
  }, (user.wallet_coins || 0).toLocaleString()), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-amber-400"
  }, "Vensto Coins \uD83E\uDE99")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-300 font-medium"
  }, "\u2248 ", ((user.wallet_coins || 0) * 100).toLocaleString(), " UZS (\u0441\u0443\u043C)")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("topup");
    },
    className: `py-2 px-3 rounded-xl text-xs font-bold transition-all border ${activeTab === "topup" ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20" : "bg-slate-800 text-slate-300 border-slate-700"}`
  }, "\u2795 \u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("history");
      loadTransactions();
    },
    className: `py-2 px-3 rounded-xl text-xs font-bold transition-all border ${activeTab === "history" ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20" : "bg-slate-800 text-slate-300 border-slate-700"}`
  }, "\uD83D\uDCCB \u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0439")), activeTab === "topup" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white"
  }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0443\u043C\u043C\u0443 \u043C\u043E\u043D\u0435\u0442:"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2"
  }, [200, 500, 1000, 2500, 5000, 10000].map(amt => /*#__PURE__*/React.createElement("button", {
    key: amt,
    onClick: () => setTopupAmount(amt),
    className: `p-2 rounded-xl text-xs font-bold border ${topupAmount === amt ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"}`
  }, amt, " \uD83E\uDE99", /*#__PURE__*/React.createElement("span", {
    className: "block text-[10px] text-slate-500 font-normal"
  }, (amt * 100).toLocaleString(), " \u0441\u0443\u043C")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 uppercase font-bold tracking-wider"
  }, "\u0420\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 (\u043B\u044E\u0431\u043E\u0439 \u0431\u0430\u043D\u043A):"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      triggerHaptic("selection");
      if (navigator.clipboard) {
        navigator.clipboard.writeText("8888014490626927");
      }
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    },
    className: "text-[10px] bg-slate-800 hover:bg-slate-700 text-pink-400 px-2 py-0.5 rounded-lg font-bold border border-slate-700"
  }, copiedCard ? "✓ Скопировано!" : "📋 Скопировать")), /*#__PURE__*/React.createElement("div", {
    className: "font-mono font-black text-sm text-emerald-400 tracking-wider"
  }, "8888 0144 9062 6927"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-slate-300 font-bold"
  }, "Qabul qiluvchi: ", /*#__PURE__*/React.createElement("span", {
    className: "text-amber-300"
  }, "ABDULAZIZ KAMOLOV SHERZODBEK O'G'LI")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      triggerHaptic("light");
      setShowQr(!showQr);
    },
    className: "w-full text-center py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 text-sky-300 hover:bg-slate-750 border border-slate-700"
  }, showQr ? "▲ Скрыть QR-код" : "📱 Показать Paynet QR-код для сканирования"), showQr && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-700 mt-2"
  }, /*#__PURE__*/React.createElement("img", {
    src: "./paynet_qr.jpg",
    alt: "Paynet QR",
    className: "w-44 h-auto object-contain rounded-lg"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-800 font-extrabold mt-1 text-center"
  }, "Istalgan ilova orqali skanerlang va to'lang"))), /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white mt-2"
  }, "\u041F\u043B\u0430\u0442\u0435\u0436\u043D\u044B\u0439 \u043C\u0435\u0442\u043E\u0434:"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, [{
    id: "click",
    label: "🔹 Click (Uzbekistan)"
  }, {
    id: "payme",
    label: "🔸 Payme (Uzbekistan)"
  }, {
    id: "uzum",
    label: "🍇 Uzum Bank"
  }, {
    id: "stars",
    label: "⭐ Telegram Stars"
  }].map(m => /*#__PURE__*/React.createElement("button", {
    key: m.id,
    onClick: () => setPaymentMethod(m.id),
    className: `p-2.5 rounded-xl text-xs font-bold border text-left ${paymentMethod === m.id ? "bg-blue-600/30 border-blue-500 text-blue-300 ring-1 ring-blue-500" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"}`
  }, m.label))), /*#__PURE__*/React.createElement("button", {
    onClick: handleTopUp,
    className: "w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all mt-3"
  }, "\u041E\u043F\u043B\u0430\u0442\u0438\u0442\u044C ", (topupAmount * 100).toLocaleString(), " UZS")), activeTab === "history" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 max-h-56 overflow-y-auto"
  }, transactions.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-6 text-slate-500 text-xs"
  }, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u0430") : transactions.map(tx => /*#__PURE__*/React.createElement("div", {
    key: tx.id,
    className: "bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white block"
  }, tx.description), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, new Date(tx.created_at).toLocaleDateString())), /*#__PURE__*/React.createElement("span", {
    className: `font-black ${tx.amount_coins >= 0 ? "text-emerald-400" : "text-rose-400"}`
  }, tx.amount_coins >= 0 ? `+${tx.amount_coins}` : tx.amount_coins, " \uD83E\uDE99")))))));
}

// --- File: components/EmailAuthModal.jsx ---

function EmailAuthModal({
  onClose,
  onAuthSuccess
}) {
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
  const handleRegister = async e => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);
    triggerHaptic("medium");
    try {
      const res = await Api.post("/auth/register-email", {
        email,
        password,
        username,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
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
  const handleVerifyCode = async e => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    triggerHaptic("heavy");
    try {
      const res = await Api.post("/auth/verify-email-code", {
        email,
        code
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
  const handleLogin = async e => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    triggerHaptic("medium");
    try {
      const res = await Api.post("/auth/login-email", {
        email,
        password
      });
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
  const handleForgotPassword = async e => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    triggerHaptic("light");
    try {
      const res = await Api.post("/auth/forgot-password", {
        email
      });
      setInfoMsg(res.message);
      if (res.debug_code) setCode(res.debug_code);
      setMode("reset_password");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-sm"
  }, "\u2709\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white"
  }, mode === "register" && "Регистрация в Venstogram", mode === "verify_code" && "Подтверждение Email", mode === "login" && "Вход по Email", mode === "forgot" && "Сброс пароля", mode === "reset_password" && "Новый пароль"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, mode === "register" ? "Придумайте свободный никнейм и данные" : "Безопасный доступ через почту"))), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "p-1 rounded-full text-slate-400 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "p-5 overflow-y-auto space-y-4 flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 p-2.5 rounded-2xl flex items-center space-x-2 text-[11px] text-blue-200"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDEE1\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "\u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438:"), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-300 font-mono font-bold ml-1"
  }, "venstogram@gmail.com"))), errorMsg && /*#__PURE__*/React.createElement("div", {
    className: "bg-rose-950/60 border border-rose-500/50 p-3 rounded-2xl text-xs text-rose-300 leading-relaxed"
  }, "\u26A0\uFE0F ", errorMsg), infoMsg && /*#__PURE__*/React.createElement("div", {
    className: "bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-2xl text-xs text-emerald-300 leading-relaxed"
  }, "\u2705 ", infoMsg), mode === "register" && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleRegister,
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041F\u0440\u0438\u0434\u0443\u043C\u0430\u0439\u0442\u0435 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0439 \u043D\u0438\u043A\u043D\u0435\u0439\u043C (@username):"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("span", {
    className: "absolute left-3 top-2.5 text-xs text-pink-400 font-bold"
  }, "@"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: username,
    onChange: e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')),
    placeholder: "my_super_nick",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 block mt-1"
  }, "*\u0423\u0437\u0431\u0435\u043A\u0441\u043A\u0438\u0435 \u0438\u043C\u0435\u043D\u0430 \u0438 VIP \u0431\u0440\u0435\u043D\u0434\u044B \u043F\u0440\u043E\u0434\u0430\u044E\u0442\u0441\u044F \u0432 \u041C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441\u0435 \u0437\u0430 $500. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0439 \u043B\u0438\u0447\u043D\u044B\u0439 \u043D\u0438\u043A\u043D\u0435\u0439\u043C.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0418\u043C\u044F:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: firstName,
    onChange: e => setFirstName(e.target.value),
    placeholder: "\u0410\u043B\u0438\u0448\u0435\u0440",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0424\u0430\u043C\u0438\u043B\u0438\u044F:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: lastName,
    onChange: e => setLastName(e.target.value),
    placeholder: "\u0423\u0441\u043C\u0430\u043D\u043E\u0432",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E (\u043F\u043E \u0436\u0435\u043B\u0430\u043D\u0438\u044E):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: middleName,
    onChange: e => setMiddleName(e.target.value),
    placeholder: "\u0411\u0430\u0445\u043E\u0434\u0438\u0440\u043E\u0432\u0438\u0447",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0413\u043E\u0434 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F:"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1940",
    max: "2015",
    value: birthYear,
    onChange: e => setBirthYear(e.target.value),
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041F\u043E\u043B:"), /*#__PURE__*/React.createElement("select", {
    value: gender,
    onChange: e => setGender(e.target.value),
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: "\u041C\u0443\u0436\u0441\u043A\u043E\u0439"
  }, "\u041C\u0443\u0436\u0441\u043A\u043E\u0439 \uD83D\uDC68"), /*#__PURE__*/React.createElement("option", {
    value: "\u0416\u0435\u043D\u0441\u043A\u0438\u0439"
  }, "\u0416\u0435\u043D\u0441\u043A\u0438\u0439 \uD83D\uDC69")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430 (Email):"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    required: true,
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "example@mail.com",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041F\u0430\u0440\u043E\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", null, loading ? "Отправка кода..." : "Получить код на почту →")), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 text-center text-xs text-slate-400 space-y-1"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setMode("login"),
    className: "text-pink-400 font-bold hover:underline"
  }, "\u0423\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442? \u0412\u043E\u0439\u0442\u0438 \u043F\u043E Email"))), mode === "verify_code" && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleVerifyCode,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center space-y-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300"
  }, "\u041C\u044B \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0438 6-\u0437\u043D\u0430\u0447\u043D\u044B\u0439 \u043A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u043E\u0447\u0442\u0443: ", /*#__PURE__*/React.createElement("b", {
    className: "text-white"
  }, email)), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-amber-300/90 font-medium"
  }, "\uD83D\uDCE9 \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C: ", /*#__PURE__*/React.createElement("b", null, "venstogram@gmail.com"), " (\u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0442\u0430\u043A\u0436\u0435 \u043F\u0430\u043F\u043A\u0443 \u0421\u043F\u0430\u043C)")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1 text-center"
  }, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 6-\u0437\u043D\u0430\u0447\u043D\u044B\u0439 \u043A\u043E\u0434:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    maxLength: "6",
    required: true,
    value: code,
    onChange: e => setCode(e.target.value),
    placeholder: "123456",
    className: "w-48 mx-auto block text-center font-mono text-2xl tracking-widest bg-slate-950 border-2 border-pink-500/50 rounded-2xl py-2 text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading || code.length < 6,
    className: "w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all"
  }, loading ? "Проверка кода..." : "✓ Подтвердить и войти"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setMode("register"),
    className: "w-full text-center text-xs text-slate-400 hover:text-white"
  }, "\u2190 \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C email \u0438\u043B\u0438 \u0434\u0430\u043D\u043D\u044B\u0435")), mode === "login" && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleLogin,
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "Email:"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    required: true,
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "example@mail.com",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041F\u0430\u0440\u043E\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all"
  }, loading ? "Вход..." : "Войти в аккаунт"), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center pt-2 text-xs text-slate-400"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setMode("forgot"),
    className: "text-amber-400 hover:underline"
  }, "\u0417\u0430\u0431\u044B\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C?"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setMode("register"),
    className: "text-pink-400 font-bold hover:underline"
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442"))), mode === "forgot" && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleForgotPassword,
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300"
  }, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u0430\u0448 Email, \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u0439 \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438. \u041C\u044B \u0432\u044B\u0448\u043B\u0435\u043C \u043A\u043E\u0434 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430 \u043F\u0430\u0440\u043E\u043B\u044F:"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "Email:"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    required: true,
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "example@mail.com",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition-all"
  }, loading ? "Отправка кода..." : "Получить код сброса пароля"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setMode("login"),
    className: "w-full text-center text-xs text-slate-400 hover:text-white"
  }, "\u2190 \u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A\u043E \u0432\u0445\u043E\u0434\u0443")), mode === "reset_password" && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleResetPassword,
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041A\u043E\u0434 \u0438\u0437 \u043F\u0438\u0441\u044C\u043C\u0430:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    maxLength: "6",
    required: true,
    value: code,
    onChange: e => setCode(e.target.value),
    placeholder: "123456",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    value: newPassword,
    onChange: e => setNewPassword(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all"
  }, loading ? "Сохранение..." : "Сохранить новый пароль и войти")))));
}

// --- File: components/ProfileView.jsx ---

function ProfileView({
  user,
  t,
  lang,
  onLanguageChange,
  dataSaver,
  onToggleDataSaver,
  onOpenWallet,
  onUpdateUser
}) {
  const [activeTab, setActiveTab] = useState("posts"); // posts, reels, saved
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [verifiedModalOpen, setVerifiedModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [emailAuthModalOpen, setEmailAuthModalOpen] = useState(false);
  const [founderQuestModalOpen, setFounderQuestModalOpen] = useState(false);

  // Selected Post Viewer
  const [selectedPost, setSelectedPost] = useState(null);

  // Edit profile states
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.first_name || "");
  const [editLastName, setEditLastName] = useState(user?.last_name || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatar_url || "");
  const [editTelegramChannel, setEditTelegramChannel] = useState(user?.telegram_channel || "");
  const [editWebsite, setEditWebsite] = useState(user?.website || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  useEffect(() => {
    if (user?.username) {
      setEditUsername(user.username);
    }
  }, [user?.username]);

  // Live username availability check with suggestions
  useEffect(() => {
    if (!isEditing) return;
    const trimmed = (editUsername || "").trim().replace(/^@/, "").toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus(null);
      return;
    }
    if (user?.username && trimmed === user.username.toLowerCase()) {
      setUsernameStatus({
        available: true,
        is_current: true,
        message: "Ваш текущий никнейм",
        suggestions: []
      });
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await Api.get(`/users/check-username?username=${encodeURIComponent(trimmed)}`);
        setUsernameStatus(res);
      } catch (err) {
        console.warn("check-username error", err);
      } finally {
        setCheckingUsername(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [editUsername, isEditing, user?.username]);

  // PIN code state
  const [newPin, setNewPin] = useState("");
  const [biometricActive, setBiometricActive] = useState(user?.biometric_enabled || false);
  const fileInputRef = useRef(null);

  // Sample dynamic publications for current profile
  const userPosts = [{
    id: 101,
    caption: "Новый день — новые победы в VENSTOGRAM! 🚀 #venstogram #tashkent #live",
    media_urls: ["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"],
    likes_count: 342,
    views_count: 1850,
    comments_count: 28,
    is_liked: true,
    author: user
  }, {
    id: 102,
    caption: "Красивый вечер в Ташкенте 🇺🇿✨ #uzbekistan #tashkentcity #evening",
    media_urls: ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80"],
    likes_count: 512,
    views_count: 2940,
    comments_count: 45,
    is_liked: false,
    author: user
  }, {
    id: 103,
    caption: "Качественный контент и живые рекомендации! 💎 #blogger #uzb #recommendations",
    media_urls: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"],
    likes_count: 278,
    views_count: 1420,
    comments_count: 19,
    is_liked: true,
    author: user
  }, {
    id: 104,
    caption: "Готовим грандиозный запуск обновления! #tech #startup #venstogram",
    media_urls: ["https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80"],
    likes_count: 689,
    views_count: 4100,
    comments_count: 52,
    is_liked: false,
    author: user
  }, {
    id: 105,
    caption: "Атмосфера настоящего творчества 🎨 #creative #lifestyle",
    media_urls: ["https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80"],
    likes_count: 410,
    views_count: 2300,
    comments_count: 33,
    is_liked: false,
    author: user
  }, {
    id: 106,
    caption: "Всем отличного настроения и продуктивной недели! 🌟 #samarkand #bukhara",
    media_urls: ["https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80"],
    likes_count: 890,
    views_count: 5800,
    comments_count: 67,
    is_liked: true,
    author: user
  }];
  const userReels = [{
    id: 201,
    caption: "Топ фишек в новом обновлении VENSTOGRAM 🔥 #reels #trend",
    media_urls: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"],
    likes_count: 1420,
    views_count: 12400,
    comments_count: 112,
    is_liked: true,
    author: user
  }, {
    id: 202,
    caption: "Как взлететь в рекомендации за 1 день? Смотри до конца! 🚀 #recommendations",
    media_urls: ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600"],
    likes_count: 2890,
    views_count: 24500,
    comments_count: 240,
    is_liked: true,
    author: user
  }];
  const handleAvatarFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
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
        throw new Error("Ошибка загрузки фото");
      }
      const data = await res.json();
      setEditAvatarUrl(data.url);
      triggerHaptic("success");
    } catch (err) {
      alert("Не удалось загрузить аватарку: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };
  const handleDeleteAvatar = async () => {
    if (!confirm("Вы действительно хотите удалить свою аватарку?")) return;
    triggerHaptic("medium");
    try {
      await Api.patch("/auth/me", {
        avatar_url: ""
      });
      setEditAvatarUrl("");
      onUpdateUser({
        ...user,
        avatar_url: ""
      });
      alert("Аватарка успешно удалена! Установлен стандартный значок.");
    } catch (err) {
      alert("Ошибка удаления аватарки: " + err.message);
    }
  };
  const handleSaveProfile = async e => {
    e.preventDefault();
    triggerHaptic("medium");
    const cleanUsername = (editUsername || "").trim().replace(/^@/, "").toLowerCase();
    if (cleanUsername && usernameStatus && !usernameStatus.available && !usernameStatus.is_current) {
      alert("Пожалуйста, выберите свободный никнейм перед сохранением!");
      return;
    }
    try {
      const updated = await Api.patch("/auth/me", {
        username: cleanUsername || undefined,
        first_name: editFirstName,
        last_name: editLastName,
        bio: editBio,
        avatar_url: editAvatarUrl,
        telegram_channel: editTelegramChannel,
        website: editWebsite
      });
      onUpdateUser({
        ...user,
        username: updated.username || cleanUsername || user.username,
        first_name: updated.first_name,
        last_name: updated.last_name,
        bio: updated.bio,
        avatar_url: updated.avatar_url,
        telegram_channel: updated.telegram_channel,
        website: updated.website
      });
      triggerHaptic("success");
      setIsEditing(false);
      alert("Профиль успешно обновлен! ✨");
    } catch (err) {
      alert("Ошибка сохранения: " + err.message);
    }
  };
  const handleSaveSecurity = async e => {
    e.preventDefault();
    triggerHaptic("medium");
    try {
      await Api.patch("/auth/me", {
        wallet_pin: newPin || undefined,
        biometric_enabled: biometricActive
      });
      onUpdateUser({
        ...user,
        has_pin: Boolean(newPin),
        biometric_enabled: biometricActive
      });
      triggerHaptic("success");
      alert("Настройки безопасности успешно сохранены! 🔒");
      setSecurityModalOpen(false);
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };
  const handleBuyVerified = async (months, coins) => {
    if (user.wallet_coins < coins) {
      triggerHaptic("error");
      alert(`Недостаточно монет на балансе (${user.wallet_coins} 🪙). Пополните кошелек через Paynet/карту.`);
      return;
    }
    triggerHaptic("heavy");
    SoundEngine.playFanfare();
    try {
      const res = await Api.post("/marketplace/verified/buy", {
        months
      });
      alert(res.message);
      onUpdateUser({
        ...user,
        is_verified: true,
        wallet_coins: user.wallet_coins - coins,
        verified_until: res.verified_until
      });
      setVerifiedModalOpen(false);
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };
  const openTelegramChannel = channel => {
    triggerHaptic("light");
    let url = channel;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const cleaned = url.replace("@", "");
      url = `https://t.me/${cleaned}`;
    }
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };
  const displayList = activeTab === "reels" ? userReels : userPosts;
  if (!user) {
    return /*#__PURE__*/React.createElement("div", {
      className: "p-12 text-center text-slate-400"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs"
    }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u043E\u0444\u0438\u043B\u044F..."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "p-4 space-y-4 pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black text-white"
  }, "@", user.username), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setEditUsername(user?.username || "");
      setIsEditing(true);
    },
    className: "text-[10px] bg-slate-800 hover:bg-slate-700 text-pink-400 hover:text-pink-300 font-bold px-2 py-0.5 rounded-lg border border-pink-500/30 transition flex items-center space-x-1",
    title: "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0438\u043A\u043D\u0435\u0439\u043C"
  }, /*#__PURE__*/React.createElement("span", null, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("span", null, "\u0421\u043C\u0435\u043D\u0438\u0442\u044C")), user.badge_type === "gold_founder" ? /*#__PURE__*/React.createElement("span", {
    className: "text-amber-400 font-bold text-sm",
    title: "\u0417\u043E\u043B\u043E\u0442\u0430\u044F \u0413\u0430\u043B\u043E\u0447\u043A\u0430 \u041E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
  }, "\uD83D\uDC51") : user.is_verified ? /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 font-bold text-sm",
    title: "\u0412\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u043E\u0432\u0430\u043D"
  }, "\u2713") : null, user.role === "director" && /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase ml-1"
  }, "\uD83D\uDC51 \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setSettingsOpen(true);
    },
    className: "p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center justify-center space-x-1",
    title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 (Sozlamalar)"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black tracking-widest leading-none"
  }, "\u22EF"))), user.username?.startsWith("user_") && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      triggerHaptic("medium");
      setEditUsername("");
      setIsEditing(true);
    },
    className: "cursor-pointer bg-gradient-to-r from-pink-600/25 via-purple-600/25 to-pink-600/25 border border-pink-500/50 hover:border-pink-400 rounded-2xl p-3 flex items-center justify-between text-xs text-pink-200 transition shadow-lg shadow-pink-600/10 active:scale-98"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\u2728"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-black text-white block text-xs"
  }, "\u041F\u0440\u0438\u0434\u0443\u043C\u0430\u0439\u0442\u0435 \u0441\u0432\u043E\u0439 \u043D\u0438\u043A\u043D\u0435\u0439\u043C!"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-300/80"
  }, "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u0435 \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0439 @", user.username, " \u043D\u0430 \u043A\u0440\u0430\u0441\u0438\u0432\u043E\u0435 \u0438\u043C\u044F"))), /*#__PURE__*/React.createElement("span", {
    className: "bg-gradient-to-r from-pink-600 to-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-md shadow-pink-600/30 whitespace-nowrap"
  }, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u21B5")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative group cursor-pointer",
    onClick: () => setIsEditing(true)
  }, /*#__PURE__*/React.createElement("img", {
    src: user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    alt: "Profile avatar",
    className: "w-20 h-20 rounded-full object-cover ring-2 ring-pink-500 shadow-xl"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-white font-bold"
  }, "\uD83D\uDCF7 \u0421\u043C\u0435\u043D\u0438\u0442\u044C")), user.badge_type === "gold_founder" ? /*#__PURE__*/React.createElement("div", {
    className: "absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ring-2 ring-slate-950 shadow-md"
  }, "\uD83D\uDC51") : user.is_verified ? /*#__PURE__*/React.createElement("div", {
    className: "absolute -bottom-1 -right-1 bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-slate-950"
  }, "\u2713") : null), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex justify-around text-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black text-white block"
  }, userPosts.length), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400"
  }, "\u041F\u043E\u0441\u0442\u043E\u0432")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black text-white block"
  }, "1.4K"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400"
  }, "\u041F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black text-white block"
  }, "348"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400"
  }, "\u041F\u043E\u0434\u043F\u0438\u0441\u043E\u043A")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-base font-black text-white"
  }, user.first_name, " ", user.last_name || "")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300 mt-1.5 whitespace-pre-line leading-relaxed"
  }, user.bio || "Блогер и автор на Venstogram ✨"), user.telegram_channel && /*#__PURE__*/React.createElement("button", {
    onClick: () => openTelegramChannel(user.telegram_channel),
    className: "mt-2 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-600/30 via-blue-600/20 to-sky-600/30 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-500/40 py-2 px-3 rounded-xl text-xs font-bold text-sky-300 transition-all shadow-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "\uD83D\uDCE2"), /*#__PURE__*/React.createElement("span", null, "Telegram-\u043A\u0430\u043D\u0430\u043B: ", user.telegram_channel), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-200"
  }, "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u2197")), user.warnings_count > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-2.5 bg-rose-950/80 border border-rose-500/60 rounded-2xl p-3 space-y-1 shadow-lg shadow-rose-950/40"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs font-black text-rose-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("span", null, "\u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0435 \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B")), /*#__PURE__*/React.createElement("span", {
    className: "bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-mono text-[11px] border border-rose-500/50"
  }, "\u0421\u0442\u0440\u0430\u0439\u043A: ", user.warnings_count, "/3")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-rose-200/90 leading-relaxed"
  }, user.warnings_count === 1 && "Внимание! Дирекция вынесла вам 1-й страйк за нарушение правил. При получении 2-го страйка ваши посты исключаются из рекомендаций, а 3-й означает пожизненный бан.", user.warnings_count === 2 && "Внимание! У вас 2 страйка из 3. Ваши публикации пессимизированы в рекомендациях (теневой бан). Следующее нарушение приведет к перманентной блокировке.", user.warnings_count >= 3 && "Ваш аккаунт заблокирован за систематические нарушения законодательства (Ст. 130 и 244-1 УК РУз).")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("medium");
      setFounderQuestModalOpen(true);
    },
    className: "mt-2.5 w-full bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/40 hover:border-amber-400/80 rounded-2xl p-3 flex items-center justify-between text-left transition shadow-lg shadow-amber-500/10 active:scale-98"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center text-lg font-black shadow-md shadow-amber-500/30"
  }, "\uD83D\uDC51"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-black text-white flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "\u041B\u0438\u0433\u0430 \u0411\u043B\u043E\u0433\u0435\u0440\u043E\u0432 & \u041A\u0432\u0435\u0441\u0442 \u041E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u044F"), user.badge_type === "gold_founder" ? /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/40"
  }, "\u041F\u043E\u0431\u0435\u0434\u0438\u0442\u0435\u043B\u044C \uD83D\uDC51") : /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] bg-pink-500/20 text-pink-300 font-bold px-1.5 py-0.5 rounded border border-pink-500/40"
  }, "\u0421\u043E\u0441\u0442\u044F\u0437\u0430\u043D\u0438\u0435")), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-amber-200/70"
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0430\u0439 \u0434\u0440\u0443\u0437\u0435\u0439, \u043D\u0430\u0431\u0438\u0440\u0430\u0439 \u043E\u0445\u0432\u0430\u0442\u044B \u0438 \u043F\u043E\u043B\u0443\u0447\u0438 \u0417\u043E\u043B\u043E\u0442\u0443\u044E \u0413\u0430\u043B\u043E\u0447\u043A\u0443!"))), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-400 text-base font-bold pr-1"
  }, "\u2192")), user.website && /*#__PURE__*/React.createElement("a", {
    href: user.website,
    target: "_blank",
    rel: "noreferrer",
    className: "text-xs text-pink-400 hover:text-pink-300 font-semibold mt-1.5 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD17"), /*#__PURE__*/React.createElement("span", null, user.website))), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setIsEditing(true);
    },
    className: "flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("span", null, "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("medium");
      onOpenWallet();
    },
    className: "flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-transform active:scale-95"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83E\uDE99"), /*#__PURE__*/React.createElement("span", null, "\u0411\u0430\u043B\u0430\u043D\u0441: ", user.wallet_coins?.toLocaleString()))), /*#__PURE__*/React.createElement("div", {
    className: "flex border-b border-slate-800 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("posts");
    },
    className: `flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${activeTab === "posts" ? "border-pink-500 text-white" : "border-transparent text-slate-500"}`
  }, "\uD83D\uDDBC\uFE0F \u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("reels");
    },
    className: `flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${activeTab === "reels" ? "border-pink-500 text-white" : "border-transparent text-slate-500"}`
  }, "\uD83C\uDFAC Reels"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveTab("saved");
    },
    className: `flex-1 pb-2 text-xs font-bold border-b-2 transition-all ${activeTab === "saved" ? "border-pink-500 text-white" : "border-transparent text-slate-500"}`
  }, "\uD83D\uDD16 \u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043D\u043E\u0435")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-1.5 pt-1"
  }, displayList.map(postItem => /*#__PURE__*/React.createElement("div", {
    key: postItem.id,
    onClick: () => {
      triggerHaptic("light");
      setSelectedPost(postItem);
    },
    className: "aspect-square bg-slate-900 overflow-hidden rounded-xl relative group cursor-pointer border border-slate-800/80 hover:border-pink-500/60 transition-all shadow-sm"
  }, /*#__PURE__*/React.createElement("img", {
    src: postItem.media_urls[0],
    alt: "Post thumbnail",
    className: "w-full h-full object-cover group-hover:scale-105 transition-transform"
  }), activeTab === "reels" && /*#__PURE__*/React.createElement("div", {
    className: "absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-lg p-1 text-white text-[10px]"
  }, "\u25B6"), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 flex items-center justify-between text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity"
  }, /*#__PURE__*/React.createElement("span", null, "\u2764\uFE0F ", postItem.likes_count), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC41\uFE0F ", postItem.views_count))))), selectedPost && /*#__PURE__*/React.createElement(PostModal, {
    post: selectedPost,
    currentUser: user,
    onClose: () => setSelectedPost(null),
    onPostDeleted: deletedId => {
      setSelectedPost(null);
    }
  }), settingsOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\u2699\uFE0F"), /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-black text-white"
  }, "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSettingsOpen(false),
    className: "text-slate-400 hover:text-white text-lg p-1"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-sky-950/80 via-blue-900/40 to-slate-950 p-3.5 rounded-2xl border border-sky-500/40 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm"
  }, "\u2713"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, "\u0421\u0438\u043D\u044F\u044F \u0433\u0430\u043B\u043E\u0447\u043A\u0430 \u0432\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-sky-300"
  }, user.is_verified ? "✅ Активна (3x - 5x буст охватов)" : "3x - 5x охваты и взлёт в рекомендации"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSettingsOpen(false);
      setVerifiedModalOpen(true);
    },
    className: "bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md transition-transform active:scale-95"
  }, user.is_verified ? "Продлить" : "Купить"))), /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      triggerHaptic("medium");
      setSettingsOpen(false);
      setFounderQuestModalOpen(true);
    },
    className: "bg-gradient-to-r from-amber-950/70 via-slate-950 to-amber-950/70 p-3.5 rounded-2xl border border-amber-500/40 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDC51"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, "\u041B\u0438\u0433\u0430 \u0431\u043B\u043E\u0433\u0435\u0440\u043E\u0432 \u043E\u0442 \u041E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u044F"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-amber-300"
  }, "\u041A\u0432\u0435\u0441\u0442, \u0440\u0435\u0444\u0435\u0440\u0430\u043B\u044B, \u0417\u043E\u043B\u043E\u0442\u0430\u044F \u0413\u0430\u043B\u043E\u0447\u043A\u0430 \u0438 \u043F\u043E\u0434\u0430\u0440\u043E\u043A"))), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-400 text-sm"
  }, "\u2192")), /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      setSettingsOpen(false);
      setSecurityModalOpen(true);
    },
    className: "bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDD12"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, "\u0417\u0430\u0449\u0438\u0442\u0438\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "PIN-\u043A\u043E\u0434, Face ID, \u0431\u0438\u043E\u043C\u0435\u0442\u0440\u0438\u044F \u0438 \u0441\u0435\u0441\u0441\u0438\u0438"))), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 text-sm"
  }, "\u2192")), /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-tr from-amber-600/20 via-slate-950 to-yellow-600/10 p-3.5 rounded-2xl border border-amber-500/30 space-y-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-amber-300 font-bold block"
  }, "\uD83D\uDC5B \u0411\u0430\u043B\u0430\u043D\u0441 Vensto Coins:"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl font-black text-white"
  }, (user.wallet_coins || 0).toLocaleString(), " \uD83E\uDE99"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block mt-0.5"
  }, "\u2248 ", ((user.wallet_coins || 0) * 100).toLocaleString(), " UZS (\u0441\u0443\u043C)")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSettingsOpen(false);
      onOpenWallet();
    },
    className: "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
  }, "\u2795 \u041F\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u044C"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, "\uD83C\uDF10 \u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 (Ilova tili):"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, [{
    code: "ru",
    label: "🇷🇺 Русский"
  }, {
    code: "uz_latn",
    label: "🇺🇿 O'zbekcha"
  }, {
    code: "uz_cyrl",
    label: "🇺🇿 Ўзбекча"
  }, {
    code: "en",
    label: "🇬🇧 English"
  }].map(l => /*#__PURE__*/React.createElement("button", {
    key: l.code,
    onClick: () => {
      triggerHaptic("selection");
      onLanguageChange(l.code);
    },
    className: `py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${lang === l.code ? "bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"}`
  }, /*#__PURE__*/React.createElement("span", null, l.label), lang === l.code && /*#__PURE__*/React.createElement("span", null, "\u2713"))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, "\u26A1 \u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F \u0442\u0440\u0430\u0444\u0438\u043A\u0430 (Data Saver)"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "\u0421\u0436\u0438\u043C\u0430\u0442\u044C \u0444\u043E\u0442\u043E \u0438 \u0432\u0438\u0434\u0435\u043E \u043F\u0440\u0438 \u0441\u043B\u0430\u0431\u043E\u043C \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0435")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      onToggleDataSaver();
    },
    className: `w-12 h-6 rounded-full transition-colors relative p-0.5 ${dataSaver ? "bg-emerald-500" : "bg-slate-700"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-5 h-5 rounded-full bg-white transition-transform ${dataSaver ? "translate-x-6" : "translate-x-0"}`
  }))), /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      triggerHaptic("light");
      setSettingsOpen(false);
      setEmailAuthModalOpen(true);
    },
    className: "bg-slate-950 p-3.5 rounded-2xl border border-pink-500/30 flex items-center justify-between cursor-pointer hover:border-pink-500/60 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\u2709\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0438 \u0432\u0445\u043E\u0434 \u043F\u043E Email"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-pink-400"
  }, "\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0439 \u043D\u0438\u043A\u043D\u0435\u0439\u043C, \u043A\u043E\u0434 \u043D\u0430 \u043F\u043E\u0447\u0442\u0443 \u0438 \u0441\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F"))), /*#__PURE__*/React.createElement("span", {
    className: "text-pink-400 text-sm"
  }, "\u2192")), user.avatar_url && /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      setSettingsOpen(false);
      handleDeleteAvatar();
    },
    className: "bg-rose-950/30 hover:bg-rose-900/50 p-3 rounded-2xl border border-rose-900/50 flex items-center justify-between cursor-pointer transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDDD1\uFE0F"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-rose-300"
  }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u044E \u0430\u0432\u0430\u0442\u0430\u0440\u043A\u0438")), /*#__PURE__*/React.createElement("span", {
    className: "text-rose-400 text-xs font-semibold"
  }, "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      setSettingsOpen(false);
      setLegalModalOpen(true);
    },
    className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\u2696\uFE0F"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-300"
  }, "\u0417\u0430\u043A\u043E\u043D\u044B \u0420\u0423\u0437 \u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B")), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 text-xs"
  }, "\u0427\u0438\u0442\u0430\u0442\u044C \u2197")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-slate-400"
  }, /*#__PURE__*/React.createElement("span", null, "\u0420\u043E\u043B\u044C \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435:"), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-400 font-bold capitalize"
  }, user.role)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-slate-400"
  }, /*#__PURE__*/React.createElement("span", null, "Telegram ID:"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-200 font-mono"
  }, user.telegram_id)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-slate-400"
  }, /*#__PURE__*/React.createElement("span", null, "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430:"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "VENSTOGRAM v2.5 Live"))))), securityModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSaveSecurity,
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD12"), /*#__PURE__*/React.createElement("span", null, "\u0417\u0430\u0449\u0438\u0442\u0430 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 \u0438 \u043A\u043E\u0448\u0435\u043B\u044C\u043A\u0430")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setSecurityModalOpen(false),
    className: "text-slate-400 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-400 block mb-1"
  }, "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C 4-\u0437\u043D\u0430\u0447\u043D\u044B\u0439 PIN-\u043A\u043E\u0434 \u0434\u043B\u044F \u0432\u0445\u043E\u0434\u0430 \u0438 \u043A\u043E\u0448\u0435\u043B\u044C\u043A\u0430:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    maxLength: "4",
    value: newPin,
    onChange: e => setNewPin(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-xl tracking-widest text-white outline-none focus:border-pink-500 font-mono"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, "\u0412\u0445\u043E\u0434 \u043F\u043E \u0431\u0438\u043E\u043C\u0435\u0442\u0440\u0438\u0438 (Face ID / \u041E\u0442\u043F\u0435\u0447\u0430\u0442\u043E\u043A)"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C Telegram BiometricManager")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setBiometricActive(!biometricActive),
    className: `w-12 h-6 rounded-full transition-colors relative p-0.5 ${biometricActive ? "bg-emerald-500" : "bg-slate-700"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-5 h-5 rounded-full bg-white transition-transform ${biometricActive ? "translate-x-6" : "translate-x-0"}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setSecurityModalOpen(false),
    className: "flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "flex-1 bg-gradient-to-r from-pink-600 to-rose-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md"
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0437\u0430\u0449\u0438\u0442\u0443")))), verifiedModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400"
  }, "\u2713"), /*#__PURE__*/React.createElement("span", null, "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 Venstogram Verified")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setVerifiedModalOpen(false),
    className: "text-slate-400 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300"
  }, "\u041E\u0434\u0438\u043D \u0440\u0430\u0437 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u043B \u0433\u0430\u043B\u043E\u0447\u043A\u0443 \u2014 \u0438 \u0442\u0432\u043E\u0438 \u0440\u043E\u043B\u0438\u043A\u0438 \u0438 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u043C\u043E\u043C\u0435\u043D\u0442\u0430\u043B\u044C\u043D\u043E \u043F\u043E\u043B\u0443\u0447\u0430\u044E\u0442 ", /*#__PURE__*/React.createElement("b", null, "3x - 5x \u0431\u0443\u0441\u0442 \u0430\u043B\u0433\u043E\u0440\u0438\u0442\u043C\u0430"), " \u0432 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438!"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, [{
    months: 1,
    coins: 1000,
    label: "1 месяц — 1 000 🪙 (100 000 сум)"
  }, {
    months: 3,
    coins: 2500,
    label: "3 месяца — 2 500 🪙 (-17% скидка)"
  }, {
    months: 12,
    coins: 8000,
    label: "1 год — 8 000 🪙 (-33% суперскидка)"
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.months,
    className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white block"
  }, p.label)), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleBuyVerified(p.months, p.coins),
    className: "bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md"
  }, "\u0410\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C")))))), legalModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-3 text-xs leading-relaxed"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-amber-400 flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "\u2696\uFE0F"), /*#__PURE__*/React.createElement("span", null, "\u0417\u0430\u043A\u043E\u043D\u043E\u0434\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0438 \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLegalModalOpen(false),
    className: "text-slate-400 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-300"
  }, "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 ", /*#__PURE__*/React.createElement("b", null, "VENSTOGRAM"), " \u0441\u0442\u0440\u043E\u0433\u043E \u0441\u043E\u0431\u043B\u044E\u0434\u0430\u0435\u0442 \u0437\u0430\u043A\u043E\u043D\u044B \u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0438 \u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D. \u041F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u043A\u0430\u0436\u0434\u044B\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043E\u0431\u044F\u0437\u0443\u0435\u0442\u0441\u044F \u043D\u0435 \u043D\u0430\u0440\u0443\u0448\u0430\u0442\u044C \u0437\u0430\u043A\u043E\u043D\u043E\u0434\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E:"), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-rose-400 block"
  }, "\uD83D\uDD1E \u0421\u0442\u0430\u0442\u044C\u044F 130 \u0423\u0433\u043E\u043B\u043E\u0432\u043D\u043E\u0433\u043E \u043A\u043E\u0434\u0435\u043A\u0441\u0430 \u0420\u0423\u0437:"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-400 text-[11px]"
  }, "\u0418\u0437\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u0438\u0435, \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0432 \u0446\u0435\u043B\u044F\u0445 \u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0438\u043B\u0438 \u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043F\u043E\u0440\u043D\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u043E\u0432 \u0438 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432 \u043D\u0430\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0448\u0442\u0440\u0430\u0444\u043E\u043C \u0438\u043B\u0438 \u043B\u0438\u0448\u0435\u043D\u0438\u0435\u043C \u0441\u0432\u043E\u0431\u043E\u0434\u044B. \u041D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435 \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u044B \u043B\u044E\u0431\u043E\u0439 \u0438\u043D\u0442\u0438\u043C-\u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u0438 \u043F\u043E\u0440\u043D\u043E\u0433\u0440\u0430\u0444\u0438\u044F.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-rose-400 block"
  }, "\uD83D\uDCA3 \u0421\u0442\u0430\u0442\u044C\u044F 244-1 \u0423\u0433\u043E\u043B\u043E\u0432\u043D\u043E\u0433\u043E \u043A\u043E\u0434\u0435\u043A\u0441\u0430 \u0420\u0423\u0437:"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-400 text-[11px]"
  }, "\u0418\u0437\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u0438\u0435, \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 \u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432, \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0449\u0438\u0445 \u0443\u0433\u0440\u043E\u0437\u0443 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438, \u043F\u0440\u043E\u043F\u0430\u0433\u0430\u043D\u0434\u0443 \u043E\u0440\u0443\u0436\u0438\u044F, \u044D\u043A\u0441\u0442\u0440\u0435\u043C\u0438\u0437\u043C\u0430 \u0438\u043B\u0438 \u0442\u0435\u0440\u0440\u043E\u0440\u0438\u0437\u043C\u0430. \u041D\u0430\u0440\u0443\u0448\u0438\u0442\u0435\u043B\u0438 \u0431\u043B\u043E\u043A\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430 \u0441 \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0435\u0439 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u0440\u0430\u0432\u043E\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u043E\u0440\u0433\u0430\u043D\u0430\u043C.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sky-400 block"
  }, "\uD83D\uDCF1 \u0421\u0442\u0430\u0442\u044C\u044F 12-1 \u0417\u0430\u043A\u043E\u043D\u0430 \u0420\u0423\u0437 \xAB\u041E\u0431 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u0438\xBB:"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-400 text-[11px]"
  }, "\u041E\u0431\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u044C \u0431\u043B\u043E\u0433\u0435\u0440\u043E\u0432 \u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u043D\u0435 \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u043F\u0440\u043E\u043F\u0430\u0433\u0430\u043D\u0434\u044B \u043D\u0430\u0441\u0438\u043B\u0438\u044F, \u043F\u043E\u0431\u043E\u0435\u0432, \u0436\u0435\u0441\u0442\u043E\u043A\u043E\u0441\u0442\u0438, \u043C\u043E\u0448\u0435\u043D\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u0438 \u0444\u0430\u043B\u044C\u0448\u0438\u0432\u044B\u0445 \u043F\u043B\u0430\u0442\u0435\u0436\u043D\u044B\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLegalModalOpen(false),
    className: "w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs mt-2"
  }, "\u042F \u043E\u0437\u043D\u0430\u043A\u043E\u043C\u043B\u0435\u043D \u0438 \u0441\u043E\u0433\u043B\u0430\u0441\u0435\u043D"))), isEditing && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSaveProfile,
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white"
  }, "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044F"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setIsEditing(false),
    className: "text-slate-400 hover:text-white text-sm"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center justify-center space-y-2 py-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("img", {
    src: editAvatarUrl || user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    alt: "Avatar preview",
    className: "w-20 h-20 rounded-full object-cover ring-2 ring-pink-500 shadow-md"
  }), uploadingAvatar && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-xs text-white"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...")), /*#__PURE__*/React.createElement("input", {
    type: "file",
    ref: fileInputRef,
    onChange: handleAvatarFileChange,
    accept: "image/*",
    className: "hidden"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => fileInputRef.current?.click(),
    disabled: uploadingAvatar,
    className: "bg-slate-800 hover:bg-slate-700 text-pink-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCF7"), /*#__PURE__*/React.createElement("span", null, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u043E\u0442\u043E")), (editAvatarUrl || user?.avatar_url) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleDeleteAvatar,
    className: "bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-800 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDDD1\uFE0F"), /*#__PURE__*/React.createElement("span", null, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440\u043A\u0443")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-white flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC8E \u0423\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043D\u0438\u043A\u043D\u0435\u0439\u043C (@username)")), checkingUsername ? /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin inline-block"
  }), /*#__PURE__*/React.createElement("span", null, "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430...")) : usernameStatus?.available ? /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\u2713"), /*#__PURE__*/React.createElement("span", null, usernameStatus.is_current ? "Ваш ник" : "Свободен!")) : usernameStatus && !usernameStatus.available ? /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-500/30"
  }, "\u2715 \u0417\u0430\u043D\u044F\u0442") : null), /*#__PURE__*/React.createElement("div", {
    className: "relative flex items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "absolute left-3 text-slate-500 text-xs font-mono font-bold select-none"
  }, "@"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editUsername,
    onChange: e => {
      const val = e.target.value.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "");
      setEditUsername(val);
    },
    placeholder: "\u043F\u0440\u0438\u0434\u0443\u043C\u0430\u0439\u0442\u0435_\u043D\u0438\u043A\u043D\u0435\u0439\u043C",
    className: "w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
  })), usernameStatus && !usernameStatus.available && /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 pt-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-rose-300 block"
  }, usernameStatus.message), usernameStatus.suggestions && usernameStatus.suggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-1 pt-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-amber-300 font-bold block"
  }, "\uD83D\uDC47 \u041D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0441 \u0446\u0438\u0444\u0440\u043E\u0439:"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, usernameStatus.suggestions.map(sug => /*#__PURE__*/React.createElement("button", {
    key: sug,
    type: "button",
    onClick: () => {
      triggerHaptic("medium");
      setEditUsername(sug);
    },
    className: "bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/40 hover:border-pink-400 text-pink-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1 active:scale-95"
  }, /*#__PURE__*/React.createElement("span", null, "@", sug), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-pink-400 bg-pink-500/20 px-1 rounded"
  }, "\u0432\u044B\u0431\u0440\u0430\u0442\u044C \u21B5"))))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-slate-400 block mb-1"
  }, "\u0418\u043C\u044F"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editFirstName,
    onChange: e => setEditFirstName(e.target.value),
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-slate-400 block mb-1"
  }, "\u0424\u0430\u043C\u0438\u043B\u0438\u044F"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editLastName,
    onChange: e => setEditLastName(e.target.value),
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-slate-400 block mb-1"
  }, "\u041E \u0441\u0435\u0431\u0435 (\u0411\u0438\u043E\u0433\u0440\u0430\u0444\u0438\u044F)"), /*#__PURE__*/React.createElement("textarea", {
    rows: "3",
    value: editBio,
    onChange: e => setEditBio(e.target.value),
    placeholder: "\u0420\u0430\u0441\u0441\u043A\u0430\u0436\u0438\u0442\u0435 \u043E \u0441\u0435\u0431\u0435, \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u0430\u0445, \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0435...",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-sky-400 font-bold block mb-1"
  }, "\uD83D\uDCE2 \u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 Telegram-\u043A\u0430\u043D\u0430\u043B \u0438\u043B\u0438 \u0433\u0440\u0443\u043F\u043F\u0443"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editTelegramChannel,
    onChange: e => setEditTelegramChannel(e.target.value),
    placeholder: "https://t.me/mychannel \u0438\u043B\u0438 @mychannel",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-300 outline-none focus:border-sky-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 block mt-0.5"
  }, "\u041A\u043D\u043E\u043F\u043A\u0430 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u043F\u0440\u044F\u043C\u043E \u0432 \u0432\u0430\u0448\u0435\u043C \u043F\u0440\u043E\u0444\u0438\u043B\u0435")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-slate-400 block mb-1"
  }, "\u0412\u0435\u0431-\u0441\u0430\u0439\u0442"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editWebsite,
    onChange: e => setEditWebsite(e.target.value),
    placeholder: "https://example.com",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setIsEditing(false),
    className: "flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-bold"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "flex-1 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white py-2.5 rounded-xl text-xs font-black shadow-lg shadow-pink-600/30"
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C")))), emailAuthModalOpen && /*#__PURE__*/React.createElement(EmailAuthModal, {
    onClose: () => setEmailAuthModalOpen(false),
    onAuthSuccess: u => {
      if (onUpdateUser) onUpdateUser(u);
    }
  }), founderQuestModalOpen && /*#__PURE__*/React.createElement(FounderQuestModal, {
    user: user,
    onClose: () => setFounderQuestModalOpen(false),
    onUserUpdated: u => {
      if (onUpdateUser) onUpdateUser(u);
    }
  }));
}

// --- File: components/AdminView.jsx ---

function AdminView({
  user,
  t
}) {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("orders"); // orders, users, director, moderator, it

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
  useEffect(() => {
    loadOverview();
    loadOrders();
    loadReports();
    loadAuditLogs();
    loadPolicies();
    loadAds();
  }, []);
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
        const current = data.find(p => p.key === selectedPolicyKey) || data[0];
        setSelectedPolicyKey(current.key);
        setPolicyTitle(current.title || "");
        setPolicyContent(current.content || "");
      }
    } catch (e) {}
  };
  const handleSelectPolicyKey = key => {
    setSelectedPolicyKey(key);
    const p = policies.find(item => item.key === key);
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
  const handleReclaimUsername = async targetUsername => {
    const cleanName = (targetUsername || reclaimTarget).trim().replace(/^@/, "");
    if (!cleanName) {
      alert("Введите никнейм для изъятия!");
      return;
    }
    if (!confirm(`Вы действительно хотите изъять юзернейм @${cleanName} в фонд платформы и вернуть его на продажу в Маркетплейс?`)) {
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
  const handleSearchUsers = async q => {
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
  const handleToggleVerified = async targetUserId => {
    triggerHaptic("medium");
    try {
      const res = await Api.post(`/admin/users/${targetUserId}/badge`, {});
      alert(res.message);
      handleSearchUsers(userSearchQuery);
    } catch (err) {
      alert(err.message);
    }
  };
  const handleAddCoins = async targetUserId => {
    const amount = parseInt(userCoinsInput[targetUserId] || 1000);
    triggerHaptic("medium");
    try {
      const res = await Api.post(`/admin/users/${targetUserId}/coins`, {
        amount
      });
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
      const res = await Api.post(`/admin/users/${targetUserId}/ban`, {
        reason
      });
      alert(res.message);
      handleSearchUsers(userSearchQuery);
      if (selectedUserDetail && selectedUserDetail.user?.id === targetUserId) {
        handleViewUserDetails(targetUserId);
      }
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };
  const handleViewUserDetails = async targetUserId => {
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
  const handleCreateAd = async e => {
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
  const handleToggleAd = async adId => {
    triggerHaptic("medium");
    try {
      const res = await Api.post(`/admin/ads/${adId}/toggle`, {});
      alert(res.message);
      loadAds();
    } catch (err) {
      alert(err.message);
    }
  };
  const handleDeleteAd = async adId => {
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
  const handleIssueWarning = async targetUserId => {
    const reason = prompt("Укажите причину предупреждения / страйка (нарушение ст. 130 УК РУз, спам, токсичность):", "Нарушение правил сообщества и законодательства Республики Узбекистан");
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
  const handleGiftUsername = async e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "p-4 space-y-4 pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-amber-600/30 via-pink-600/20 to-purple-600/30 border border-amber-500/40 rounded-3xl p-4 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-black tracking-widest text-amber-400"
  }, "\u041A\u0430\u0431\u0438\u043D\u0435\u0442 \u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0430 & \u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("h2", {
    className: "text-base font-black text-white mt-0.5"
  }, "\u041F\u0430\u043D\u0435\u043B\u044C \u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 Venstogram"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-300"
  }, "\u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440: ", /*#__PURE__*/React.createElement("b", {
    className: "text-amber-300"
  }, "@", user?.username || "admin", " (ID: ", user?.telegram_id || 1477103854, ")"))), /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shadow-lg"
  }, "\uD83D\uDC51")), overview?.kpi && /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-4 space-y-3 shadow-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-black text-white uppercase tracking-wider"
  }, "\u041F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B (\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0437\u0430\u0448\u043B\u043E)")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30"
  }, "Live \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block font-semibold"
  }, "\uD83D\uDFE2 \u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-emerald-400"
  }, (overview.kpi.online_now || 1).toLocaleString()), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500 block"
  }, "\u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block font-semibold"
  }, "\uD83D\uDCC5 \u0417\u0430\u0448\u043B\u0438 \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-indigo-400"
  }, (overview.kpi.active_today || 1).toLocaleString()), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500 block"
  }, "\u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u0437\u0430 24\u0447")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block font-semibold"
  }, "\uD83D\uDC64 \u0412\u0441\u0435\u0433\u043E \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u043E\u0432"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-white"
  }, (overview.kpi.total_users || 0).toLocaleString()), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500 block"
  }, "\u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block font-semibold"
  }, "\u2728 \u041D\u043E\u0432\u044B\u0445 \u0437\u0430 \u0441\u0443\u0442\u043A\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-amber-400"
  }, (overview.kpi.new_users_today || 0).toLocaleString()), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-500 block"
  }, "\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0439")))), /*#__PURE__*/React.createElement("div", {
    className: "flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar space-x-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveSubTab("orders");
      loadOrders();
    },
    className: `py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${activeSubTab === "orders" ? "bg-amber-500 text-slate-950 font-black shadow-md" : "text-slate-400"}`
  }, /*#__PURE__*/React.createElement("span", null, "\uD83E\uDDFE \u0417\u0430\u044F\u0432\u043A\u0438 \u043D\u0430 \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u044B"), orders.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black"
  }, orders.length)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveSubTab("users");
    },
    className: `py-2 px-3 rounded-xl whitespace-nowrap transition-all ${activeSubTab === "users" ? "bg-sky-500 text-slate-950 font-black shadow-md" : "text-slate-400"}`
  }, "\uD83D\uDC65 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveSubTab("ads");
      loadAds();
    },
    className: `py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${activeSubTab === "ads" ? "bg-indigo-600 text-white font-black shadow-md" : "text-slate-400"}`
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCE2 \u0420\u0435\u043A\u043B\u0430\u043C\u0430"), ads.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-indigo-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black"
  }, ads.length)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveSubTab("policies");
      loadPolicies();
    },
    className: `py-2 px-3 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1 ${activeSubTab === "policies" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400"}`
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCDC \u0420\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442 \u0438 \u0423\u0441\u043B\u043E\u0432\u0438\u044F")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveSubTab("director");
    },
    className: `py-2 px-3 rounded-xl whitespace-nowrap transition-all ${activeSubTab === "director" ? "bg-purple-600 text-white shadow-md" : "text-slate-400"}`
  }, "\uD83D\uDCBC \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveSubTab("moderator");
    },
    className: `py-2 px-3 rounded-xl whitespace-nowrap transition-all ${activeSubTab === "moderator" ? "bg-rose-600 text-white shadow-md" : "text-slate-400"}`
  }, "\u2696\uFE0F \u0416\u0430\u043B\u043E\u0431\u044B (", reports.length, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      triggerHaptic("light");
      setActiveSubTab("it");
    },
    className: `py-2 px-3 rounded-xl whitespace-nowrap transition-all ${activeSubTab === "it" ? "bg-blue-600 text-white shadow-md" : "text-slate-400"}`
  }, "\u2699\uFE0F \u0421\u0435\u0440\u0432\u0435\u0440")), activeSubTab === "orders" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/api/admin/buyers/excel",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-2.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all text-center"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCE5 \u0421\u043A\u0430\u0447\u0430\u0442\u044C Excel-\u0440\u0435\u0435\u0441\u0442\u0440 \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u0435\u0439 (.xlsx)")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-300"
  }, "\u041E\u0436\u0438\u0434\u0430\u044E\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0447\u0435\u043A\u0430: ", orders.length), /*#__PURE__*/React.createElement("button", {
    onClick: loadOrders,
    className: "text-[11px] text-pink-400 font-bold hover:underline"
  }, "\uD83D\uDD04 \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C")), orders.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900/60 p-8 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-3xl block mb-2"
  }, "\uD83C\uDF89"), "\u0412\u0441\u0435 \u0437\u0430\u044F\u0432\u043A\u0438 \u043D\u0430 \u043F\u043E\u043A\u0443\u043F\u043A\u0443 \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u043E\u0432 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u044B! \u041D\u043E\u0432\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A \u043D\u0435\u0442.") : orders.map(ord => /*#__PURE__*/React.createElement("div", {
    key: ord.id,
    className: "bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-4 space-y-3 shadow-lg transition-all"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-black text-white"
  }, "@", ord.username || ord.desired_username), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold"
  }, "$", ord.price_usd?.toLocaleString() || 500)), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400 block mt-0.5"
  }, "\u041F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u044C: ", /*#__PURE__*/React.createElement("b", {
    className: "text-pink-400"
  }, "@", ord.buyer?.username), " (", ord.buyer?.first_name, " ", ord.buyer?.last_name || "", ")"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500"
  }, "Telegram ID: ", ord.buyer?.telegram_id)), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-amber-950 text-amber-400 border border-amber-700/50 px-2 py-1 rounded-lg font-bold"
  }, "\u0412 \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 block mt-1"
  }, new Date(ord.created_at).toLocaleTimeString()))), (ord.receipt_url || ord.screenshot_url) && /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
  }, "\u0421\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u0447\u0435\u043A\u0430 \u043E\u0431 \u043E\u043F\u043B\u0430\u0442\u0435:"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setPreviewReceiptUrl(ord.receipt_url || ord.screenshot_url),
    className: "cursor-pointer group relative rounded-xl overflow-hidden bg-black h-36 flex items-center justify-center border border-slate-700 hover:border-pink-500 transition-colors"
  }, /*#__PURE__*/React.createElement("img", {
    src: ord.receipt_url || ord.screenshot_url,
    alt: "\u0427\u0435\u043A",
    className: "h-full w-full object-contain group-hover:scale-105 transition-transform"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-opacity"
  }, "\uD83D\uDD0D \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0434\u043B\u044F \u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u0438\u044F"))), ord.notes && /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-xl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 font-semibold"
  }, "\u0417\u0430\u043C\u0435\u0442\u043A\u0430: "), ord.notes), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2 pt-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleOrderAction(ord.id, "reject"),
    className: "flex-1 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-all"
  }, "\u2715 \u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleOrderAction(ord.id, "approve"),
    className: "flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", null, "\u2713 \u041E\u0434\u043E\u0431\u0440\u0438\u0442\u044C \u0438 \u043F\u0435\u0440\u0435\u0434\u0430\u0442\u044C")))))), activeSubTab === "users" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white"
  }, "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u043C\u0438 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B:"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: userSearchQuery,
    onChange: e => handleSearchUsers(e.target.value),
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u0443 \u0438\u043B\u0438 \u0438\u043C\u0435\u043D\u0438...",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setGiftTargetUser(null);
      setGiftTargetInput("");
      setGiftUsernameInput("");
      setShowGiftModal(true);
    },
    className: "w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition active:scale-98"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDF81"), /*#__PURE__*/React.createElement("span", null, "\u041F\u043E\u0434\u0430\u0440\u0438\u0442\u044C \u043D\u0438\u043A\u043D\u0435\u0439\u043C \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E (\u0411\u0435\u0437 \u043E\u043F\u043B\u0430\u0442\u044B)"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, searchedUsers.map(u => /*#__PURE__*/React.createElement("div", {
    key: u.id,
    className: "bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("img", {
    src: u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    className: "w-10 h-10 rounded-full object-cover"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white"
  }, u.first_name, " ", u.last_name || ""), u.is_verified && /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 text-xs"
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-pink-400 font-bold block"
  }, "@", u.username, " (ID: ", u.telegram_id, ")"))), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-amber-400"
  }, u.wallet_coins, " \uD83E\uDE99")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 pt-1 border-t border-slate-800/80"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleVerified(u.id),
    className: `flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${u.is_verified ? "bg-sky-600/20 text-sky-300 border-sky-500/40" : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"}`
  }, u.is_verified ? "Снять галочку" : "✓ Дать галочку"), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "1000",
    value: userCoinsInput[u.id] || "",
    onChange: e => setUserCoinsInput({
      ...userCoinsInput,
      [u.id]: e.target.value
    }),
    className: "w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleAddCoins(u.id),
    className: "flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 px-2 rounded-xl text-[11px]"
  }, "+ \u041C\u043E\u043D\u0435\u0442\u044B"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-1.5 pt-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleBan(u.id, u.is_banned),
    className: `py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all ${u.is_banned ? "bg-rose-600 text-white border-rose-500" : "bg-slate-800/80 text-rose-400 border-slate-700 hover:bg-rose-950/40"}`
  }, u.is_banned ? "Разбан" : "⛔ Бан"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleIssueWarning(u.id),
    className: "py-1.5 px-1 rounded-xl text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 transition-all flex items-center justify-center space-x-0.5"
  }, /*#__PURE__*/React.createElement("span", null, "\u26A0\uFE0F (", u.warnings_count || 0, "/3)")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setGiftTargetUser(u);
      setGiftTargetInput(u.username);
      setGiftUsernameInput("");
      setShowGiftModal(true);
    },
    className: "py-1.5 px-1 rounded-xl text-[10px] font-bold bg-gradient-to-r from-amber-600/30 to-yellow-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center justify-center space-x-0.5"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDF81 \u041F\u043E\u0434\u0430\u0440\u043E\u043A")), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleViewUserDetails(u.id),
    className: "py-1.5 px-1 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition flex items-center justify-center space-x-0.5"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC41\uFE0F \u0418\u043D\u0444\u043E"))))))), activeSubTab === "ads" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/40 rounded-3xl p-4 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-black tracking-widest text-indigo-400"
  }, "\u041C\u043E\u043D\u0435\u0442\u0438\u0437\u0430\u0446\u0438\u044F & \u0420\u0435\u043A\u043B\u0430\u043C\u043D\u044B\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442"), /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white mt-0.5"
  }, "\u041A\u043E\u043C\u043C\u0435\u0440\u0447\u0435\u0441\u043A\u0430\u044F \u0440\u0435\u043A\u043B\u0430\u043C\u0430 \u0432 \u041B\u0435\u043D\u0442\u0435 \u0438 Reels"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300 mt-1"
  }, "\u0420\u0430\u0437\u043C\u0435\u0449\u0430\u0439\u0442\u0435 \u0440\u0435\u043A\u043B\u0430\u043C\u043D\u044B\u0435 \u043F\u043E\u0441\u0442\u044B \u0431\u0440\u0435\u043D\u0434\u043E\u0432 \u0438 \u0441\u043F\u043E\u043D\u0441\u043E\u0440\u043E\u0432 \u0437\u0430 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowCreateAdModal(true),
    className: "bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 whitespace-nowrap"
  }, "+ \u0421\u043E\u0437\u0434\u0430\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, ads.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs"
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0445 \u0440\u0435\u043A\u043B\u0430\u043C\u043D\u044B\u0445 \u043A\u0430\u043C\u043F\u0430\u043D\u0438\u0439. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \"+ \u0421\u043E\u0437\u0434\u0430\u0442\u044C\".") : ads.map(ad => /*#__PURE__*/React.createElement("div", {
    key: ad.id,
    className: "bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2.5 h-2.5 rounded-full ${ad.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-white"
  }, ad.title)), /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.is_active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"}`
  }, ad.is_active ? "🟢 Активна" : "⏸️ На паузе")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300"
  }, ad.description), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-center text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block"
  }, "\u041F\u043E\u043A\u0430\u0437\u044B:"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-white"
  }, ad.impressions_count.toLocaleString())), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block"
  }, "\u041A\u043B\u0438\u043A\u0438:"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-indigo-400"
  }, ad.clicks_count.toLocaleString())), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block"
  }, "CTR:"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-amber-400"
  }, ad.impressions_count > 0 ? (ad.clicks_count / ad.impressions_count * 100).toFixed(1) : 0, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800"
  }, /*#__PURE__*/React.createElement("span", null, "\u0421\u043F\u043E\u043D\u0441\u043E\u0440: ", /*#__PURE__*/React.createElement("b", {
    className: "text-white"
  }, "@", ad.advertiser_name), " (\u0411\u044E\u0434\u0436\u0435\u0442: $", ad.budget_usd, ")"), /*#__PURE__*/React.createElement("a", {
    href: ad.target_url,
    target: "_blank",
    rel: "noreferrer",
    className: "text-sky-400 hover:underline"
  }, "\u0421\u0441\u044B\u043B\u043A\u0430 \u2197")), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2 pt-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleToggleAd(ad.id),
    className: `flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${ad.is_active ? "bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700" : "bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40"}`
  }, ad.is_active ? "⏸️ Приостановить" : "▶️ Запустить"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteAd(ad.id),
    className: "py-1.5 px-3 rounded-xl text-xs font-bold bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/40 transition"
  }, "\uD83D\uDDD1\uFE0F \u0423\u0434\u0430\u043B\u0438\u0442\u044C")))))), activeSubTab === "policies" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-slate-900 border border-emerald-500/40 rounded-3xl p-4 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCDC"), /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white"
  }, "\u0417\u0430\u043A\u043E\u043D\u043E\u0434\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E & \u0420\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442 \u042D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u044B")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300 leading-relaxed"
  }, "\u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E Venstogram \u043E\u0431\u043B\u0430\u0434\u0430\u0435\u0442 \u0432\u0435\u0440\u0445\u043E\u0432\u043D\u043E\u0439 \u044E\u0440\u0438\u0441\u0434\u0438\u043A\u0446\u0438\u0435\u0439. \u0412\u0441\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u0430 \u0438 \u043F\u0440\u0430\u0432\u0438\u043B \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u0430\u043C\u0438 \u0432\u0441\u0442\u0443\u043F\u0430\u044E\u0442 \u0432 \u0441\u0438\u043B\u0443 \u043D\u0435\u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E \u043F\u043E\u0441\u043B\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F.")), /*#__PURE__*/React.createElement("div", {
    className: "flex bg-slate-950 p-1 rounded-2xl border border-slate-800 space-x-1"
  }, [{
    key: "username_terms",
    label: "🏷️ Регламент никнеймов"
  }, {
    key: "general_rules",
    label: "⚖️ Законы РУз & Правила"
  }, {
    key: "director_authority",
    label: "👑 Полномочия Руководства"
  }].map(p => /*#__PURE__*/React.createElement("button", {
    key: p.key,
    type: "button",
    onClick: () => handleSelectPolicyKey(p.key),
    className: `flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${selectedPolicyKey === p.key ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"}`
  }, p.label))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-xs font-bold text-white block mb-1"
  }, "\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: policyTitle,
    onChange: e => setPolicyTitle(e.target.value),
    placeholder: "\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u0430...",
    className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none transition-colors"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs font-bold text-white"
  }, "\u0422\u0435\u043A\u0441\u0442 \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u0430 / \u0417\u0430\u043A\u043E\u043D\u0430:"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 font-mono"
  }, "\u041A\u043B\u044E\u0447: ", selectedPolicyKey)), /*#__PURE__*/React.createElement("textarea", {
    value: policyContent,
    onChange: e => setPolicyContent(e.target.value),
    rows: 10,
    placeholder: "\u0422\u0435\u043A\u0441\u0442 \u0440\u0435\u0433\u043B\u0430\u043C\u0435\u043D\u0442\u0430...",
    className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl p-3 text-xs text-slate-200 outline-none font-mono leading-relaxed resize-y transition-colors"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: handleSavePolicy,
    disabled: savingPolicy,
    className: "w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", null, savingPolicy ? "Сохранение..." : "💾 Сохранить и применить регламент для всей экосистемы"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-rose-500/30 rounded-3xl p-4 space-y-3 shadow-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-lg"
  }, "\u26A1"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-black text-white"
  }, "\u041F\u0440\u0430\u0432\u043E \u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0430: \u0418\u0437\u044A\u044F\u0442\u0438\u0435 \u043D\u0438\u043A\u043D\u0435\u0439\u043C\u0430 \u0432 \u0444\u043E\u043D\u0434"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400"
  }, "\u0412\u043E\u0437\u0432\u0440\u0430\u0442 \u043B\u044E\u0431\u043E\u0433\u043E \u044E\u0437\u0435\u0440\u043D\u0435\u0439\u043C\u0430 \u0432 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435\u043D\u043D\u044B\u0439 \u0444\u043E\u043D\u0434 \u0438 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432 \u041C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441"))), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: reclaimTarget,
    onChange: e => setReclaimTarget(e.target.value),
    placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0438\u043A\u043D\u0435\u0439\u043C (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 Aziza \u0438\u043B\u0438 @Laylo)...",
    className: "flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleReclaimUsername(reclaimTarget),
    disabled: reclaiming || !reclaimTarget.trim(),
    className: "bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all whitespace-nowrap"
  }, reclaiming ? "Изъятие..." : "Изъять в фонд ⚡")), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-slate-500 italic"
  }, "* \u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0434\u0435\u0440\u0436\u0430\u0442\u0435\u043B\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u043E\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u043E\u0442 \u0431\u043E\u0442\u0430, \u0430 \u0435\u0433\u043E \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u0443\u0435\u0442\u0441\u044F \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0439 ID (user_id). \u041D\u0438\u043A\u043D\u0435\u0439\u043C \u0432\u0435\u0440\u043D\u0435\u0442\u0441\u044F \u0432 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u041C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441."))), activeSubTab === "director" && overview && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 p-3.5 rounded-2xl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block font-semibold"
  }, "\u041E\u0431\u043E\u0440\u043E\u0442 \u043A\u043E\u0448\u0435\u043B\u044C\u043A\u043E\u0432 & \u043F\u043E\u043A\u0443\u043F\u043E\u043A"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-amber-400 mt-1 block"
  }, (overview.kpi.total_turnover_coins || 0).toLocaleString(), " \uD83E\uDE99"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 mt-0.5 block"
  }, "\u2248 ", ((overview.kpi.total_turnover_coins || 0) * 100).toLocaleString(), " UZS")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-emerald-400 block font-semibold"
  }, "\u0427\u0438\u0441\u0442\u0430\u044F \u0432\u044B\u0440\u0443\u0447\u043A\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-emerald-300 mt-1 block"
  }, (overview.kpi.platform_profit_coins || 0).toLocaleString(), " \uD83E\uDE99"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 mt-0.5 block"
  }, "100% \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u0430"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 p-2.5 rounded-xl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-black text-white"
  }, overview.kpi.total_users), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block"
  }, "\u042E\u0437\u0435\u0440\u043E\u0432")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 p-2.5 rounded-xl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-black text-white"
  }, overview.kpi.total_posts), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block"
  }, "\u041F\u043E\u0441\u0442\u043E\u0432")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 p-2.5 rounded-xl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-black text-white"
  }, orders.length), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 block"
  }, "\u0417\u0430\u044F\u0432\u043E\u043A \u043D\u0430 \u0438\u043C\u0435\u043D\u0430"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 rounded-2xl p-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white mb-2"
  }, "\u0410\u0443\u0434\u0438\u0442-\u043B\u043E\u0433 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439:"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 max-h-40 overflow-y-auto text-[11px]"
  }, auditLogs.length === 0 ? /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "\u041B\u043E\u0433\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442") : auditLogs.map(log => /*#__PURE__*/React.createElement("div", {
    key: log.id,
    className: "p-1.5 rounded-lg bg-slate-950 flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300 font-mono"
  }, log.action), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500 text-[10px]"
  }, new Date(log.created_at).toLocaleTimeString())))))), activeSubTab === "moderator" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-rose-950/40 border border-rose-500/30 p-3 rounded-2xl flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-rose-300"
  }, t.reportsQueue), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400"
  }, "AI-\u0441\u043A\u0430\u043D\u0435\u0440 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043F\u043E\u0434\u043E\u0437\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442")), /*#__PURE__*/React.createElement("span", {
    className: "px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black"
  }, reports.length)), reports.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs"
  }, "\u0412\u0441\u0435 \u0436\u0430\u043B\u043E\u0431\u044B \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u044B! AI \u0444\u0438\u043B\u044C\u0442\u0440\u044B \u0432 \u0448\u0442\u0430\u0442\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: handleClearAllReports,
    className: "w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDDD1\uFE0F \u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0441\u0435 \u0436\u0430\u043B\u043E\u0431\u044B \u0432 1 \u043A\u043B\u0438\u043A")), reports.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    className: "bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-white uppercase tracking-wider"
  }, "\u041E\u0431\u044A\u0435\u043A\u0442: ", r.target_type, " #", r.target_id), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
  }, "\u041F\u0440\u0438\u0447\u0438\u043D\u0430: ", r.reason)))))), activeSubTab === "it" && overview && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-white"
  }, "\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 & \u0421\u0435\u0440\u0432\u0435\u0440:"), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center text-xs py-1 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "\u041D\u0430\u0433\u0440\u0443\u0437\u043A\u0430 CPU:"), /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-400 font-mono font-bold"
  }, overview.system_health.cpu_percent, "%")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center text-xs py-1 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 RAM:"), /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-400 font-mono font-bold"
  }, overview.system_health.ram_percent, "%")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center text-xs py-1 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "\u0426\u0435\u043B\u043E\u0441\u0442\u043D\u043E\u0441\u0442\u044C \u0411\u0414 SQLite:"), /*#__PURE__*/React.createElement("span", {
    className: "text-sky-400 font-mono font-bold"
  }, overview.system_health.db_integrity)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center text-xs py-1 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "\u0421\u0440\u0435\u0434\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F:"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-200 font-mono text-[11px]"
  }, overview.system_health.os)))), previewReceiptUrl && /*#__PURE__*/React.createElement("div", {
    onClick: () => setPreviewReceiptUrl(null),
    className: "fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative max-w-lg w-full"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPreviewReceiptUrl(null),
    className: "absolute -top-10 right-0 text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-full"
  }, "\u2715 \u0417\u0430\u043A\u0440\u044B\u0442\u044C"), /*#__PURE__*/React.createElement("img", {
    src: previewReceiptUrl,
    alt: "\u0427\u0435\u043A \u043F\u043E\u043B\u043D\u044B\u0439 \u0440\u0430\u0437\u043C\u0435\u0440",
    className: "w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700"
  }))), selectedUserDetail && (() => {
    const u = selectedUserDetail.user || selectedUserDetail;
    const curUsername = u.username || "";
    const isCustomName = curUsername && !curUsername.startsWith("user_");
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs"
    }, "\uD83D\uDC41\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "text-xs font-bold text-white"
    }, "\u041F\u0440\u043E\u0444\u0438\u043B\u044C: @", curUsername), /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-slate-400"
    }, "ID: ", u.telegram_id, " | \u0420\u043E\u043B\u044C: ", u.role))), /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelectedUserDetail(null),
      className: "p-1 rounded-full text-slate-400 hover:text-white"
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      className: "p-4 space-y-3 overflow-y-auto flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-3"
    }, /*#__PURE__*/React.createElement("img", {
      src: u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      className: "w-12 h-12 rounded-full object-cover ring-2 ring-pink-500"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-bold text-white block"
    }, u.first_name, " ", u.last_name || ""), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-pink-400 font-mono"
    }, "@", curUsername), /*#__PURE__*/React.createElement("div", {
      className: "flex space-x-2 mt-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full"
    }, u.wallet_coins, " \uD83E\uDE99"), u.is_banned && /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-rose-400 font-bold bg-rose-500/20 px-2 py-0.5 rounded-full"
    }, "\u0417\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D \u26D4")))), u.ban_reason && /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-xl border border-rose-900/50"
    }, "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u0431\u0430\u043D\u0430: ", u.ban_reason)), /*#__PURE__*/React.createElement("div", {
      className: "bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-xs"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-white flex items-center space-x-1.5"
    }, /*#__PURE__*/React.createElement("span", null, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("span", null, "\u0421\u0442\u0430\u0442\u0443\u0441 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0439 (\u0417\u0430\u043A\u043E\u043D 3-\u0445 \u0441\u0442\u0440\u0430\u0439\u043A\u043E\u0432):")), /*#__PURE__*/React.createElement("span", {
      className: "font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20"
    }, u.warnings_count || 0, " / 3")), u.warnings_history && u.warnings_history.length > 0 ? /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] text-slate-400 space-y-1 pt-1.5 border-t border-slate-800"
    }, u.warnings_history.map((w, idx) => /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: "flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-rose-300"
    }, "\u0421\u0442\u0440\u0430\u0439\u043A #", w.strike || idx + 1, ": ", w.reason), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500 font-mono text-[9px]"
    }, w.date?.slice(0, 10))))) : /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] text-emerald-400 block"
    }, "\u041D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0439 \u043D\u0435\u0442 (\u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0447\u0438\u0441\u0442)")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      className: "text-xs font-bold text-white mb-2"
    }, "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 (", selectedUserDetail.posts?.length || 0, "):"), !selectedUserDetail.posts || selectedUserDetail.posts.length === 0 ? /*#__PURE__*/React.createElement("p", {
      className: "text-slate-500 text-xs text-center py-4 bg-slate-950 rounded-xl"
    }, "\u0423 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0439") : /*#__PURE__*/React.createElement("div", {
      className: "space-y-2"
    }, selectedUserDetail.posts.map(p => /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2.5"
    }, /*#__PURE__*/React.createElement("img", {
      src: p.media_urls?.[0] || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100",
      className: "w-12 h-12 rounded-lg object-cover"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-white truncate"
    }, p.caption || "Без описания"), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-3 text-[10px] text-slate-400 mt-1"
    }, /*#__PURE__*/React.createElement("span", null, "\u2764\uFE0F ", p.likes_count), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCAC ", p.comments_count), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC41\uFE0F ", p.views_count), /*#__PURE__*/React.createElement("span", {
      className: p.moderation_status === "approved" ? "text-emerald-400" : "text-amber-400"
    }, p.moderation_status)))))))), /*#__PURE__*/React.createElement("div", {
      className: "p-3 bg-slate-900 border-t border-slate-800 flex space-x-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => handleToggleBan(u.id, u.is_banned),
      className: `flex-1 py-2 rounded-xl text-xs font-bold ${u.is_banned ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-rose-600 hover:bg-rose-500 text-white"}`
    }, u.is_banned ? "✅ Разблокировать" : "⛔ Бан"), /*#__PURE__*/React.createElement("button", {
      onClick: () => handleIssueWarning(u.id),
      className: "flex-1 py-2 rounded-xl text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 transition whitespace-nowrap"
    }, "\u26A0\uFE0F \u0421\u0442\u0440\u0430\u0439\u043A"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setGiftTargetUser(u);
        setGiftTargetInput(u.username);
        setGiftUsernameInput("");
        setShowGiftModal(true);
      },
      className: "flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md transition whitespace-nowrap"
    }, "\uD83C\uDF81 \u041F\u043E\u0434\u0430\u0440\u0438\u0442\u044C"), isCustomName && /*#__PURE__*/React.createElement("button", {
      onClick: () => handleReclaimUsername(curUsername),
      disabled: reclaiming,
      className: "flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all whitespace-nowrap"
    }, "\u26A1 \u0418\u0437\u044A\u044F\u0442\u044C"))));
  })(), showCreateAdModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: handleCreateAd,
    className: "bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3.5 shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-2.5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCE2"), /*#__PURE__*/React.createElement("span", null, "\u041D\u043E\u0432\u0430\u044F \u0440\u0435\u043A\u043B\u0430\u043C\u043D\u0430\u044F \u043A\u0430\u043C\u043F\u0430\u043D\u0438\u044F")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowCreateAdModal(false),
    className: "text-slate-400 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: adTitle,
    onChange: e => setAdTitle(e.target.value),
    placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0421\u043A\u0438\u0434\u043A\u0430 20% \u0432 \u0430\u0432\u0442\u043E\u0441\u0430\u043B\u043E\u043D\u0435 Tashkent Motors",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0422\u0435\u043A\u0441\u0442 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F:"), /*#__PURE__*/React.createElement("textarea", {
    rows: "2",
    required: true,
    value: adDescription,
    onChange: e => setAdDescription(e.target.value),
    placeholder: "\u041F\u0440\u0435\u043C\u0438\u0430\u043B\u044C\u043D\u044B\u0435 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u0438 \u0441 \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0439 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0435\u0439...",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0431\u0430\u043D\u043D\u0435\u0440 / \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0443 (URL):"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: adImageUrl,
    onChange: e => setAdImageUrl(e.target.value),
    placeholder: "https://images.unsplash.com/photo-...",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0426\u0435\u043B\u0435\u0432\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430 (\u043A\u0430\u043D\u0430\u043B, \u0441\u0430\u0439\u0442, \u0431\u043E\u0442):"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    required: true,
    value: adTargetUrl,
    onChange: e => setAdTargetUrl(e.target.value),
    placeholder: "https://t.me/tashkent_motors",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0418\u043C\u044F \u0440\u0435\u043A\u043B\u0430\u043C\u043E\u0434\u0430\u0442\u0435\u043B\u044F:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: adAdvertiser,
    onChange: e => setAdAdvertiser(e.target.value),
    placeholder: "Tashkent Motors",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0422\u0435\u043A\u0441\u0442 \u043A\u043D\u043E\u043F\u043A\u0438 (CTA):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: adCtaText,
    onChange: e => setAdCtaText(e.target.value),
    placeholder: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u2197",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u0411\u044E\u0434\u0436\u0435\u0442 \u043A\u0430\u043C\u043F\u0430\u043D\u0438\u0438 ($):"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: adBudget,
    onChange: e => setAdBudget(e.target.value),
    placeholder: "100",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
  })), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 flex space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowCreateAdModal(false),
    className: "flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: savingAd,
    className: "flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition"
  }, savingAd ? "Создание..." : "Запустить рекламу 🚀")))), showGiftModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: handleGiftUsername,
    className: "bg-slate-900 border border-amber-500/40 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl shadow-amber-500/10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-slate-800 pb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl"
  }, "\uD83C\uDF81"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-black text-white"
  }, "\u041F\u043E\u0434\u0430\u0440\u0438\u0442\u044C \u043D\u0438\u043A\u043D\u0435\u0439\u043C \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-amber-300"
  }, "\u041F\u0440\u0438\u0432\u0438\u043B\u0435\u0433\u0438\u044F \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowGiftModal(false),
    className: "text-slate-400 hover:text-white"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041A\u043E\u043C\u0443 \u0434\u0430\u0440\u0438\u043C (ID \u0438\u043B\u0438 @\u043D\u0438\u043A\u043D\u0435\u0439\u043C):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: giftTargetInput,
    onChange: e => setGiftTargetInput(e.target.value),
    placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: 1477103854 \u0438\u043B\u0438 oqyolai",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
  }), giftTargetUser && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-emerald-400 mt-1 block"
  }, "\u0412\u044B\u0431\u0440\u0430\u043D: ", giftTargetUser.first_name, " (@", giftTargetUser.username, ")")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] font-bold text-slate-300 block mb-1"
  }, "\u041A\u0430\u043A\u043E\u0439 \u043D\u0438\u043A\u043D\u0435\u0439\u043C \u043F\u043E\u0434\u0430\u0440\u0438\u0442\u044C (\u0431\u0435\u0437 @):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: giftUsernameInput,
    onChange: e => setGiftUsernameInput(e.target.value),
    placeholder: "sherzod, shoxrux, madina...",
    className: "w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 mt-1 block leading-relaxed"
  }, "\u041D\u0438\u043A\u043D\u0435\u0439\u043C \u043F\u0435\u0440\u0435\u0439\u0434\u0435\u0442 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E ", /*#__PURE__*/React.createElement("b", null, "\u0441\u043E\u0432\u0435\u0440\u0448\u0435\u043D\u043D\u043E \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u0438 \u0431\u0435\u0437 \u043E\u043F\u043B\u0430\u0442\u044B"), ", \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u043F\u043E\u043B\u0443\u0447\u0438\u0442 \u0432\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044E, \u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E \u043F\u0440\u0438\u0434\u0435\u0442 \u043F\u043E\u0437\u0434\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0443\u0448 \u0432 Telegram!")), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 flex space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowGiftModal(false),
    className: "flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: giftingUsername,
    className: "flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-lg shadow-amber-500/30 transition active:scale-98"
  }, giftingUsername ? "Подарок..." : "🎁 Подарить!")))));
}

// --- File: components/CreatePostModal.jsx ---

function CreatePostModal({
  t,
  onClose,
  onPostCreated,
  dataSaver
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [activeFilter, setActiveFilter] = useState("none");
  const [uploading, setUploading] = useState(false);
  const filters = [{
    id: "none",
    name: "Normal",
    class: ""
  }, {
    id: "vivid",
    name: "Vivid",
    class: "contrast-125 saturate-150"
  }, {
    id: "sunset",
    name: "Sunset",
    class: "sepia-[0.3] hue-rotate-[-10deg] saturate-125"
  }, {
    id: "emerald",
    name: "Emerald",
    class: "hue-rotate-[45deg] contrast-110"
  }, {
    id: "bw",
    name: "B&W",
    class: "grayscale contrast-125"
  }];
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      triggerHaptic("light");
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  const handlePublish = async e => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) return;
    triggerHaptic("medium");
    setUploading(true);
    try {
      // 1. Upload media file
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await Api.post(`/upload?data_saver=${dataSaver}`, formData);

      // 2. Extract hashtags
      const hashtags = (caption.match(/#[a-zа-яё0-9_]+/gi) || []).map(h => h.slice(1));

      // 3. Create post
      const postRes = await Api.post("/posts", {
        caption,
        media_urls: [uploadRes.url],
        media_type: selectedFile.type.startsWith("video") ? "video" : "image",
        location,
        hashtags
      });
      SoundEngine.playFanfare();
      alert(postRes.message);
      onPostCreated();
      onClose();
    } catch (err) {
      triggerHaptic("error");
      alert(err.message || "Ошибка публикации");
    } finally {
      setUploading(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-extrabold text-white"
  }, t.newPost), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-white p-1"
  }, "\u2715")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handlePublish,
    className: "py-3 flex-1 overflow-y-auto space-y-3.5"
  }, !previewUrl ? /*#__PURE__*/React.createElement("label", {
    className: "border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDCF8"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-300"
  }, t.selectMedia), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 mt-1"
  }, "\u0424\u043E\u0442\u043E \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E \u0438\u0437 \u0433\u0430\u043B\u0435\u0440\u0435\u0438"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*,video/*",
    onChange: handleFileChange,
    className: "hidden"
  })) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "relative w-full aspect-square rounded-2xl overflow-hidden bg-black mb-2"
  }, /*#__PURE__*/React.createElement("img", {
    src: previewUrl,
    alt: "Preview",
    className: `w-full h-full object-cover transition-all ${filters.find(f => f.id === activeFilter)?.class || ""}`
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setSelectedFile(null);
      setPreviewUrl("");
    },
    className: "absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 text-xs hover:bg-black/90"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "flex space-x-2 overflow-x-auto pb-1 no-scrollbar"
  }, filters.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.id,
    type: "button",
    onClick: () => {
      triggerHaptic("selection");
      setActiveFilter(f.id);
    },
    className: `px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border ${activeFilter === f.id ? "bg-pink-600 text-white border-pink-500" : "bg-slate-800 text-slate-400 border-slate-700"}`
  }, f.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("textarea", {
    rows: "3",
    value: caption,
    onChange: e => setCaption(e.target.value),
    placeholder: t.addCaption,
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: location,
    onChange: e => setLocation(e.target.value),
    placeholder: "\uD83D\uDCCD \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0433\u0435\u043E\u043F\u043E\u0437\u0438\u0446\u0438\u044E (\u043D\u0430\u043F\u0440. Tashkent City)",
    className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: !selectedFile && !previewUrl || uploading,
    className: "w-full bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 disabled:opacity-40 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center space-x-1"
  }, uploading ? /*#__PURE__*/React.createElement("span", null, "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F...") : /*#__PURE__*/React.createElement("span", null, "\uD83D\uDE80 ", t.post)))));
}

// --- File: app.jsx ---

function App() {
  const safeGetItem = k => {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  const safeSetItem = (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  };
  const [lang, setLang] = useState(getInitialLanguage());
  const t = translations[lang] || translations.ru;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [dataSaver, setDataSaver] = useState(safeGetItem("vensto_data_saver") === "true");

  // Data states
  const [posts, setPosts] = useState([]);
  const [storiesGroups, setStoriesGroups] = useState([]);
  const [reels, setReels] = useState([]);

  // Modals
  const [walletOpen, setWalletOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [founderQuestOpen, setFounderQuestOpen] = useState(false);

  // Initialize Telegram SDK & Authentication
  useEffect(() => {
    try {
      initTelegramApp();
    } catch (e) {
      console.warn("initTelegramApp error", e);
    }
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("vensto_offline_mode", () => setIsOffline(true));
    authenticateUser();
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
  const authenticateUser = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData;
      let authResult = null;
      if (initData) {
        try {
          authResult = await Api.post("/auth/telegram", {
            init_data: initData
          });
        } catch (e) {
          console.warn("Telegram auth API failed, using fallback:", e);
        }
      }
      if (!authResult || !authResult.user) {
        // Fallback for browser preview / local dev or initData mismatch
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const targetTgId = tgUser?.id || 1477103854;
        const targetUsername = tgUser?.username || "oqyolai";
        const targetFirstName = tgUser?.first_name || "Admin";
        try {
          authResult = await Api.post("/auth/dev-login", {
            telegram_id: targetTgId,
            username: targetUsername,
            first_name: targetFirstName,
            last_name: tgUser?.last_name || ""
          });
        } catch (e) {
          console.error("dev-login failed", e);
        }
      }
      if (authResult && authResult.user) {
        Api.setToken(authResult.access_token);
        setUser(authResult.user);
      } else {
        // Safe ultimate fallback user so app never stays blank
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        setUser({
          id: 1,
          telegram_id: tgUser?.id || 1477103854,
          username: tgUser?.username || "oqyolai",
          first_name: tgUser?.first_name || "Vensto",
          last_name: tgUser?.last_name || "Director",
          role: "director",
          wallet_coins: 100000,
          is_verified: true
        });
      }

      // Check deep link parameters
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      const startAppParam = urlParams.get("startapp");
      if (tabParam) {
        if (tabParam === "quest" || tabParam === "tab_quest") setFounderQuestOpen(true);else setActiveTab(tabParam);
      }
      if (startAppParam) {
        if (startAppParam.startsWith("chat")) setChatOpen(true);else if (startAppParam.startsWith("reels")) setActiveTab("reels");else if (startAppParam.includes("admin")) setActiveTab("admin");else if (startAppParam.startsWith("search")) setActiveTab("search");else if (startAppParam.includes("quest")) setFounderQuestOpen(true);
      }

      // Load initial feed & stories & reels
      loadAllContent();
    } catch (err) {
      console.error("[Auth Error]", err);
    } finally {
      setLoading(false);
    }
  };
  const loadAllContent = async () => {
    try {
      const [feedData, storiesData, reelsData] = await Promise.all([Api.get("/posts").catch(() => []), Api.get("/stories").catch(() => []), Api.get("/reels").catch(() => [])]);
      if (feedData) setPosts(feedData);
      if (storiesData) setStoriesGroups(storiesData);
      if (reelsData) setReels(reelsData);
    } catch (e) {}
  };
  const handleLanguageChange = newLang => {
    setLang(newLang);
    safeSetItem("vensto_lang", newLang);
  };
  const toggleDataSaver = () => {
    const val = !dataSaver;
    setDataSaver(val);
    safeSetItem("vensto_data_saver", val.toString());
  };
  const handleOpenUserChat = targetUser => {
    setActiveChatUser(targetUser);
    setChatOpen(true);
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white select-none"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center font-black text-3xl shadow-2xl shadow-pink-500/40 animate-pulse"
    }, "V"), /*#__PURE__*/React.createElement("span", {
      className: "text-sm text-slate-300 mt-4 font-bold tracking-wider uppercase"
    }, "Venstogram Mini App"), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] text-pink-400 mt-1 font-semibold animate-pulse"
    }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B..."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-slate-950 text-white font-sans flex flex-col select-none"
  }, isOffline && /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-600/90 text-white text-[11px] font-bold px-3 py-1 text-center sticky top-0 z-50"
  }, "\u26A0\uFE0F ", t.offlineNotice), /*#__PURE__*/React.createElement(Header, {
    user: user,
    t: t,
    onOpenCreate: () => setCreatePostOpen(true),
    onOpenChat: () => setChatOpen(true)
  }), /*#__PURE__*/React.createElement("main", {
    className: "flex-1"
  }, activeTab === "feed" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(StoriesBar, {
    storiesGroups: storiesGroups,
    currentUserId: user?.id,
    t: t,
    onStoryCreated: loadAllContent
  }), /*#__PURE__*/React.createElement(FeedView, {
    posts: posts,
    setPosts: setPosts,
    t: t,
    user: user,
    onOpenProfile: () => setActiveTab("profile")
  })), activeTab === "search" && /*#__PURE__*/React.createElement(SearchView, {
    currentUser: user,
    t: t,
    onOpenChat: handleOpenUserChat
  }), activeTab === "reels" && /*#__PURE__*/React.createElement(ReelsView, {
    reels: reels,
    setReels: setReels,
    t: t,
    user: user
  }), activeTab === "marketplace" && /*#__PURE__*/React.createElement(MarketplaceView, {
    user: user,
    t: t,
    onUpdateUser: updated => setUser(updated)
  }), activeTab === "profile" && /*#__PURE__*/React.createElement(ProfileView, {
    user: user,
    t: t,
    lang: lang,
    onLanguageChange: handleLanguageChange,
    dataSaver: dataSaver,
    onToggleDataSaver: toggleDataSaver,
    onOpenWallet: () => setWalletOpen(true),
    onUpdateUser: updated => setUser(updated)
  }), activeTab === "admin" && /*#__PURE__*/React.createElement(AdminView, {
    user: user,
    t: t
  })), /*#__PURE__*/React.createElement(BottomNav, {
    activeTab: activeTab,
    onTabChange: tab => setActiveTab(tab),
    t: t,
    userRole: user?.role
  }), walletOpen && /*#__PURE__*/React.createElement(WalletModal, {
    user: user,
    t: t,
    onClose: () => setWalletOpen(false),
    onUpdateUser: updated => setUser(updated)
  }), createPostOpen && /*#__PURE__*/React.createElement(CreatePostModal, {
    t: t,
    dataSaver: dataSaver,
    onClose: () => setCreatePostOpen(false),
    onPostCreated: loadAllContent
  }), chatOpen && /*#__PURE__*/React.createElement(ChatView, {
    user: user,
    activeUser: activeChatUser,
    t: t,
    onClose: () => {
      setChatOpen(false);
      setActiveChatUser(null);
    }
  }), founderQuestOpen && /*#__PURE__*/React.createElement(FounderQuestModal, {
    user: user,
    onClose: () => setFounderQuestOpen(false),
    onUserUpdated: updated => setUser(updated)
  }));
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught]", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return /*#__PURE__*/React.createElement("div", {
        className: "min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center text-center font-sans"
      }, /*#__PURE__*/React.createElement("div", {
        className: "w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-3xl font-black mb-4 shadow-xl"
      }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("h2", {
        className: "text-lg font-bold text-white mb-2"
      }, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("p", {
        className: "text-xs text-rose-300 mb-6 max-w-xs leading-relaxed"
      }, this.state.error?.message || "Не удалось отрисовать компонент"), /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          try {
            localStorage.clear();
          } catch (e) {}
          window.location.reload();
        },
        className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-pink-500/30 active:scale-95 transition-transform"
      }, "\uD83D\uDD04 \u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435"));
    }
    return this.props.children;
  }
}

// --- Mount ---
function mountApp() {
  const rootEl = document.getElementById("root");
  if (rootEl && !window.__vensto_mounted) {
    window.__vensto_mounted = true;
    try {
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
      console.log("[Venstogram] App successfully mounted to DOM with ErrorBoundary!");
    } catch (err) {
      console.error("[Mount Error]", err);
      const errBox = document.getElementById("debug-error");
      if (errBox) {
        errBox.style.display = "block";
        errBox.innerHTML = "<div style='padding:20px;text-align:center;'><h3 style='color:#ef4444;'>Ошибка запуска</h3><p style='color:#fff;font-size:12px;'>" + (err.message || err) + "</p></div>";
      }
    }
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp);
} else {
  mountApp();
}