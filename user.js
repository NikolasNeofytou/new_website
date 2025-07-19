document.addEventListener('DOMContentLoaded', () => {
    function update() {
        const info = document.getElementById('user-info');
        const login = document.getElementById('login-nav');
        const profile = document.getElementById('profile-nav');
        if (!info) return;
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            const user = JSON.parse(stored);
            info.innerHTML = `<img src="${user.photo}" alt="" style="width:32px;height:32px" class="rounded-circle me-2">${user.name}`;
            if (login) login.classList.add('d-none');
            if (profile) profile.classList.remove('d-none');
        } else {
            info.innerHTML = '';
            if (login) login.classList.remove('d-none');
            if (profile) profile.classList.add('d-none');
        }
    }
    window.updateUserInfo = update;
    update();
});
