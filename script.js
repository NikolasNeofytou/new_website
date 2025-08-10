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
            updateFavicon();
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

    // Dynamic favicon swap (light vs dark)
    function updateFavicon(){
        const isDark = document.body.classList.contains('dark');
        const svgLink = document.querySelector("link[rel='icon'][type='image/svg+xml']");
        if(svgLink){
            const stroke = encodeURIComponent(isDark? '#f5f5f7' : '#274c9b');
            const fill = encodeURIComponent(isDark? '#f5f5f7' : '#274c9b');
            svgLink.href = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='none' stroke='${stroke}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M16 3l11 4v8c0 7-4.5 10.5-11 14-6.5-3.5-11-7-11-14V7l11-4z M11 13l5 3 5-3 M16 16v5'/%3E%3Ccircle cx='16' cy='10' r='2' fill='${fill}'/%3E%3C/svg%3E`;
        }
        // swap png if desired
        const png32 = document.querySelector("link[rel='icon'][sizes='32x32']");
        if(png32){ png32.href = isDark? 'icons/icon-dark-32.png' : 'icons/icon-32.png'; }
        const apple = document.querySelector("link[rel='apple-touch-icon']");
        if(apple){ apple.href = isDark? 'icons/icon-dark-180.png' : 'icons/icon-180.png'; }
    }
    updateFavicon();
    // react to system scheme change if user hasn't explicitly chosen
    if(!storedTheme){
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', ()=>{ if(!localStorage.getItem('theme')) { if(mq.matches) document.body.classList.add('dark'); else document.body.classList.remove('dark'); updateFavicon(); } });
    }

    // Dynamic nav active highlighting
    (function highlightNav(){
        const path = window.location.pathname.replace(/\\/g,'/');
        const file = path.split('/').pop() || 'index.html';
        const mapAliases = {
            '': 'index.html',
            'past_paper_view.html': 'past_papers.html'
        };
        const target = mapAliases[file] || file;
        const links = document.querySelectorAll('nav .nav-link[href], nav .dropdown-item[href]');
        links.forEach(a=>{
            const href = a.getAttribute('href');
            if(!href) return;
            const norm = href.split('?')[0];
            if(norm === target || (target === 'index.html' && (norm === '#' || norm === 'index.html'))){
                a.classList.add('active');
                a.setAttribute('aria-current','page');
            } else {
                a.classList.remove('active');
                a.removeAttribute('aria-current');
            }
        });
    })();

    // Quick search (lightweight) for past papers codes/names
    const qsMount = document.getElementById('quick-search-container');
    if(qsMount){
        qsMount.innerHTML = `<div class="position-relative"><input id="quick-search" class="form-control form-control-sm rounded-pill ps-3" type="text" placeholder="Quick search…" aria-label="Quick search" style="min-width:160px;" autocomplete="off"><div id="quick-search-results" class="dropdown-menu shadow border-0 mt-1 w-100 overflow-auto" style="max-height:300px;"></div></div>`;
        const input = document.getElementById('quick-search');
        const menu = document.getElementById('quick-search-results');
        let papersCache = null; let hideTimeout=null;
        function closeMenu(){ menu.classList.remove('show'); }
        function openMenu(){ if(menu.children.length) menu.classList.add('show'); }
        async function ensureData(){ if(papersCache) return papersCache; try { const r = await fetch('/past_papers.json'); papersCache = await r.json(); return papersCache; } catch { papersCache = []; return papersCache; } }
        input.addEventListener('input', async () => {
            const q = input.value.trim().toLowerCase();
            if(!q){ menu.innerHTML=''; closeMenu(); return; }
            const data = await ensureData();
            const matches = data.filter(p=> p.courseCode.toLowerCase().includes(q) || p.courseName.toLowerCase().includes(q)).slice(0,8);
            if(!matches.length){ menu.innerHTML = `<div class='dropdown-item disabled small'>No matches</div>`; openMenu(); return; }
            menu.innerHTML = matches.map(m=> `<button type='button' class='dropdown-item small' data-id='${m.id}'>${m.courseCode} <span class='text-muted'>${m.courseName}</span></button>`).join('');
            openMenu();
        });
        menu.addEventListener('click', e=>{
            const btn = e.target.closest('[data-id]');
            if(!btn) return;
            const id = btn.getAttribute('data-id');
            window.location.href = 'past_paper_view.html?id=' + id;
        });
        input.addEventListener('focus', ()=> { if(menu.children.length) openMenu(); });
        input.addEventListener('blur', ()=> { hideTimeout = setTimeout(closeMenu, 120); });
        menu.addEventListener('mousedown', ()=> { if(hideTimeout) clearTimeout(hideTimeout); });
    }

    // Scroll reactive classes (navbar glass depth + hero shift)
    function onScroll(){
        if(window.scrollY > 40) document.body.classList.add('scrolled'); else document.body.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();

    // Subtle cursor parallax for hero layers
    const hero = document.getElementById('hero');
    const layers = hero ? hero.querySelectorAll('.hero-parallax .layer') : [];
    if(layers.length){
        let rafId=null; let targetX=0,targetY=0, curX=0, curY=0;
        function animate(){
            curX += (targetX - curX)*0.06; curY += (targetY - curY)*0.06;
            layers.forEach((l,i)=>{ const depth = (i+1)*6; l.style.transform = `translate3d(${curX/depth}%, ${curY/depth}%,0) rotate(${curX*0.2}deg)`; });
            rafId = requestAnimationFrame(animate);
        }
        hero.addEventListener('pointermove', e=>{
            const rect = hero.getBoundingClientRect();
            const x = (e.clientX - rect.left)/rect.width; // 0-1
            const y = (e.clientY - rect.top)/rect.height;
            targetX = (x - 0.5) * 20; // -10 to 10
            targetY = (y - 0.5) * 14; // -7 to 7
            if(!rafId) animate();
        });
        hero.addEventListener('pointerleave', ()=>{ targetX=0; targetY=0; });
    }

    // Service worker update flow: prompt user to refresh when new version available
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                // Listen for waiting SW
                function autoUpdate(sw){
                    if(!sw) return;
                    // Ask for version then auto trigger skipWaiting
                    sw.postMessage('GET_VERSION');
                    sw.postMessage('SKIP_WAITING');
                }

                if (reg.waiting) { autoUpdate(reg.waiting); }
                reg.addEventListener('updatefound', () => {
                    const newSW = reg.installing;
                    if (newSW) {
                        newSW.addEventListener('statechange', () => {
                            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                                autoUpdate(newSW);
                            }
                        });
                    }
                });
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    // Small toast to indicate refresh incoming
                    const note=document.createElement('div');
                    note.style.position='fixed'; note.style.bottom='1rem'; note.style.left='50%'; note.style.transform='translateX(-50%)';
                    note.style.background='rgba(20,20,30,.9)'; note.style.color='#fff'; note.style.padding='.6rem 1rem'; note.style.borderRadius='10px'; note.style.fontSize='.8rem'; note.textContent='Updating...';
                    document.body.appendChild(note);
                    setTimeout(()=> window.location.reload(), 400);
                });
            }
        } catch (e) { /* ignore */ }
    }
});
