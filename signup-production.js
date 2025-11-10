document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const errorMsg = document.getElementById('error-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const payload = {
      univid: form.univid.value,
      name: form.name.value,
      password: form.password ? form.password.value : form.univid.value, // Use password if available
      email: form.email ? form.email.value : undefined,
      year: form.year ? parseInt(form.year.value) : undefined,
      specialization: form.specialization ? form.specialization.value : undefined
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        window.location.href = '/';
        return;
      }

      if (res.status === 409) {
        errorMsg.textContent = data.error;
      } else {
        errorMsg.textContent = data.error || 'Registration failed.';
      }
    } catch (err) {
      console.error('Signup error:', err);
      errorMsg.textContent = 'An unexpected error occurred.';
    }
  });
});
