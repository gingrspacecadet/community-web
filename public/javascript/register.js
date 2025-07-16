// Handle register form submission
document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const username = document.getElementById('reg-username').value;
      const password = document.getElementById('reg-password').value;
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'register',
            username,
            password,
          }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          alert('Registration successful! You can now log in.');
          window.location.href = '/login.html';
        } else {
          alert(result.error || 'Registration failed.');
        }
      } catch (err) {
        alert('Network error. Please try again later.');
      }
    });
  }
});
