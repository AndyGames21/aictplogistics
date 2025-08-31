document.addEventListener('DOMContentLoaded', () => {
  const updateForm = document.getElementById('updateProfileForm');
  const updateMessage = document.getElementById('updateMessage');

  if (!updateForm) return;

  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // VERY IMPORTANT: stops form from submitting normally

    const formData = {
      name: updateForm.name.value.trim(),
      phone: updateForm.phone.value.trim(),
      password: updateForm.password.value.trim()
    };

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
        updateForm.phone.value = '';
        updateForm.password.value = '';
      }
    } catch (err) {
      console.error(err); // log the actual error
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
