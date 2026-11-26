// API Client & Realtime WebSocket manager for Venstogram

const API_BASE = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";

const SafeStorage = {
  getItem(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  },
  setItem(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  },
  removeItem(k) {
    try { localStorage.removeItem(k); } catch (e) {}
  }
};

export const Api = {
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
        const errorData = await res.json().catch(() => ({ detail: "Network error" }));
        const err = new Error(errorData.detail || "Server error");
        err.status = res.status;
        throw err;
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
          window.dispatchEvent(new CustomEvent("vensto_offline_mode", { detail: true }));
          return JSON.parse(cached);
        }
      }
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
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
    return this.request(endpoint, { method: "DELETE" });
  }
};

export class RealtimeSocket {
  constructor(token, onEvent) {
    this.token = token;
    this.listeners = new Set();
    if (onEvent) this.listeners.add(onEvent);
    this.ws = null;
    this.reconnectTimer = null;
    this.connect();
    window.__vensto_socket = this;
  }

  addListener(fn) {
    if (fn) this.listeners.add(fn);
    return () => this.removeListener(fn);
  }

  removeListener(fn) {
    if (fn) this.listeners.delete(fn);
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

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((fn) => {
            try { fn(data); } catch (e) { console.warn("[WS Listener Err]", e); }
          });
        } catch (e) {}
      };

      this.ws.onclose = () => {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };
    } catch (e) {
      console.warn("[Venstogram WS] Connection error", e);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  joinRoom(room) {
    this.send({ type: "join_room", room });
  }

  leaveRoom(room) {
    this.send({ type: "leave_room", room });
  }

  close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}

