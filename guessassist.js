const MAX_SUGGESTIONS = 8;
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
    7: ["browser", "gateway", "network", "payload", "webhook"],
    8: ["frontend", "internet", "platform", "protocol", "redirect"],
  },
  web3: {
    5: ["block", "chain", "nonce", "stake", "vault"],
    6: ["bridge", "ledger", "minter", "oracle", "wallet"],
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
const FEEDBACK_STATES = ["miss", "present", "correct"];

const themeSelect = document.querySelector("#themeSelect");
const lengthSelect = document.querySelector("#lengthSelect");
const feedbackRow = document.querySelector("#feedbackRow");
const guessInput = document.querySelector("#guessInput");
const clueForm = document.querySelector("#clueForm");
const resetButton = document.querySelector("#resetButton");
const undoButton = document.querySelector("#undoButton");
const message = document.querySelector("#message");
const historyList = document.querySelector("#historyList");
const candidateList = document.querySelector("#candidateList");
const topPick = document.querySelector("#topPick");
const candidateCount = document.querySelector("#candidateCount");
const attemptCount = document.querySelector("#attemptCount");

const state = {
  theme: "ai",
  length: 7,
  clues: [],
  feedback: [],
};

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

function getThemeWords() {
  return WORD_BANK[state.theme][state.length] ?? [];
}

function getWords() {
  const themed = getThemeWords();
  const common = (window.COMMON_WORDS && window.COMMON_WORDS[state.length]) || [];
  return [...new Set([...themed, ...common])];
}

function setMessage(text) {
  message.textContent = text;
}

function buildFeedbackRow() {
  feedbackRow.innerHTML = "";
  feedbackRow.dataset.length = String(state.length);
  state.feedback = Array.from({ length: state.length }, () => "miss");
  for (let index = 0; index < state.length; index += 1) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "feedback-tile tile-miss";
    tile.dataset.index = String(index);
    tile.textContent = "?";
    tile.addEventListener("click", () => cycleTile(index));
    feedbackRow.appendChild(tile);
  }
  guessInput.maxLength = state.length;
  guessInput.placeholder = `${state.length}-letter word`;
}

function cycleTile(index) {
  const current = state.feedback[index];
  const next = FEEDBACK_STATES[(FEEDBACK_STATES.indexOf(current) + 1) % FEEDBACK_STATES.length];
  state.feedback[index] = next;
  renderFeedbackLetters();
}

function renderFeedbackLetters() {
  const tiles = [...feedbackRow.children];
  const letters = guessInput.value.toUpperCase().padEnd(state.length, " ");
  tiles.forEach((tile, index) => {
    tile.className = `feedback-tile tile-${state.feedback[index]}`;
    tile.textContent = letters[index] && letters[index] !== " " ? letters[index] : "?";
  });
}

function normalizeGuess(value) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, state.length);
}

function scoreCandidate(candidate, clues) {
  const unique = new Set(candidate).size;
  const frequencyBonus = clues.length === 0 ? unique : 0;
  const themeBonus = getThemeWords().includes(candidate) ? 1.5 : 0;
  return frequencyBonus + unique / 10 + themeBonus;
}

function evaluateGuess(guess, solution) {
  const result = Array.from(guess).map((letter) => ({ letter, state: "miss" }));
  const remaining = Array.from(solution);

  for (let index = 0; index < guess.length; index += 1) {
    if (guess[index] === solution[index]) {
      result[index].state = "correct";
      remaining[index] = null;
    }
  }

  for (let index = 0; index < guess.length; index += 1) {
    if (result[index].state === "correct") {
      continue;
    }
    const foundIndex = remaining.indexOf(guess[index]);
    if (foundIndex !== -1) {
      result[index].state = "present";
      remaining[foundIndex] = null;
    }
  }

  return result.map((entry) => entry.state);
}

function candidateMatches(candidate, clue) {
  const feedback = evaluateGuess(clue.guess, candidate);
  return feedback.every((stateValue, index) => stateValue === clue.feedback[index]);
}

function getCandidates() {
  let candidates = getWords();
  state.clues.forEach((clue) => {
    candidates = candidates.filter((candidate) => candidateMatches(candidate, clue));
  });
  return candidates.sort((left, right) => scoreCandidate(right, state.clues) - scoreCandidate(left, state.clues));
}

function renderHistory() {
  historyList.innerHTML = "";
  state.clues.forEach((clue, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${clue.guess.toUpperCase()} -> ${clue.feedback.join(", ")}`;
    historyList.appendChild(item);
  });
  attemptCount.textContent = `${state.clues.length} clues`;
}

function renderCandidates() {
  const candidates = getCandidates();
  candidateCount.textContent = `${candidates.length} matches`;
  candidateList.innerHTML = "";

  if (candidates.length === 0) {
    topPick.innerHTML = "<strong>No match</strong><small>Your clues conflict even with the expanded English word pool. Reset or undo the last clue.</small>";
    return;
  }

  topPick.innerHTML = `<strong>${candidates[0].toUpperCase()}</strong><small>Best next guess from the current filtered list.</small>`;
  candidates.slice(0, MAX_SUGGESTIONS).forEach((candidate) => {
    const item = document.createElement("li");
    item.textContent = candidate.toUpperCase();
    candidateList.appendChild(item);
  });
}

function resetRound() {
  state.theme = themeSelect.value;
  state.length = Number(lengthSelect.value);
  state.clues = [];
  guessInput.value = "";
  buildFeedbackRow();
  renderHistory();
  renderCandidates();
  setMessage("Add any English guess and mark the feedback colors.");
}

function addClue(event) {
  event.preventDefault();
  const guess = normalizeGuess(guessInput.value);
  if (guess.length !== state.length) {
    setMessage(`Use exactly ${state.length} letters.`);
    return;
  }

  state.clues.push({ guess, feedback: [...state.feedback] });
  guessInput.value = "";
  buildFeedbackRow();
  renderHistory();
  renderCandidates();
  setMessage(`Clue added for ${guess.toUpperCase()}. Suggestions are now filtered from the expanded English word pool, with themed words ranked first.`);
}

function undoLast() {
  if (state.clues.length === 0) {
    setMessage("There is no clue to undo.");
    return;
  }
  state.clues.pop();
  renderHistory();
  renderCandidates();
  setMessage("Last clue removed.");
}

guessInput.addEventListener("input", () => {
  guessInput.value = guessInput.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, state.length);
  renderFeedbackLetters();
});
clueForm.addEventListener("submit", addClue);
undoButton.addEventListener("click", undoLast);
resetButton.addEventListener("click", resetRound);
themeSelect.addEventListener("change", resetRound);
lengthSelect.addEventListener("change", resetRound);

populateControls();
resetRound();
