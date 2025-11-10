function updateUserInfo() {
    const loginLi = document.getElementById('login-li');
    const profileLi = document.getElementById('profile-li');
    const logoutLi = document.getElementById('logout-li');
    const currentUser = localStorage.getItem('currentUser');
    
    if (loginLi) {
        loginLi.style.display = currentUser ? 'none' : 'block';
    }
    if (profileLi) {
        profileLi.style.display = currentUser ? 'block' : 'none';
    }
    if (logoutLi) {
        logoutLi.style.display = currentUser ? 'block' : 'none';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logout-btn');
    if (btn) {
        btn.addEventListener('click', logout);
    }
    updateUserInfo();
});
