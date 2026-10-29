const checkButton = document.querySelector("#check-button")
const lastChecked = document.querySelector("#last-checked")

checkButton.addEventListener("click", () => {
  lastChecked.textContent = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date())
})
