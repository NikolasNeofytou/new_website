document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('announcement-list');
    try {
        const res = await fetch('/api/announcements');
        const items = await res.json();
        items.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `<div class="card h-100"><div class="card-body"><h5 class="card-title">${item.title}</h5><p class="card-text"><small>${item.date} - ${item.category}</small></p><a href="${item.link}" target="_blank" class="btn btn-sm btn-primary mt-2">Read more</a></div></div>`;
            list.appendChild(col);
        });
    } catch (err) {
        list.innerHTML = '<p>Failed to load announcements.</p>';
    }

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
});
