function generateStudentId() {
    return 'ID' + Math.floor(Math.random() * 1e6);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const emailInput = document.getElementById('email');
    const errorDiv = document.getElementById('signup-error');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (!email.endsWith('@ece.ntua.gr')) {
                errorDiv.textContent = 'Please use your @ece.ntua.gr email.';
                return;
            }
            const studentId = generateStudentId();
            localStorage.setItem('currentUser', JSON.stringify({ email, studentId }));
            window.location.href = 'index.html';
        });
    }
});
