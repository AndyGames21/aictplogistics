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
    updateMessage.textContent = "";
    updateMessage.style.color = "";

    const name = updateForm.name.value.trim();
    const email = updateForm.email.value.trim();
    const phone = updateForm.phone.value.trim();
    const password = updateForm.password.value.trim();
    const confirmPassword = updateForm.confirmPassword?.value.trim();

    // Validate: at least one field
    if (!name && !email && !phone && !password) {
      updateMessage.textContent = "Please fill in at least one field.";
      updateMessage.style.color = "red";
      updateButton.disabled = false;
      updateButton.textContent = "Update Profile";
      return;
    }

    // Validate password confirmation
    if (password && password !== confirmPassword) {
      updateMessage.textContent = "Passwords do not match.";
      updateMessage.style.color = "red";
      updateButton.disabled = false;
      updateButton.textContent = "Update Profile";
      return;
    }

    try {
      const res = await fetch('/profile/updateProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });

      const data = await res.json();

      updateMessage.textContent = data.message;
      updateMessage.style.color = data.success ? 'green' : 'red';

      updateButton.disabled = false;
      updateButton.textContent = "Update Profile";

      if (data.success) {
        updateForm.reset();
        setTimeout(() => location.reload(), 1000);
      }
    } catch (err) {
      console.error(err);
      updateMessage.textContent = "Error updating profile. Try again later.";
      updateMessage.style.color = "red";
      updateButton.disabled = false;
      updateButton.textContent = "Update Profile";
    }
  });

  // Hamburger toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
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
  }
});
