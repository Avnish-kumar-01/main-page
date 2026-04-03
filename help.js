const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    formStatus.textContent = "Your message has been sent successfully!";
    formStatus.style.color = "#a7f3d0";

    contactForm.reset();
  });
}