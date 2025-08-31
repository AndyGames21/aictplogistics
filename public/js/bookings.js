document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");
  const formMessage = document.getElementById("formMessage");

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      destination: document.getElementById("destination").value.trim(),
      departure_date: document.getElementById("departureDate").value,
      return_date: document.getElementById("returnDate").value,
      travel_class: document.getElementById("class").value,
      adult_passengers: parseInt(document.getElementById("passengers").value, 10),
      child_passengers: parseInt(document.getElementById("children").value, 10),
      flight_time: document.getElementById("flightTime").value,
      additional_details: document.getElementById("details").value.trim(),
    };

    console.log("Submitting booking:", formData); // Debug line

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
        redirect("/bookings");
      }
    } catch (err) {
      console.error("Booking error:", err);
      formMessage.textContent = "Error submitting booking. Please try again.";
      formMessage.className = "form-message error";
    }
  });
});
