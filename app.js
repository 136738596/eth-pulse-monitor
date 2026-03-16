const REFRESH_INTERVAL_MS = 20 * 60 * 1000;
const HISTORY_LIMIT = 8;
const API_ENDPOINTS = [
  {
    name: "Coinbase API",
    url: "https://api.coinbase.com/v2/prices/ETH-USD/spot",
    parse: (data) => Number.parseFloat(data?.data?.amount),
  },
  {
    name: "Kraken API",
    url: "https://api.kraken.com/0/public/Ticker?pair=ETHUSD",
    parse: (data) => Number.parseFloat(data?.result?.XETHZUSD?.c?.[0]),
  },
];

const priceValue = document.querySelector("#priceValue");
const lastUpdated = document.querySelector("#lastUpdated");
const countdown = document.querySelector("#countdown");
const historyList = document.querySelector("#historyList");
const message = document.querySelector("#message");
const refreshButton = document.querySelector("#refreshButton");
const statusBadge = document.querySelector("#statusBadge");
const sourceName = document.querySelector("#sourceName");

const state = {
  history: [],
  nextRefreshAt: Date.now() + REFRESH_INTERVAL_MS,
  countdownTimerId: null,
  refreshTimerId: null,
};

function setStatus(kind, text) {
  statusBadge.textContent = text;
  statusBadge.className = `badge ${kind}`;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatClock(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function renderHistory() {
  historyList.innerHTML = "";

  if (state.history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No price checks yet.";
    historyList.appendChild(empty);
    return;
  }

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = `${formatClock(entry.timestamp)} via ${entry.source}`;

    const price = document.createElement("span");
    price.className = "history-price";
    price.textContent = `$${formatPrice(entry.price)}`;

    item.append(time, price);
    historyList.appendChild(item);
  });
}

function startCountdown() {
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
  }

  const tick = () => {
    countdown.textContent = formatRemaining(state.nextRefreshAt - Date.now());
  };

  tick();
  state.countdownTimerId = window.setInterval(tick, 1000);
}

function scheduleNextRefresh() {
  if (state.refreshTimerId) {
    clearTimeout(state.refreshTimerId);
  }

  state.nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
  startCountdown();
  state.refreshTimerId = window.setTimeout(() => {
    fetchEthPrice();
  }, REFRESH_INTERVAL_MS);
}

async function requestPrice() {
  let lastError = null;

  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const price = endpoint.parse(data);

      if (!Number.isFinite(price)) {
        throw new Error("Invalid price payload");
      }

      return {
        price,
        source: endpoint.name,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to fetch ETH price");
}

async function fetchEthPrice() {
  setStatus("badge-live", "Syncing");
  message.textContent = "Requesting the latest ETH quote.";
  refreshButton.disabled = true;

  try {
    const result = await requestPrice();
    const now = new Date();

    priceValue.textContent = formatPrice(result.price);
    lastUpdated.textContent = formatClock(now);
    sourceName.textContent = result.source;
    state.history.unshift({
      price: result.price,
      timestamp: now,
      source: result.source,
    });
    state.history = state.history.slice(0, HISTORY_LIMIT);
    renderHistory();
    message.textContent = "Monitoring is active. Next scheduled refresh in 20 minutes.";
    setStatus("badge-live", "Live");
    scheduleNextRefresh();
  } catch (error) {
    message.textContent = `Refresh failed: ${error.message}`;
    setStatus("badge-error", "Error");
    scheduleNextRefresh();
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", () => {
  fetchEthPrice();
});

renderHistory();
startCountdown();
fetchEthPrice();
