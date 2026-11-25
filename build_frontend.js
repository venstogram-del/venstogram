const fs = require('fs');
const path = require('path');
const Babel = require('./babel.min.js');

const srcDir = path.join(__dirname, 'frontend', 'src');

const files = [
  'i18n.js',
  'telegram.js',
  'sound.js',
  'api.js',
  'components/AudienceStatsModal.jsx',
  'components/CityLocationModal.jsx',
  'components/ShareModal.jsx',
  'components/PostModal.jsx',
  'components/FollowListModal.jsx',
  'components/UserProfileModal.jsx',
  'components/NotificationsModal.jsx',
  'components/Header.jsx',
  'components/BottomNav.jsx',
  'components/StoriesBar.jsx',
  'components/FeedView.jsx',
  'components/SearchView.jsx',
  'components/ReelsView.jsx',
  'components/ChatView.jsx',
  'components/MarketplaceView.jsx',
  'components/WalletModal.jsx',
  'components/EmailAuthModal.jsx',
  'components/FounderQuestModal.jsx',
  'components/ProfileView.jsx',
  'components/AdminView.jsx',
  'components/CreatePostModal.jsx',
  'components/RegistrationModal.jsx',
  'app.jsx'
];

let combined = `
const { useState, useEffect, useRef } = React;
`;

for (const f of files) {
  const filePath = path.join(srcDir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Strip import statements
  content = content.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  // Strip export statements but keep declarations
  content = content.replace(/export\s+default\s+/g, '');
  content = content.replace(/export\s+(function|const|let|var|class)\s+/g, '$1 ');

  combined += `\n// --- File: ${f} ---\n` + content + '\n';
}

// Add React Error Boundary and ReactDOM render
combined += `
// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught]", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-3xl font-black mb-4 shadow-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Ошибка отображения</h2>
          <p className="text-xs text-rose-300 mb-6 max-w-xs leading-relaxed">
            {this.state.error?.message || "Не удалось отрисовать компонент"}
          </p>
          <button
            onClick={() => {
              try { localStorage.clear(); } catch(e) {}
              window.location.reload();
            }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-pink-500/30 active:scale-95 transition-transform"
          >
            🔄 Перезапустить приложение
          </button>
        </div>
      );
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
      root.render(
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement(App)
        )
      );
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
`;

console.log("[Build] Compiling JSX with Babel...");
const transformed = Babel.transform(combined, {
  presets: ['react']
}).code;

const outFile = path.join(__dirname, 'frontend', 'app.bundle.js');
fs.writeFileSync(outFile, transformed, 'utf8');
console.log(`[Build] Successfully compiled to ${outFile} (${(transformed.length / 1024).toFixed(1)} KB)!`);
