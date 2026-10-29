document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll(".choose-plan").forEach((link) => {
  link.addEventListener("click", () => {
    const plan = link.dataset.plan;
    const select = document.getElementById("plan-select");
    if (select && [...select.options].some((option) => option.value === plan)) select.value = plan;
  });
});

document.getElementById("coverage-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const zip = document.getElementById("zip").value.trim();
  const message = document.getElementById("coverage-message");
  if (!/^\d{5}$/.test(zip)) {
    message.textContent = "Please enter a valid 5-digit ZIP code.";
    return;
  }
  message.textContent = `Thanks! ZIP ${zip} was entered. This demo does not check live network availability.`;
});

document.getElementById("interest-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const plan = document.getElementById("plan-select").value;
  const email = document.getElementById("email").value.trim();
  document.getElementById("interest-message").textContent =
    `Demo only: your interest in ${plan} is ready to be connected to a real backend. No data was sent or saved.`;
  event.target.reset();
  document.getElementById("plan-select").value = plan;
  document.getElementById("email").value = email;
});
