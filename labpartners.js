document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('posts');
    const form = document.getElementById('partner-form');

    async function load() {
        list.innerHTML = '';
        try {
            const res = await fetch('/api/labpartners');
            const items = await res.json();
            items.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-md-6';
                col.innerHTML = `<div class="card h-100"><div class="card-body"><h5 class="card-title">${item.course}</h5><p class="card-text">${item.type === 'team' ? 'Team of ' + item.teamSize + ' looking for member' : 'Looking to join team of ' + item.teamSize}</p><p class="card-text"><small>${item.contact}</small></p></div></div>`;
                list.appendChild(col);
            });
        } catch (err) {
            list.innerHTML = '<p>Failed to load posts.</p>';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            course: document.getElementById('course').value.trim(),
            teamSize: parseInt(document.getElementById('teamSize').value, 10),
            type: document.getElementById('type').value,
            contact: document.getElementById('contact').value.trim()
        };
        try {
            await fetch('/api/labpartners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            form.reset();
            load();
        } catch {
            alert('Failed to submit post');
        }
    });

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    load();
});
