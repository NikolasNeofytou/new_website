document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('announcement-list');
    if (list) {
        try {
            const res = await fetch('/api/announcements');
            const items = await res.json();
            items.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-md-6';
                col.innerHTML = `<div class="card mb-3"><div class="card-body"><h5 class="card-title">${item.title}</h5><p class="card-text"><small>${item.date} - ${item.category}</small></p><a href="${item.link}" target="_blank" class="btn btn-sm btn-primary mt-2">Read more</a></div></div>`;
                list.appendChild(col);
            });
        } catch (err) {
            list.innerHTML = '<p>Failed to load announcements.</p>';
        }
    }

    // THEME & CONTRAST PERSISTENCE
    const storedTheme = localStorage.getItem('theme'); // 'dark' | 'light'
    const storedContrast = localStorage.getItem('contrast'); // 'high' | null
        if (storedTheme === 'dark') document.body.classList.add('dark');
        if (storedContrast === 'high') document.body.classList.add('high-contrast');

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    const contrastToggle = document.getElementById('contrast-toggle');
    if (contrastToggle) {
        contrastToggle.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast');
            const high = document.body.classList.contains('high-contrast');
            localStorage.setItem('contrast', high ? 'high' : '');
        });
    }

    // Apply system dark preference on first visit if user hasn't chosen
    if(!storedTheme){
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if(prefersDark) { document.body.classList.add('dark'); }
    }

    // Scroll reactive classes (navbar glass depth + hero shift)
    function onScroll(){
        if(window.scrollY > 40) document.body.classList.add('scrolled'); else document.body.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
});
