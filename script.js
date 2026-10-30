const statusTop = document.querySelector("#status-top");
const lastChecked = document.querySelector("#last-checked");
const statusHeading = document.querySelector("#status-heading");
const statusDescription = document.querySelector("#status-description");
const requestButton = document.querySelector("#request-button");
const formMessage = document.querySelector("#form-message");
const tradeForm = document.querySelector("#trade-form");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function trade(username, amount) {
    try {
        // Create the trade job.
        const response = await fetch(
            'https://mfb.bonto.run/api/trade',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-store',
                body: JSON.stringify({ username, amount })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.jobId) {
            return {
                success: false,
                message: data.message || 'Failed to submit trade request.'
            };
        }

        const jobId = data.jobId;

        // Poll for the job's progress.
        while (true) {
            await sleep(2000);

            const statusResponse = await fetch(
                `https://mfb.bonto.run/api/trade/${encodeURIComponent(jobId)}`,
                { cache: 'no-store' }
            );

            const statusData = await statusResponse.json();

            if (!statusResponse.ok || !statusData.success) {
                return {
                    success: false,
                    message: statusData.message || 'Failed to retrieve trade status.'
                };
            }

            // Update the message shown on the website.
            showMessage(
                `${statusData.message} (${statusData.tradesDone}/${statusData.requestedTrades})`,
                'info'
            );

            if (statusData.status === 'completed') {
                return {
                    success: true,
                    message: statusData.message + " Given cards:\n" + statusData.cards.map(card => `${card.id} (${card.count}x)`).join("\n")
                };
            }

            if (statusData.status === 'failed') {
                return {
                    success: false,
                    message: statusData.message
                };
            }
        }

    } catch (error) {
        console.error('Failed to submit or check trade request:', error);

        return {
            success: false,
            message: 'Connection error. Please try again later.'
        };
    }
}

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = type;
}

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

    statusTop.textContent = online ? "Online" : "Offline";

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

tradeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (requestButton.disabled) return;

    const username = document.querySelector('#username').value.trim();
    const amount = Number(document.querySelector('#amount').value);

    formMessage.className = '';
    formMessage.textContent = '';

    requestButton.disabled = true;
    requestButton.value = 'Working...';

    showMessage('Submitting your trade request...', 'info');

    try {
        const result = await trade(username, amount);

        showMessage(
            result.message,
            result.success ? 'success' : 'error'
        );

    } finally {
        requestButton.disabled = false;
        requestButton.value = 'Go';
    }
});