document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profile-form');
    const photoChoice = document.getElementById('photo-choice');
    const photoUpload = document.getElementById('photo-upload');

    const defaults = {
        default1: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23007bff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='white'>⚡</text></svg>",
        default2: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%2300aa55'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='white'>⌁</text></svg>",
        default3: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23ff8800'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='white'>Ω</text></svg>"
    };

    photoChoice.addEventListener('change', () => {
        photoUpload.classList.toggle('d-none', photoChoice.value !== 'upload');
    });

    // Profiles are stored server-side but no longer listed here

    form.addEventListener('submit', async e => {
        e.preventDefault();

        let photo;
        if (photoChoice.value === 'upload') {
            const file = photoUpload.files[0];
            if (file) {
                photo = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            } else {
                photo = defaults.default1;
            }
        } else {
            photo = defaults[photoChoice.value];
        }

        const data = {
            name: document.getElementById('name').value.trim(),
            univid: document.getElementById('univid').value.trim(),
            year: parseInt(document.getElementById('year').value, 10),
            spec: document.getElementById('spec').value,
            photo
        };

        try {
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            form.reset();
            photoUpload.classList.add('d-none');
        } catch {
            alert('Failed to save profile');
        }
    });

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

});
