// Mock browser environment
const fs = require('fs');

const bundle = fs.readFileSync('frontend/app.bundle.js', 'utf8');

global.window = {
  Telegram: {
    WebApp: {
      initData: 'query_id=AAHdF6IQAAAAAN0XohDZ2Y8L&user=%7B%22id%22%3A1477103854%2C%22first_name%22%3A%22Admin%22%2C%22username%22%3A%22oqyolai%22%7D&auth_date=1620000000&hash=mock',
      initDataUnsafe: {
        user: { id: 1477103854, first_name: 'Admin', username: 'oqyolai', language_code: 'ru' }
      },
      ready: () => {},
      expand: () => {},
      setHeaderColor: () => {},
      setBackgroundColor: () => {},
      HapticFeedback: { impactOccurred: () => {}, selectionChanged: () => {}, notificationOccurred: () => {} },
      BackButton: { show: () => {}, hide: () => {}, onClick: () => {} }
    }
  },
  location: { search: '', href: 'https://example.com/app/' },
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: { getItem: () => null, setItem: () => {} },
  navigator: { onLine: true, language: 'ru' }
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => ({ id, innerHTML: '' }),
  documentElement: { classList: { add: () => {}, remove: () => {} } }
};

global.navigator = global.window.navigator;
global.localStorage = global.window.localStorage;

try {
  // Execute bundle without mounting
  const runCode = bundle.replace('mountApp();', '// skipped auto mount');
  eval(runCode);
  console.log('App component defined:', typeof App === 'function');
  console.log('Mount function defined:', typeof mountApp === 'function');
} catch (e) {
  console.error('CRASH DURING EVAL:', e);
}
