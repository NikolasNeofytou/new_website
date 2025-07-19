function updateUserInfo() {
    const logoutLi = document.getElementById('logout-li');
    const currentUser = localStorage.getItem('currentUser');
    if (logoutLi) {
        logoutLi.style.display = currentUser ? 'block' : 'none';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    updateUserInfo();
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logout-btn');
    if (btn) {
        btn.addEventListener('click', logout);
    }
    updateUserInfo();
});
