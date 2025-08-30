document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");
  const formMessage = document.getElementById("formMessage");

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      destination: document.getElementById("destination").value.trim(),
      departure_date: document.getElementById("departureDate").value,
      return_date: document.getElementById("returnDate").value,
      flight_time: document.getElementById("flightTime").value,
      details: document.getElementById("details").value.trim(),
    };

    try {
      const res = await fetch("/book-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      formMessage.textContent = data.message || data.error;
      formMessage.className = `form-message ${data.success ? "success" : "error"}`;

      if (data.success) {
        bookingForm.reset();
      }
    } catch (err) {
      console.error("Booking error:", err);
      formMessage.textContent = "Error submitting booking. Please try again.";
      formMessage.className = "form-message error";
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("active");
      document.body.classList.toggle("menu-open");
    });
  }});
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
