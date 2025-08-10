document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const list = document.getElementById('papers-list');
  const info = document.getElementById('results-info');
  const yearSelect = document.getElementById('year');
  const clearBtn = document.getElementById('clear-filters');
  const sortSelect = document.getElementById('sort');

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
      render(sortData(data));
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

  function render(items) {
    info.textContent = `${items.length} result${items.length !== 1 ? 's' : ''} found.`;
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
      loadPapers({});
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      // re-render using cached list by refetching with same filters (simpler)
      form.dispatchEvent(new Event('submit'));
    });
  }

  // initial load
  loadPapers();
});
