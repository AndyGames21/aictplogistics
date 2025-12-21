  document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");
  const formMessage = document.getElementById("formMessage");
  const submitButton = document.getElementById("submitBookingButton");

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (submitButton.disabled) return;
    submitButton.disabled = true;
    submitButton.textContent = "Requesting...";

    const formData = {
      origin: document.getElementById("origin").value.trim(),
      destination: document.getElementById("destination").value.trim(),
      departure_date: document.getElementById("departureDate").value,
      return_date: document.getElementById("returnDate").value,
      travel_class: document.getElementById("class").value,
      adult_passengers: parseInt(document.getElementById("passengers").value, 10),
      child_passengers: parseInt(document.getElementById("children").value, 10),
      flight_time: document.getElementById("flightTime").value,
      additional_details: document.getElementById("details").value.trim(),
    };

    console.log("Submitting booking:", formData);

    try {
      const res = await fetch("/bookings/book-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      formMessage.textContent = data.message || data.error;
      formMessage.className = `form-message ${data.success ? "success" : "error"}`;

      if (data.success) {
        bookingForm.reset();
        window.location.href = "/bookings";
      }
    } catch (err) {
      console.error("Booking error:", err);
      formMessage.textContent = "Error submitting booking. Please try again.";
      formMessage.className = "form-message error";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Book Now";
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
  }
});