document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('currentUser'));
    if (data) {
        const emailEl = document.getElementById('profile-email');
        const idEl = document.getElementById('profile-id');
        if (emailEl) emailEl.textContent = `Email: ${data.email}`;
        if (idEl) idEl.textContent = `Student ID: ${data.studentId}`;
    }
    const loadBtn = document.getElementById('load-profile');
    const clearRatingsBtn = document.getElementById('clear-ratings');
    const clearCommentsBtn = document.getElementById('clear-comments');
    loadBtn?.addEventListener('click', loadProfile);
    clearRatingsBtn?.addEventListener('click', async () => {
        if (!confirm('Delete ALL your ratings? This cannot be undone.')) return;
        const sid = currentId(); if (!sid) return alert('Sign in first');
    const headers = { 'X-Student-ID': sid };
    if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
    const res = await fetch('/api/me/ratings', { method:'DELETE', headers });
        const js = await res.json();
        if (!res.ok) return alert(js.error || 'Failed');
        alert(`Removed ${js.removed} ratings.`);
        loadProfile();
    });
    clearCommentsBtn?.addEventListener('click', async () => {
        if (!confirm('Delete ALL your comments? This cannot be undone.')) return;
        const sid = currentId(); if (!sid) return alert('Sign in first');
    const headers = { 'X-Student-ID': sid };
    if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
    const res = await fetch('/api/me/comments', { method:'DELETE', headers });
        const js = await res.json();
        if (!res.ok) return alert(js.error || 'Failed');
        alert(`Removed ${js.removed} comments.`);
        loadProfile();
    });
    document.getElementById('export-profile')?.addEventListener('click', exportProfile);
    document.getElementById('comments-prev')?.addEventListener('click', ()=> changePage('comments', -1));
    document.getElementById('comments-next')?.addEventListener('click', ()=> changePage('comments', 1));
    document.getElementById('ratings-prev')?.addEventListener('click', ()=> changePage('ratings', -1));
    document.getElementById('ratings-next')?.addEventListener('click', ()=> changePage('ratings', 1));
});

function currentId() {
    const data = JSON.parse(localStorage.getItem('currentUser'));
    return data?.studentId;
}

async function loadProfile() {
    const sid = currentId();
    if (!sid) return alert('Sign in first');
    const headers = { 'X-Student-ID': sid };
    if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
    const res = await fetch('/api/me', { headers });
    const js = await res.json();
    if (!res.ok) return alert(js.error || 'Failed to load profile');
    document.getElementById('profile-summary').style.display='flex';
    document.getElementById('ratings-count').textContent = js.ratingsCount;
    document.getElementById('comments-count').textContent = js.commentsCount;
    window.__profileData = js;
    initPagination();
    renderRatings();
    renderComments();
}

const PAGE_SIZES = { ratings: 10, comments: 8 };
const state = { ratingsPage: 1, commentsPage: 1 };

function initPagination() { state.ratingsPage = 1; state.commentsPage = 1; updatePager('ratings'); updatePager('comments'); }
function totalPages(key){ const data = window.__profileData; const arr = key==='ratings'?data.ratings:data.comments; return Math.max(1, Math.ceil(arr.length / PAGE_SIZES[key])); }
function changePage(key, delta){ state[key+'Page'] += delta; const tp = totalPages(key); if(state[key+'Page']<1) state[key+'Page']=1; if(state[key+'Page']>tp) state[key+'Page']=tp; key==='ratings'?renderRatings():renderComments(); updatePager(key); }
function updatePager(key){ const pageSpan=document.getElementById(`${key}-page`); const prev=document.getElementById(`${key}-prev`); const next=document.getElementById(`${key}-next`); if(!pageSpan) return; const tp= totalPages(key); const cp= state[key+'Page']; pageSpan.textContent = `${cp} / ${tp}`; if(prev) prev.disabled = cp<=1; if(next) next.disabled = cp>=tp; }

function renderRatings(){ const box=document.getElementById('ratings-list'); const data=window.__profileData?.ratings||[]; if(!data.length){ box.innerHTML='<em>No ratings yet.</em>'; updatePager('ratings'); return;} const start=(state.ratingsPage-1)*PAGE_SIZES.ratings; const slice=data.slice(start,start+PAGE_SIZES.ratings); box.innerHTML = slice.map(r=>`<div class="mb-1"><strong>${r.value}★</strong> ${r.courseCode} <small class="text-muted">(${r.year} S${r.semester})</small></div>`).join(''); updatePager('ratings'); }
function renderComments(){ const box=document.getElementById('comments-list'); const data=window.__profileData?.comments||[]; if(!data.length){ box.innerHTML='<em>No comments yet.</em>'; updatePager('comments'); return;} const start=(state.commentsPage-1)*PAGE_SIZES.comments; const slice=data.slice(start,start+PAGE_SIZES.comments); box.innerHTML = slice.map(c=>`<div class="mb-2"><div class="fw-semibold">${c.courseCode}</div><div class="small">${escapeHtml(c.text.slice(0,120))}${c.text.length>120?'…':''}</div><div class="text-muted small">${new Date(c.ts).toLocaleDateString()} • score:${c.score} • reports:${c.reports}</div></div>`).join(''); updatePager('comments'); }

async function exportProfile(){ const sid=currentId(); if(!sid) return alert('Sign in first'); const headers={ 'X-Student-ID': sid }; if(window.CSRF_TOKEN) headers['X-CSRF-Token']=window.CSRF_TOKEN; const res= await fetch('/api/me/export',{ headers }); if(!res.ok){ const js= await res.json().catch(()=>({})); return alert(js.error||'Export failed'); } const blob= await res.blob(); const url= URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`shmmy_profile_${sid}.json`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },0); }

function escapeHtml(str){ return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
