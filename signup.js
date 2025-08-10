document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('auth-form');
    const emailEl = document.getElementById('email');
    const passEl = document.getElementById('password');
    const errorDiv = document.getElementById('auth-error');
    const tabs = document.querySelectorAll('#modeTabs button[data-mode]');
    let mode = 'login';
    if(!form) return;

    // Capture CSRF token from fragment after SSO (/#csrf=...) then clean it
    if(location.hash.startsWith('#csrf=')){
        const token = location.hash.slice(6);
        if(token){ window.__setCsrf && window.__setCsrf(token); window.CSRF_TOKEN = token; }
        history.replaceState(null,'',location.pathname + location.search);
        // Redirect to home since user is logged in
        setTimeout(()=>{ window.location.href = 'index.html'; }, 300);
    }

    // If arriving with ?redirect=/some/page store it for CAS button to use
    const params = new URLSearchParams(location.search);
    const redirectTarget = params.get('redirect') && params.get('redirect').startsWith('/') ? params.get('redirect') : '/index.html';
    const ssoBtn = document.getElementById('sso-btn');
    if(ssoBtn){
        ssoBtn.addEventListener('click', (e)=>{
            e.preventDefault();
            window.location.href = `/auth/sso/login?redirect=${encodeURIComponent(redirectTarget)}`;
        });
    }

    tabs.forEach(btn=>{
        btn.addEventListener('click', ()=>{
            tabs.forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.getAttribute('data-mode');
            document.getElementById('submit-btn').textContent = mode === 'signup' ? 'Create Account' : 'Sign In';
        });
    });

    form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        errorDiv.textContent='';
        const email = emailEl.value.trim().toLowerCase();
        const password = passEl.value;
        if(!/^[^@]+@ece\.ntua\.gr$/i.test(email)) { errorDiv.textContent='Use your @ece.ntua.gr email.'; return; }
        if(password.length < 8){ errorDiv.textContent='Password must be at least 8 characters.'; return; }
        const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login';
        try {
            const res = await fetch(endpoint, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
            const js = await res.json();
            if(!res.ok){ errorDiv.textContent = js.error || 'Request failed'; return; }
            if(js.csrf){ window.__setCsrf(js.csrf); window.CSRF_TOKEN = js.csrf; }
            window.location.href = 'index.html';
        } catch(err){
            errorDiv.textContent = 'Network error';
        }
    });
});
