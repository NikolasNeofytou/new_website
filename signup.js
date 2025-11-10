document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const errorMsg = document.getElementById('error-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const payload = {
      univid: form.univid.value,
      name: form.name.value,
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(data));
        window.location.href = '/';
        return;
      }

      const data = await res.json();
      if (res.status === 409) {
        errorMsg.textContent = data.error;
      } else {
        errorMsg.textContent = data.error || 'Registration failed.';
      }
    } catch (err) {
      errorMsg.textContent = 'An unexpected error occurred.';
    }
  });
});
