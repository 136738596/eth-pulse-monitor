const REFRESH_INTERVAL_MS = 20 * 60 * 1000;
const HISTORY_LIMIT = 8;
const STORAGE_KEY = "eth-pulse-source";
const BUILT_IN_SOURCES = [
  {
    key: "coinbase",
    name: "Coinbase",
    url: "https://api.coinbase.com/v2/prices/ETH-USD/spot",
    path: "data.amount",
  },
  {
    key: "binance",
    name: "Binance",
    url: "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT",
    path: "price",
  },
  {
    key: "bybit",
    name: "Bybit",
    url: "https://api.bybit.com/v5/market/tickers?category=spot&symbol=ETHUSDT",
    path: "result.list[0].lastPrice",
  },
  {
    key: "gate",
    name: "Gate.io",
    url: "https://api.gateio.ws/api/v4/spot/tickers?currency_pair=ETH_USDT",
    path: "[0].last",
  },
  {
    key: "kraken",
    name: "Kraken",
    url: "https://api.kraken.com/0/public/Ticker?pair=ETHUSD",
    path: "result.XETHZUSD.c[0]",
  },
  {
    key: "bitget",
    name: "Bitget",
    url: "https://api.bitget.com/api/v2/spot/market/tickers?symbol=ETHUSDT",
    path: "data[0].lastPr",
  },
  {
    key: "mexc",
    name: "MEXC",
    url: "https://api.mexc.com/api/v3/ticker/price?symbol=ETHUSDT",
    path: "price",
  },
  {
    key: "lbank",
    name: "LBank",
    url: "https://api.lbkex.com/v2/ticker/24hr.do?symbol=eth_usdt",
    path: "data[0].ticker.latest",
  },
  {
    key: "htx",
    name: "HTX",
    url: "https://api.huobi.pro/market/detail/merged?symbol=ethusdt",
    path: "tick.close",
  },
  {
    key: "upbit",
    name: "Upbit",
    url: "https://api.upbit.com/v1/ticker?markets=USDT-ETH",
    path: "[0].trade_price",
  },
];

const priceValue = document.querySelector("#priceValue");
const lastUpdated = document.querySelector("#lastUpdated");
const countdown = document.querySelector("#countdown");
const historyList = document.querySelector("#historyList");
const message = document.querySelector("#message");
const refreshButton = document.querySelector("#refreshButton");
const statusBadge = document.querySelector("#statusBadge");
const sourceSelect = document.querySelector("#sourceSelect");

const state = {
  history: [],
  nextRefreshAt: Date.now() + REFRESH_INTERVAL_MS,
  countdownTimerId: null,
  refreshTimerId: null,
  activeSource: null,
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

function tokenizePath(path) {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function readPathValue(payload, path) {
  return tokenizePath(path).reduce((value, token) => {
    if (value == null) {
      return undefined;
    }

    return value[token];
  }, payload);
}

function getSourceByKey(key) {
  return BUILT_IN_SOURCES.find((source) => source.key === key) ?? BUILT_IN_SOURCES[0];
}

function saveActiveSource() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      key: state.activeSource.key,
      name: state.activeSource.name,
      url: state.activeSource.url,
      path: state.activeSource.path,
    }),
  );
}

function syncFormFromSource(source) {
  sourceSelect.value = source.key;
}

function setActiveSource(source) {
  state.activeSource = {
    key: source.key,
    name: source.name,
    url: source.url,
    path: source.path,
  };
  syncFormFromSource(state.activeSource);
  saveActiveSource();
}

function loadSavedSource() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return getSourceByKey("coinbase");
  }

  try {
    const saved = JSON.parse(raw);
    return {
      key: saved.key || "custom",
      name: saved.name || "Custom source",
      url: saved.url || getSourceByKey("coinbase").url,
      path: saved.path || getSourceByKey("coinbase").path,
    };
  } catch {
    return getSourceByKey("coinbase");
  }
}

function populateSourceOptions() {
  BUILT_IN_SOURCES.forEach((source) => {
    const option = document.createElement("option");
    option.value = source.key;
    option.textContent = source.name;
    sourceSelect.appendChild(option);
  });
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
  const response = await fetch(state.activeSource.url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawPrice = readPathValue(data, state.activeSource.path);
  const price = Number.parseFloat(rawPrice);

  if (!Number.isFinite(price)) {
    throw new Error(`Invalid price payload at path "${state.activeSource.path}"`);
  }

  return {
    price,
    source: state.activeSource.name,
  };
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

sourceSelect.addEventListener("change", () => {
  const selected = getSourceByKey(sourceSelect.value);
  setActiveSource(selected);
  state.history = [];
  renderHistory();
  message.textContent = `Source updated to ${selected.name}. Refreshing now.`;
  fetchEthPrice();
});

populateSourceOptions();
setActiveSource(loadSavedSource());
renderHistory();
startCountdown();
fetchEthPrice();
