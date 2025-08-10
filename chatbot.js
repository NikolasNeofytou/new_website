// Simple rule-based helper chatbot (client-side only) with local history persistence
const KB = [
  { q: /filter|search|semester|year|course/i, a: 'Use the Past Papers page filters: enter course code or name, choose semester and year. Click Clear to reset. Sorting is available via the Sort dropdown.' },
  { q: /rate|stars|rating/i, a: 'Open a paper and click a star to rate (1-5). You can change it by clicking a different star or remove it with the Remove button.' },
  { q: /comment|discussion/i, a: 'In the viewer you can add a comment if signed in. Vote using ▲/▼. After 3 reports a comment is hidden (can still be revealed).'},
  { q: /offline|cache|install/i, a: 'The site caches core pages and API responses. After first visit you can revisit while offline. To update cache, refresh when online.' },
  { q: /report|moderation|hide/i, a: 'Each report increments a counter. At 3 reports the comment is hidden with an option to reveal.' },
  { q: /login|sign.?in|email/i, a: 'Sign in with your @ece.ntua.gr email. A pseudo student ID is stored locally; no password needed yet.' },
  { q: /clear|reset/i, a: 'Use the Clear button on the Past Papers page to reset all filters and sorting.' },
  { q: /sort|order/i, a: 'Sort choices: Newest, Oldest, Highest Rated. It re-queries and re-renders results.' },
  { q: /star.*meaning|average|breakdown/i, a: 'The rating summary shows average and count; breakdown bars show distribution of 1-5 star votes.' },
  { q: /who.*you|what.*you|help|chatbot/i, a: 'I am a lightweight on-device helper that matches patterns to provide quick guidance. No data leaves your browser.' }
];

function answer(msg) {
  const found = KB.find(entry => entry.q.test(msg));
  if (found) return found.a;
  if (msg.length < 6) return 'Could you elaborate a bit more?';
  return 'I\'m not sure. Try rephrasing or ask about filters, ratings, comments, offline, or login.';
}

function append(role, text, {persist=true} = {}) {
  const log = document.getElementById('chat-log');
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'msg-user' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (role === 'user' ? 'bubble-user' : 'bubble-bot');
  bubble.textContent = text;
  div.appendChild(bubble);
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  if (persist) storeMessage(role, text);
}

const HISTORY_KEY = 'chatbotHistoryV1';

function storeMessage(role, text) {
  try {
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    arr.push({role, text, t: Date.now()});
    // cap to last 100 messages
    if (arr.length > 100) arr.splice(0, arr.length - 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  } catch (_) {}
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch (_) { return []; }
}

function renderHistory() {
  const hist = loadHistory();
  if (!hist.length) return false;
  hist.forEach(m => append(m.role, m.text, {persist:false}));
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  const hadHistory = renderHistory();
  if (!hadHistory) append('bot', 'Hi! Ask me about filters, ratings, comments, offline mode, or sign-in.');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    append('user', text);
    input.value='';
    setTimeout(() => {
      append('bot', answer(text));
    }, 250);
  });
  const clearBtn = document.getElementById('chat-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem(HISTORY_KEY);
      const log = document.getElementById('chat-log');
      log.innerHTML='';
      append('bot', 'History cleared. Ask me something new!');
    });
  }
});
