document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const button = document.getElementById('loginBtn');
  const errorMsg = document.getElementById('error-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    if (button.disabled) return;
    button.disabled = true;
    button.innerText = 'Logging in...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Frontend validation for empty fields
    if (!email || !password) {
      errorMsg.textContent = 'Please fill in both email and password.';
      button.disabled = false;
      button.innerText = 'Login';
      return;
    }

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = data.redirect || '/dashboard';
      } else {
        errorMsg.textContent = data.message || 'Invalid email or password.';
        button.disabled = false;
        button.innerText = 'Login';
      }
    } catch (err) {
      console.error(err);
      errorMsg.textContent = 'Server error. Please try again later.';
      button.disabled = false;
      button.innerText = 'Login';
    }
  });
});
// Hamburger toggle