document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const metaDiv = document.getElementById('paper-meta');
  const frame = document.getElementById('pdfFrame');
  const directLink = document.getElementById('directLink');
  const starsDiv = document.getElementById('rating-stars');
  const ratingSummary = document.getElementById('rating-summary');
  const ratingBreakdown = document.getElementById('rating-breakdown');
  const commentsDiv = document.getElementById('comments');
  const commentForm = document.getElementById('comment-form');
  const commentInput = document.getElementById('comment-text');

  if (!id) {
    metaDiv.innerHTML = '<div class="alert alert-danger">Missing paper id.</div>';
    return;
  }

  function renderStars(currentValue, average) {
    starsDiv.innerHTML = '';
    for (let i=1;i<=5;i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const filled = i <= (currentValue || Math.round(average));
      btn.innerHTML = filled ? '★' : '☆';
      btn.className = filled ? (currentValue ? 'text-warning' : '') : 'dim';
      btn.title = `Rate ${i} star${i>1?'s':''}`;
      btn.setAttribute('data-value', i);
      btn.addEventListener('click', () => submitRating(i));
      starsDiv.appendChild(btn);
    }
    const user = getUser();
    if (user && currentValue) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-sm btn-outline-secondary ms-2';
      remove.textContent = 'Remove';
      remove.addEventListener('click', removeRating);
      starsDiv.appendChild(remove);
    }
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem('currentUser')||'null'); } catch { return null; }
  }

  async function load() {
    metaDiv.innerHTML = '<p>Loading...</p>';
    try {
      const headers = {};
      const user = getUser();
      if (user) headers['X-Student-ID'] = user.studentId;
      const res = await fetch(`/api/past-papers/${id}`, { headers });
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      metaDiv.innerHTML = `<h2>${data.courseCode} - ${data.courseName}</h2>
        <p class="text-muted mb-1">Semester ${data.semester} | ${data.examSession} | Year ${data.year} | Lang ${data.language}</p>`;
      frame.src = data.url;
      directLink.href = data.url;
      updateRatingUI(data.rating, data.userValue);
      renderComments(data.comments);
      if (!user) {
        const loginNote = document.createElement('div');
        loginNote.className = 'alert alert-info mt-3';
        loginNote.textContent = 'Sign in to rate and comment.';
        metaDiv.appendChild(loginNote);
      }
    } catch (e) {
      metaDiv.innerHTML = '<div class="alert alert-danger">Failed to load paper.</div>';
    }
  }

  function updateRatingUI(rating, userValue) {
    renderStars(userValue, rating.average);
    ratingSummary.textContent = `${rating.average} / 5 (${rating.count} vote${rating.count === 1 ? '' : 's'})`;
    ratingBreakdown.innerHTML = buildBreakdown(rating.breakdown, rating.count, userValue);
  }

  async function submitRating(value) {
    const user = getUser();
    if (!user) {
      if (confirm('You need to sign in to rate. Go to sign in page?')) {
        window.location.href = 'signup.html';
      }
      return;
    }
    try {
  const headers = { 'Content-Type': 'application/json', 'X-Student-ID': user.studentId };
  if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
  const res = await fetch(`/api/past-papers/${id}/rate`, { method: 'POST', headers, body: JSON.stringify({ value }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      updateRatingUI(data.rating, data.userValue);
    } catch (e) {
      alert('Rating failed: ' + e.message);
    }
  }

  async function removeRating() {
    const user = getUser();
    if (!user) return;
    try {
  const headers = { 'X-Student-ID': user.studentId };
  if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
  const res = await fetch(`/api/past-papers/${id}/rate`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      updateRatingUI(data.rating, undefined);
    } catch (e) {
      alert('Failed to remove rating: ' + e.message);
    }
  }

  function renderComments(comments) {
    commentsDiv.innerHTML = '';
    if (!comments.length) {
      commentsDiv.innerHTML = '<p class="text-muted">No comments yet.</p>';
      return;
    }
    const user = getUser();
    comments.slice().reverse().forEach(c => {
      const div = document.createElement('div');
      const date = new Date(c.ts).toLocaleString();
      div.className = 'mb-2 border-bottom pb-1';
      let delBtn = '';
      if (user && c.studentId === user.studentId) {
        delBtn = `<button class="btn btn-sm btn-link text-danger p-0 ms-2" data-del="${c.id}">delete</button>`;
      }
      let voteControls = '';
      if (user) {
        voteControls = `<span class="ms-2" data-votes="${c.id}"><button class="btn btn-sm btn-outline-success py-0 px-1" data-up="${c.id}">▲</button><span class="mx-1" data-score="${c.id}">${c.score||0}</span><button class="btn btn-sm btn-outline-danger py-0 px-1" data-down="${c.id}">▼</button><button class="btn btn-sm btn-link text-warning py-0 px-1" data-report="${c.id}">report</button></span>`;
      }
      if (c.hidden) {
        div.innerHTML = `<span class="small text-muted d-block">${date}${delBtn}${voteControls}</span><em class="text-muted">Comment hidden due to reports (${c.reports}). <button class="btn btn-link btn-sm p-0" data-reveal="${c.id}">show</button></em>`;
      } else {
        div.innerHTML = `<span class="small text-muted d-block">${date}${delBtn}${voteControls}</span>${escapeHtml(c.text)}`;
      }
      commentsDiv.appendChild(div);
    });
    commentsDiv.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => deleteComment(btn.getAttribute('data-del')));
    });
    commentsDiv.querySelectorAll('[data-reveal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-reveal');
        const comment = comments.find(c => c.id === id);
        if (comment) {
          // Replace hidden element with actual text
          const wrapper = btn.closest('div');
          wrapper.innerHTML = `<span class="small text-muted d-block">${new Date(comment.ts).toLocaleString()}</span>${escapeHtml(comment.text)}`;
        }
      });
    });
    commentsDiv.querySelectorAll('[data-up]').forEach(btn => btn.addEventListener('click', () => voteComment(btn.getAttribute('data-up'), 1)));
    commentsDiv.querySelectorAll('[data-down]').forEach(btn => btn.addEventListener('click', () => voteComment(btn.getAttribute('data-down'), -1)));
    commentsDiv.querySelectorAll('[data-report]').forEach(btn => btn.addEventListener('click', () => reportComment(btn.getAttribute('data-report'))));
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }

  commentForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;
    const user = getUser();
    if (!user) {
      if (confirm('You need to sign in to comment. Go to sign in page?')) window.location.href = 'signup.html';
      return;
    }
    try {
  const headers = { 'Content-Type': 'application/json', 'X-Student-ID': user.studentId };
  if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
  const res = await fetch(`/api/past-papers/${id}/comment`, { method: 'POST', headers, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      commentInput.value = '';
      renderComments(data.comments);
    } catch (e) {
      alert('Comment failed: ' + e.message);
    }
  });

  async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;
    const user = getUser();
    if (!user) return;
    try {
  const headers = { 'X-Student-ID': user.studentId };
  if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
  const res = await fetch(`/api/past-papers/${id}/comment/${commentId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      load();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  }

  async function voteComment(commentId, value) {
    const user = getUser();
    if (!user) return;
    try {
  const headers = { 'Content-Type': 'application/json', 'X-Student-ID': user.studentId };
  if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
  const res = await fetch(`/api/past-papers/${id}/comment/${commentId}/vote`, { method: 'POST', headers, body: JSON.stringify({ value }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      const scoreSpan = commentsDiv.querySelector(`[data-score="${commentId}"]`);
      if (scoreSpan) scoreSpan.textContent = data.score;
    } catch (e) {
      alert('Vote failed: ' + e.message);
    }
  }

  async function reportComment(commentId) {
    const user = getUser();
    if (!user) return;
    if (!confirm('Report this comment as inappropriate?')) return;
    try {
  const headers = { 'X-Student-ID': user.studentId };
  if(window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
  const res = await fetch(`/api/past-papers/${id}/comment/${commentId}/report`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||'Failed');
      alert('Reported. Thank you.');
    } catch (e) {
      alert('Report failed: ' + e.message);
    }
  }

  function buildBreakdown(breakdown, total, userValue) {
    const rows = [];
    for (let star=5; star>=1; star--) {
      const count = breakdown[star] || 0;
      const pct = total ? Math.round((count/total)*100) : 0;
      rows.push(`<div class="d-flex align-items-center mb-1"><span style="width:2rem;">${star}★</span><div class="progress flex-grow-1 me-2" style="height:8px;"><div class="progress-bar" role="progressbar" style="width:${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div></div><span class="small" style="width:3rem;">${count}</span></div>`);
    }
    return rows.join('');
  }

  load();
});
