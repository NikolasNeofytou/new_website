document.addEventListener('DOMContentLoaded', () => {
    const announcements = [
        { title: 'Welcome!', body: 'Check out the new forum design.' },
        { title: 'Exam schedule', body: 'The upcoming exam schedule has been posted.' }
    ];

    const list = document.getElementById('announcement-list');
    announcements.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.innerHTML = `<div class="card mb-3"><div class="card-body"><h5 class="card-title">${item.title}</h5><p class="card-text">${item.body}</p></div></div>`;
        list.appendChild(col);
    });

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
});
