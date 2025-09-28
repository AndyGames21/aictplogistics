// Carousel
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const nextBtn = document.querySelector(".carousel-btn.right");
  const prevBtn = document.querySelector(".carousel-btn.left");
  let currentIndex = 0;

  function updateCarousel(index) {
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel(currentIndex);
  });

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel(currentIndex);
  });

  let autoSlide = setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel(currentIndex);
  }, 5000);

  // Swipe gestures
  let startX = 0;
  track.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    clearInterval(autoSlide);
  });
  track.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    if (endX - startX > 50) currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    else if (endX - startX < -50) currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel(currentIndex);
    autoSlide = setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateCarousel(currentIndex);
    }, 5000);
  });

  // Contact Form
  const contactForm = document.getElementById("contactForm");
  const formMessage = document.getElementById("formMessage");
  const submitButton = document.getElementById("submitContactButton");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault(); 

      if (submitButton.disabled) return;
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";

      const formData = {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        message: contactForm.message.value.trim(),
      };

      try {
        const res = await fetch("/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        formMessage.textContent = data.message;
        formMessage.style.color = data.success ? "green" : "red";

        if (data.success) {
          contactForm.reset();
          setTimeout(() => window.reload(), 2000);
        }
      } catch (err) {
        console.error("Contact form error:", err);
        formMessage.textContent = "Error sending message. Try again later.";
        formMessage.style.color = "red";
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    });
  }

