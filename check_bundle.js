const fs = require('fs');
const code = fs.readFileSync('frontend/app.bundle.js', 'utf8');
console.log('Bundle length:', code.length);
try {
  new Function('React', 'ReactDOM', code);
  console.log('Syntax check: OK');
} catch (e) {
  console.error('Syntax error:', e);
}
