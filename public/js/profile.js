document.addEventListener('DOMContentLoaded', () => {
  const updateButton = document.getElementById('updateProfileButton');
  const updateForm = document.getElementById('updateProfileForm');
  const updateMessage = document.getElementById('updateMessage');

  if (!updateForm) return;

  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

  if (updateButton.disabled) return;
  updateButton.disabled = true;
  updateButton.textContent = "Updating...";

    const name = updateForm.name.value.trim();
    const email = updateForm.email.value.trim();
    const phone = updateForm.phone.value.trim();
    const password = updateForm.password.value.trim();
    const confirmPassword = updateForm.confirmPassword?.value.trim(); // optional chaining in case field exists

    // Confirm password validation
    if (password && password !== confirmPassword) {
      updateMessage.textContent = "Passwords do not match.";
      updateMessage.style.color = "red";
      return;
    }

    const formData = { name, email, phone, password };

    try {
      const res = await fetch('/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      updateMessage.textContent = data.message;
      updateMessage.style.color = data.success ? 'green' : 'red';

      if (data.success) {
        updateForm.name.value = '';
        updateForm.email.value = '';
        updateForm.phone.value = '';
        updateForm.password.value = '';
        if (updateForm.confirmPassword) updateForm.confirmPassword.value = '';

        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      updateButton.disabled = false;
      updateButton.textContent = "Update Profile";
      updateMessage.textContent = 'Error updating profile. Try again later.';
      updateMessage.style.color = 'red';
    }
  });
});


// Hamburger toggle
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });
});

// Close nav on link click (for mobile)
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
  });
});
// Close nav on outside click
document.addEventListener('click', (e) => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
  }
});
