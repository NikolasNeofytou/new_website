document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const list = document.getElementById('papers-list');
  const info = document.getElementById('results-info');
  const yearSelect = document.getElementById('year');
  const clearBtn = document.getElementById('clear-filters');
  const sortSelect = document.getElementById('sort');
  const minRatingSelect = document.getElementById('difficulty');
  const onlyHigh = document.getElementById('show-high-rated');
  const hideNoComments = document.getElementById('hide-low-comments');
  const activeFiltersBox = document.getElementById('active-filters');
  let lastData = [];

  function getUser() {
    try { return JSON.parse(localStorage.getItem('currentUser')||'null'); } catch { return null; }
  }

  async function loadPapers(params = {}) {
    const query = new URLSearchParams();
    if (params.course) query.set('course', params.course.trim());
    if (params.semester) query.set('semester', params.semester);
    if (params.year) query.set('year', params.year);
    const url = '/api/past-papers' + (query.toString() ? `?${query.toString()}` : '');
  list.innerHTML = skeletonCards(6);
    try {
      const headers = {};
      const user = getUser();
      if (user) headers['X-Student-ID'] = user.studentId;
      const res = await fetch(url, { headers });
      const data = await res.json();
      // populate years if first time
      populateYears(data);
      lastData = data.slice();
      applyAndRender();
    } catch (e) {
      list.innerHTML = '<p class="text-danger">Failed to load past papers.</p>';
    }
  }

  function populateYears(data) {
    if (yearSelect && yearSelect.options.length === 1) { // only 'Any'
      const years = Array.from(new Set(data.map(p => p.year))).sort((a,b)=>b-a);
      years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
      });
    }
  }

  function sortData(items) {
    const mode = sortSelect.value;
    const arr = items.slice();
    if (mode === 'newest') arr.sort((a,b)=> (b.year - a.year) || a.courseCode.localeCompare(b.courseCode));
    else if (mode === 'oldest') arr.sort((a,b)=> (a.year - b.year) || a.courseCode.localeCompare(b.courseCode));
    else if (mode === 'rating') arr.sort((a,b)=> (b.averageRating - a.averageRating) || (b.ratingCount - a.ratingCount));
    return arr;
  }

  function applyFilters(items){
    let filtered = items.slice();
    const minR = parseInt(minRatingSelect?.value||'',10);
    if(!isNaN(minR)) filtered = filtered.filter(p=> (p.averageRating||0) >= minR);
    if(onlyHigh?.checked) filtered = filtered.filter(p=> (p.averageRating||0) >= 4);
  if(hideNoComments?.checked) filtered = filtered.filter(p=> (p.commentCount||0) > 0);
    return filtered;
  }

  function renderActiveFilters(){
    if(!activeFiltersBox) return;
    activeFiltersBox.innerHTML='';
    const chips=[];
    const course = document.getElementById('course').value.trim(); if(course) chips.push(['Course',course,()=>{document.getElementById('course').value=''; form.dispatchEvent(new Event('submit'));}]);
    const sem = document.getElementById('semester').value; if(sem) chips.push(['Semester',sem,()=>{document.getElementById('semester').value=''; form.dispatchEvent(new Event('submit'));}]);
    const year = document.getElementById('year').value; if(year) chips.push(['Year',year,()=>{document.getElementById('year').value=''; form.dispatchEvent(new Event('submit'));}]);
    const minR = minRatingSelect.value; if(minR) chips.push(['Min★',minR+'+',()=>{minRatingSelect.value=''; applyAndRender();}]);
    if(onlyHigh.checked) chips.push(['Only≥4★','Yes',()=>{onlyHigh.checked=false; applyAndRender();}]);
    if(hideNoComments.checked) chips.push(['HideNoComments','On',()=>{hideNoComments.checked=false; applyAndRender();}]);
    chips.forEach(([label,val,close])=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1';
      b.innerHTML=`<span>${label}: ${val}</span><span aria-hidden='true'>&times;</span>`;
      b.addEventListener('click',close);
      activeFiltersBox.appendChild(b);
    });
    if(!chips.length) activeFiltersBox.innerHTML='<span class="text-muted small">None</span>';
  }

  function applyAndRender(){
    const filtered = applyFilters(lastData);
    const sorted = sortData(filtered);
    render(sorted);
    renderActiveFilters();
  }

  function render(items) {
    info.textContent = `${items.length} result${items.length !== 1 ? 's' : ''} found.`;
  const live = document.getElementById('papers-results-live');
  if(live) live.textContent = info.textContent;
    if (!items.length) {
      list.innerHTML = '<p>No past papers match your search.</p>';
      return;
    }
    list.innerHTML = '';
    // already sorted outside
  items.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4';
      col.innerHTML = `
        <div class="card mb-3 h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${p.courseCode} - ${p.courseName}</h5>
            <p class="card-text small mb-1">Semester: ${p.semester}</p>
            <p class="card-text small mb-1">Session: ${p.examSession}</p>
            <p class="card-text small text-muted mb-2">Year: ${p.year} | Lang: ${p.language}</p>
            <div class="mb-2 small">${renderStarsInline(p.averageRating)} <span class="ms-1">(${p.ratingCount || 0})</span></div>
      <a class="btn btn-sm btn-primary mt-auto" href="past_paper_view.html?id=${p.id}">View & Rate</a>
          </div>
        </div>`;
      list.appendChild(col);
    });
  }

  function skeletonCards(n) {
    let html='';
    for (let i=0;i<n;i++) {
      html += `<div class="col-md-6 col-lg-4"><div class="card mb-3 h-100 p-3">
        <div class="skeleton mb-2" style="height:20px;width:70%"></div>
        <div class="skeleton mb-2" style="height:12px;width:50%"></div>
        <div class="skeleton mb-2" style="height:12px;width:40%"></div>
        <div class="skeleton mb-3" style="height:12px;width:60%"></div>
        <div class="skeleton" style="height:32px;width:100%"></div>
      </div></div>`;
    }
    return html;
  }

  function renderStarsInline(avg) {
    if (!avg) return '☆☆☆☆☆';
    const full = Math.round(avg);
    let s='';
    for (let i=1;i<=5;i++) s += i<=full ? '★' : '☆';
    return s + ` ${avg.toFixed(1)}`;
  }

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    loadPapers({
      course: document.getElementById('course').value,
      semester: document.getElementById('semester').value,
      year: document.getElementById('year').value
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.getElementById('course').value='';
      document.getElementById('semester').value='';
      document.getElementById('year').value='';
      sortSelect.value='newest';
      minRatingSelect.value='';
      onlyHigh.checked=false; hideNoComments.checked=false;
      loadPapers({});
    });
  }

  [sortSelect,minRatingSelect,onlyHigh,hideNoComments].forEach(el=>{
    if(!el) return;
    el.addEventListener('change', ()=>{ applyAndRender(); });
  });

  // initial load
  loadPapers();
});
