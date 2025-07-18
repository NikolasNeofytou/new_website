document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('papers-list');
    try {
        const res = await fetch('/api/pastpapers');
        const items = await res.json();
        items.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            col.innerHTML = `<div class="card mb-3"><div class="card-body"><h5 class="card-title">${item.title}</h5><a href="${item.url}" target="_blank" class="btn btn-primary btn-sm mt-2">Open</a></div></div>`;
            list.appendChild(col);
        });
    } catch (err) {
        list.innerHTML = '<p>Failed to load past papers.</p>';
    }

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
});
