document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const msg = document.getElementById('login-message');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        msg.textContent = '';
        const univid = document.getElementById('univid').value.trim();
        const password = document.getElementById('password').value;
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ univid, password })
            });
            if (!res.ok) throw new Error('Login failed');
            const data = await res.json();
            msg.className = 'text-success';
            msg.textContent = `Welcome ${data.user.name}!`;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            if (window.updateUserInfo) window.updateUserInfo();
            form.reset();
            window.location.href = 'profile.html';
        } catch {
            msg.className = 'text-danger';
            msg.textContent = 'Invalid credentials';
        }
    });
});
