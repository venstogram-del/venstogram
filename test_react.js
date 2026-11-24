global.window = global;
global.document = {
  readyState: 'complete',
  createElement: (tag) => ({ tagName: tag, style: {}, setAttribute: () => {}, appendChild: () => {} }),
  getElementById: (id) => ({ id, appendChild: () => {}, innerHTML: '' }),
  addEventListener: () => {}
};
global.navigator = { onLine: true, userAgent: 'test' };
global.localStorage = { getItem: () => null, setItem: () => {} };

require('./frontend/react.min.js');
require('./frontend/react-dom.min.js');

console.log('React defined?', typeof React !== 'undefined');
console.log('ReactDOM defined?', typeof ReactDOM !== 'undefined');
console.log('ReactDOM.createRoot defined?', typeof ReactDOM.createRoot === 'function');
