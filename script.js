document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('announcement-list');
    if (list) {
        try {
            const res = await fetch('/api/announcements');
            const items = await res.json();
            
            if (res.ok && items && items.length > 0) {
                items.forEach(item => {
                    const col = document.createElement('div');
                    col.className = 'col-md-6';
                    col.innerHTML = `<div class="card mb-3"><div class="card-body"><h5 class="card-title">${item.title}</h5><p class="card-text"><small>${item.date} - ${item.category}</small></p><a href="${item.link}" target="_blank" class="btn btn-sm btn-primary mt-2">Read more</a></div></div>`;
                    list.appendChild(col);
                });
            } else {
                list.innerHTML = '<div class="col-12"><p class="text-muted">No announcements available at the moment. Please check back later.</p></div>';
            }
        } catch (err) {
            console.error('Failed to load announcements:', err);
            list.innerHTML = '<div class="col-12"><p class="text-muted">Unable to load announcements. Please try again later.</p></div>';
        }
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    // Contact form handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusDiv = document.getElementById('contact-status');
            statusDiv.textContent = '';
            statusDiv.className = 'mb-3';

            const formData = {
                name: contactForm.name.value.trim(),
                email: contactForm.email.value.trim(),
                message: contactForm.message.value.trim()
            };

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await res.json();

                if (res.ok) {
                    statusDiv.textContent = data.message;
                    statusDiv.className = 'mb-3 text-success';
                    contactForm.reset();
                } else {
                    statusDiv.textContent = data.error || 'Failed to send message. Please try again.';
                    statusDiv.className = 'mb-3 text-danger';
                }
            } catch (err) {
                console.error('Contact form error:', err);
                statusDiv.textContent = 'An error occurred. Please try again later.';
                statusDiv.className = 'mb-3 text-danger';
            }
        });
    }
});
