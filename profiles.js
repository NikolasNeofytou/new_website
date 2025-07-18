document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('profiles');
    const form = document.getElementById('profile-form');

    async function load() {
        list.innerHTML = '';
        try {
            const res = await fetch('/api/users');
            const users = await res.json();
            users.forEach(u => {
                const col = document.createElement('div');
                col.className = 'col-md-4';
                col.innerHTML = `<div class="card h-100"><img src="${u.photo}" class="card-img-top" alt="${u.name}"><div class="card-body"><h5 class="card-title">${u.name}</h5><p class="card-text">ID: ${u.univid}<br>Year: ${u.year}<br>Spec: ${u.spec}</p></div></div>`;
                list.appendChild(col);
            });
        } catch (err) {
            list.innerHTML = '<p>Failed to load profiles.</p>';
        }
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = {
            name: document.getElementById('name').value.trim(),
            univid: document.getElementById('univid').value.trim(),
            year: parseInt(document.getElementById('year').value, 10),
            spec: document.getElementById('spec').value.trim(),
            photo: document.getElementById('photo').value.trim()
        };
        try {
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            form.reset();
            load();
        } catch {
            alert('Failed to save profile');
        }
    });

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

    load();
});
