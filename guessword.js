const MAX_TRIES = 5;
const WORD_BANK = {
  ai: {
    5: ["agent", "embed", "model", "token", "train"],
    6: ["neural", "prompt", "tensor", "vector", "vision"],
    7: ["chatbot", "dataset", "encoder", "weights", "minimax"],
    8: ["artifact", "gradient", "instruct", "pipeline", "training"],
  },
  internet: {
    5: ["cache", "cloud", "fiber", "login", "route"],
    6: ["domain", "packet", "server", "socket", "stream"],
    7: ["browser", "gateway", "network", "webhook", "payload"],
    8: ["frontend", "internet", "platform", "protocol", "redirect"],
  },
  web3: {
    5: ["block", "chain", "nonce", "stake", "vault"],
    6: ["bridge", "ledger", "oracle", "wallet", "minter"],
    7: ["airdrop", "gasless", "rollups", "staking", "wallets"],
    8: ["airdrops", "ethereum", "exchange", "mnemonic", "solidity"],
  },
};

const THEMES = [
  { key: "ai", label: "AI" },
  { key: "internet", label: "Internet" },
  { key: "web3", label: "Web3" },
];
const LENGTHS = [5, 6, 7, 8];

const themeSelect = document.querySelector("#themeSelect");
const lengthSelect = document.querySelector("#lengthSelect");
const board = document.querySelector("#board");
const statusText = document.querySelector("#statusText");
const triesLeft = document.querySelector("#triesLeft");
const message = document.querySelector("#message");
const guessForm = document.querySelector("#guessForm");
const guessInput = document.querySelector("#guessInput");
const submitGuessButton = document.querySelector("#submitGuessButton");
const newGameButton = document.querySelector("#newGameButton");

const state = {
  theme: "ai",
  length: 7,
  solution: "",
  guesses: [],
  evaluations: [],
  finished: false,
};

function titleTheme(themeKey) {
  return THEMES.find((theme) => theme.key === themeKey)?.label ?? themeKey;
}

function populateControls() {
  THEMES.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.key;
    option.textContent = theme.label;
    themeSelect.appendChild(option);
  });

  LENGTHS.forEach((length) => {
    const option = document.createElement("option");
    option.value = String(length);
    option.textContent = String(length);
    lengthSelect.appendChild(option);
  });

  themeSelect.value = state.theme;
  lengthSelect.value = String(state.length);
}

function getWords(themeKey, length) {
  return WORD_BANK[themeKey][length] ?? [];
}

function chooseWord(themeKey, length) {
  const words = getWords(themeKey, length);
  return words[Math.floor(Math.random() * words.length)];
}

function buildEmptyEvaluation(length) {
  return Array.from({ length }, () => ({ letter: "", state: "empty" }));
}

function evaluateGuess(guess, solution) {
  const result = Array.from(guess).map((letter) => ({ letter, state: "miss" }));
  const remaining = Array.from(solution);

  for (let i = 0; i < guess.length; i += 1) {
    if (guess[i] === solution[i]) {
      result[i].state = "correct";
      remaining[i] = null;
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (result[i].state === "correct") {
      continue;
    }

    const index = remaining.indexOf(guess[i]);
    if (index !== -1) {
      result[i].state = "present";
      remaining[index] = null;
    }
  }

  return result;
}

function renderBoard() {
  board.innerHTML = "";

  for (let rowIndex = 0; rowIndex < MAX_TRIES; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "board-row";
    row.dataset.length = String(state.length);

    const evaluation = state.evaluations[rowIndex] ?? buildEmptyEvaluation(state.length);
    evaluation.forEach((entry) => {
      const tile = document.createElement("div");
      tile.className = `tile tile-${entry.state}`;
      tile.textContent = entry.letter || "";
      row.appendChild(tile);
    });

    board.appendChild(row);
  }
}

function updateStatus() {
  const remaining = MAX_TRIES - state.guesses.length;
  triesLeft.textContent = String(remaining);

  if (state.finished && state.guesses.at(-1) === state.solution) {
    statusText.textContent = "Solved";
    return;
  }

  if (state.finished) {
    statusText.textContent = "Round over";
    return;
  }

  statusText.textContent = `${titleTheme(state.theme)} • ${state.length} letters`;
}

function setMessage(text) {
  message.textContent = text;
}

function resetRound() {
  state.theme = themeSelect.value;
  state.length = Number(lengthSelect.value);
  state.solution = chooseWord(state.theme, state.length);
  state.guesses = [];
  state.evaluations = [];
  state.finished = false;
  guessInput.value = "";
  guessInput.maxLength = state.length;
  guessInput.placeholder = `${state.length}-letter word`;
  submitGuessButton.disabled = false;
  setMessage(`New ${titleTheme(state.theme)} round. Use any English word with ${state.length} letters. You have ${MAX_TRIES} tries.`);
  renderBoard();
  updateStatus();
}

function normalizeGuess(value) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function handleSolved() {
  state.finished = true;
  submitGuessButton.disabled = true;
  setMessage(`Correct. The word was ${state.solution.toUpperCase()}. Start a new round anytime.`);
}

function handleFailed() {
  state.finished = true;
  submitGuessButton.disabled = true;
  setMessage(`No tries left. The word was ${state.solution.toUpperCase()}.`);
}

function submitGuess(event) {
  event.preventDefault();

  if (state.finished) {
    return;
  }

  const guess = normalizeGuess(guessInput.value);
  if (guess.length !== state.length) {
    setMessage(`Use exactly ${state.length} letters.`);
    return;
  }

  const evaluation = evaluateGuess(guess, state.solution);
  state.guesses.push(guess);
  state.evaluations.push(evaluation);
  renderBoard();
  updateStatus();
  guessInput.value = "";

  if (guess === state.solution) {
    handleSolved();
    updateStatus();
    return;
  }

  if (state.guesses.length >= MAX_TRIES) {
    handleFailed();
    updateStatus();
    return;
  }

  setMessage(`Attempt ${state.guesses.length} submitted. Use the feedback and keep going.`);
}

guessForm.addEventListener("submit", submitGuess);
newGameButton.addEventListener("click", resetRound);
themeSelect.addEventListener("change", resetRound);
lengthSelect.addEventListener("change", resetRound);
guessInput.addEventListener("input", () => {
  guessInput.value = guessInput.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, state.length);
});

populateControls();
resetRound();
