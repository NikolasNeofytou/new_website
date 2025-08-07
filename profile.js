document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('currentUser'));
    if (data) {
        const emailEl = document.getElementById('profile-email');
        const idEl = document.getElementById('profile-id');
        if (emailEl) emailEl.textContent = `Email: ${data.email}`;
        if (idEl) idEl.textContent = `Student ID: ${data.studentId}`;
    }
});
