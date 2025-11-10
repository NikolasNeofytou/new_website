document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const token = localStorage.getItem('token');
  if (token) {
    // Verify token is still valid
    fetch('/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) {
        window.location.href = '/profile.html';
      } else {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      }
    })
    .catch(() => {
      // Continue with login
    });
  }

  const form = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const univid = form.univid.value.trim();
    const password = form.password ? form.password.value : form.univid.value;

    if (!univid) {
      errorMsg.textContent = 'Please enter your University ID.';
      return;
    }

    if (!password) {
      errorMsg.textContent = 'Please enter your password.';
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ univid, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        window.location.href = '/profile.html';
        return;
      }

      errorMsg.textContent = data.error || 'Login failed.';
    } catch (err) {
      console.error('Login error:', err);
      errorMsg.textContent = 'An unexpected error occurred.';
    }
  });
});
