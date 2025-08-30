document.addEventListener("DOMContentLoaded", () => {
  const localSelect = document.getElementById("localDestination");
  const otherLocal = document.getElementById("otherLocal");
  const internationalSelect = document.getElementById("internationalDestination");
  const otherInternational = document.getElementById("otherInternational");
  const bookingForm = document.getElementById("bookingForm");
  const routeInput = document.getElementById("route_id");

  function toggleOther(select, otherInput) {
    otherInput.style.display = select.value === "Other" ? "block" : "none";
  }

  function toggleGroups() {
    if (localSelect.value) {
      document.getElementById("internationalGroup").style.display = "none";
      document.getElementById("localGroup").style.display = "block";
    } else if (internationalSelect.value) {
      document.getElementById("localGroup").style.display = "none";
      document.getElementById("internationalGroup").style.display = "block";
    } else {
      document.getElementById("localGroup").style.display = "block";
      document.getElementById("internationalGroup").style.display = "block";
    }
  }

  localSelect.addEventListener("change", () => {
    toggleOther(localSelect, otherLocal);
    toggleGroups();
  });

  internationalSelect.addEventListener("change", () => {
    toggleOther(internationalSelect, otherInternational);
    toggleGroups();
  });

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let route = "";
    if (localSelect.value) {
      route = localSelect.value === "Other" ? otherLocal.value.trim() : localSelect.value;
    } else if (internationalSelect.value) {
      route = internationalSelect.value === "Other" ? otherInternational.value.trim() : internationalSelect.value;
    }

    const date = document.getElementById("date").value;

    if (!route || !date) {
      alert("Please select a route and date.");
      return;
    }

    // Set the hidden input so server gets it
    routeInput.value = route;

    bookingForm.submit();
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
