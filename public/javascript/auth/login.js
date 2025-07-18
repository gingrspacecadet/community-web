// Handle login form submission
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'login',
                        username,
                        password,
                    }),
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    alert('Login successful!');
                    window.location.href = '/pages/app.html';
                } else {
                    alert(result.error || 'Login failed.');
                }
            } catch (err) {
                alert('Network error. Please try again later.');
            }
        });
    }
});