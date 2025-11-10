document.addEventListener('DOMContentLoaded', () => {
  const currentUserStr = localStorage.getItem('currentUser');
  const profileContent = document.getElementById('profile-content');
  const profileWelcome = document.getElementById('profile-welcome');

  if (!currentUserStr) {
    profileContent.innerHTML = `
      <p class="text-danger">You are not logged in.</p>
      <p>Please <a href="login.html">login</a> or <a href="signup.html">sign up</a> to view your profile.</p>
    `;
    return;
  }

  try {
    const user = JSON.parse(currentUserStr);
    
    if (profileWelcome) {
      profileWelcome.textContent = `Welcome, ${user.name || 'User'}!`;
    }

    profileContent.innerHTML = `
      <div class="mb-3">
        <strong>Name:</strong> ${user.name || 'Not provided'}
      </div>
      <div class="mb-3">
        <strong>University ID:</strong> ${user.univid || 'Not provided'}
      </div>
      <div class="alert alert-info mt-4">
        <strong>Note:</strong> This is a demo profile page. In a production environment, 
        additional features like profile editing, course enrollment, and academic records would be available.
      </div>
    `;
  } catch (err) {
    console.error('Error parsing user data:', err);
    profileContent.innerHTML = `
      <p class="text-danger">Error loading profile data.</p>
      <p>Please try <a href="login.html">logging in</a> again.</p>
    `;
  }
});
