function updateUserInfo() {
    const btn = document.getElementById('auth-btn');
    const currentUser = localStorage.getItem('currentUser');
    if (btn) {
        btn.textContent = currentUser ? 'Logout' : 'Sign In';
    }
}

function toggleAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        localStorage.removeItem('currentUser');
        updateUserInfo();
    } else {
        window.location.href = 'signup.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('auth-btn');
    if (btn) {
        btn.addEventListener('click', toggleAuth);
    }
    updateUserInfo();
});
