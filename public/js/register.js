    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('registerForm');
      const button = document.getElementById('registerBtn');
      const errorMsg = document.getElementById('error-message');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';

        if (button.disabled) return;
        button.disabled = true;
        button.innerText = 'Registering...';

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!name || !email || !phone || !password || !confirmPassword) {
          errorMsg.textContent = 'All fields are required.';
          button.disabled = false;
          button.innerText = 'Register';
          return;
        }

        if (password !== confirmPassword) {
          errorMsg.textContent = 'Passwords do not match.';
          button.disabled = false;
          button.innerText = 'Register';
          return;
        }

        try {
          const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
          });

          const data = await res.json();
          if (data.success) {
            window.location.href = data.redirect || '/login';
          } else {
            errorMsg.textContent = data.message || 'Registration failed.';
            button.disabled = false;
            button.innerText = 'Register';
          }
        } catch (err) {
          console.error(err);
          errorMsg.textContent = 'Server error. Please try again later.';
          button.disabled = false;
          button.innerText = 'Register';
        }
      });
    });