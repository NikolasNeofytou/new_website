document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    window.location.href = '/profile.html';
    return;
  }

  const form = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const univid = form.univid.value.trim();

    if (!univid) {
      errorMsg.textContent = 'Please enter your University ID.';
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ univid }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        window.location.href = '/profile.html';
        return;
      }

      const data = await res.json();
      errorMsg.textContent = data.error || 'Login failed.';
    } catch (err) {
      console.error('Login error:', err);
      errorMsg.textContent = 'An unexpected error occurred.';
    }
  });
});
