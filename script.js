const lastChecked = document.querySelector("#last-checked");
const statusHeading = document.querySelector("#status-heading");
const statusDescription = document.querySelector("#status-description");

async function updateStatus() {
  try {
    const response = await fetch("https://mfb.bonto.run/api/status", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Status API returned ${response.status}`);
    }

    const data = await response.json();

    if (typeof data.botUp !== "boolean") {
      throw new Error("Invalid bot status response");
    }

    const online = data.botUp;

    // Tell CSS which theme to use.
    document.body.dataset.status = online ? "online" : "offline";

    // Change the page content.
    statusHeading.textContent = online
      ? "The bot is up and running."
      : "The bot is currently offline.";

    statusDescription.firstChild.textContent = online
      ? "Everything is working normally. Last checked "
      : "The bot is not running at the moment. Last checked ";

    // Update the last-checked time.
    lastChecked.textContent = new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());

  } catch (error) {
    console.error("Failed to fetch bot status:", error);

    // Treat an unreachable status API as an unknown/offline state.
    document.body.dataset.status = "offline";


    statusHeading.textContent = "The bot is currently offline.";
    statusDescription.firstChild.textContent =
      "The server could be under maintenance or experiencing issues. Last checked ";

    lastChecked.textContent = new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  }
}

// Check immediately when the page loads.
updateStatus();

// Automatically refresh every 15 seconds.
setInterval(updateStatus, 15000);