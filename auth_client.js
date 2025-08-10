// Client helpers for new auth system
// Replaces legacy localStorage-only approach

let CSRF_TOKEN = null;

async function authFetch(url, options={}) {
  const headers = { ...(options.headers||{}) };
  if(CSRF_TOKEN && options.method && options.method !== 'GET') headers['X-CSRF-Token'] = CSRF_TOKEN;
  const res = await fetch(url, { credentials:'include', ...options, headers });
  if(res.status === 401) return null;
  return res.json();
}

async function getCurrentUser(){
  const data = await authFetch('/auth/me');
  return data?.user || null;
}

async function logout(){
  try { await fetch('/auth/logout', { method:'POST', credentials:'include', headers: CSRF_TOKEN? {'X-CSRF-Token': CSRF_TOKEN}:{} }); } catch {}
  location.href='index.html';
}

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('auth-btn');
  if(!btn) return;
  // Default action (works even if network/auth check fails)
  btn.onclick = () => { if(btn.textContent === 'Sign In') location.href = 'signup.html'; else logout(); };
  // Attempt to detect existing session; on failure keep default behavior
  getCurrentUser()
    .then(data => {
      if(data){
        btn.textContent = 'Logout';
      } else {
        btn.textContent = 'Sign In';
      }
    })
    .catch(()=> { btn.textContent = 'Sign In'; });
});

// Hook into signup/login form to capture csrf token
document.addEventListener('submit', async (e)=>{
  const form = e.target;
  if(form && form.id === 'auth-form'){
    // fetch intercept is already in signup.js; signup.js will redirect. We patch fetch there? Simpler: monkey patch fetch? Instead rely on signup.js storing token.
  }
});

// Expose setter so signup.js can set csrf after successful auth
window.__setCsrf = token => { CSRF_TOKEN = token; };
