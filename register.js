document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const msg = document.getElementById('reg-message');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const data = {
      username: document.getElementById('username').value,
      universityId: document.getElementById('univid').value,
      password: document.getElementById('password').value
    };
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        msg.className = 'text-success';
        msg.textContent = 'Registration successful!';
        form.reset();
      } else {
        msg.className = 'text-danger';
        msg.textContent = result.error || 'Registration failed';
      }
    } catch {
      msg.className = 'text-danger';
      msg.textContent = 'Server error';
    }
  });
});
