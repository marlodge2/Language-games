// --- GLOBALS ---
let playerScore = 0;
let computerScore = 0;
let wrongWords = new Set();
let foundSet = new Set();
let helpUsed = false;
let helpSeconds = 0;
let helpTimer;
let bodyText = ""; // the game text only — title and any ### summary section excluded
let showingReport = true;
let currentTurn = "player"; // track whose turn it is
let wordFrequency = {}; // frequency table
let playerFoundSet = new Set();
let computerFoundSet = new Set();
let savedTextHTML = "";

// --- Normalization helper ---
function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/'/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// --- URL PARAMS ---
const params = new URLSearchParams(window.location.search);
const storyFile = params.get("story") || "visitors.txt";

// --- LOAD STORY ---
fetch(storyFile)
  .then(r => r.text())
  .then(text => {
    const lines = text.split(/\r?\n/);
    const titleIdx = lines.findIndex(line => line.trim().length > 0);
    const titleLine = titleIdx >= 0 ? lines[titleIdx] : "Untitled Story";
    document.getElementById("storyTitle").textContent = titleLine;

    // A summary, if present, sits between a pair of lines that are just
    // "###" and comes after the story text. Everything before the first
    // ### is the game text; everything between the two ### lines is the
    // summary, shown once as an intro overlay.
    const rest = lines.slice(titleIdx + 1);
    const firstHashIdx = rest.findIndex(line => line.trim() === "###");
    let bodyLines, summaryLines;
    if (firstHashIdx === -1) {
      bodyLines = rest;
      summaryLines = [];
    } else {
      bodyLines = rest.slice(0, firstHashIdx);
      const afterFirstHash = rest.slice(firstHashIdx + 1);
      const secondHashIdx = afterFirstHash.findIndex(line => line.trim() === "###");
      summaryLines = secondHashIdx === -1 ? afterFirstHash : afterFirstHash.slice(0, secondHashIdx);
    }

    bodyText = bodyLines.join("\n");
    const summaryText = summaryLines.filter(line => line.trim().length > 0).join(" ").trim();

    const bodyHTML = bodyLines
      .filter(line => line.trim().length > 0)
      .map(line =>
        line.replace(/[A-Za-zÀ-ÖØ-öø-ÿ']+/g, match => `<span class="masked" data-fullword="${match}">${match}</span>`)
      )
      .join("<br>");

    document.getElementById("textBox").innerHTML = bodyHTML || "(No story text found)";
    buildFrequencyTable();

    if (summaryText) {
      showSummaryOverlay(summaryText);
    } else {
      document.getElementById("wordInput").focus();
    }
  })
  .catch(err => {
    document.getElementById("textBox").textContent = "Error loading story.";
    console.error(err);
  });

// --- SUMMARY OVERLAY ---
function showSummaryOverlay(text) {
  document.getElementById("summaryText").textContent = text;
  document.getElementById("summaryOverlay").style.display = "flex";
}

function dismissSummaryOverlay() {
  document.getElementById("summaryOverlay").style.display = "none";
  document.getElementById("wordInput").focus();
}

// --- Build frequency table ---
function buildFrequencyTable() {
  wordFrequency = {};
  const spans = document.querySelectorAll("#textBox span.masked, #textBox span.revealed");
  spans.forEach(span => {
    const word = normalizeWord(span.dataset.fullword || span.textContent);
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
}

// --- EVENT LISTENERS ---
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("challengeBox").style.display = "block";

  document.getElementById("challengeHelpButton").onclick = showHelp;
  document.getElementById("giveUpButton").onclick = giveUp;

  // Always fire on Enter, let handlePlayerInput decide if it's player's turn
  document.getElementById("wordInput").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePlayerInput();
    }
  });

  document.getElementById("summaryDismissButton").addEventListener("click", dismissSummaryOverlay);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && document.getElementById("summaryOverlay").style.display !== "none") {
      dismissSummaryOverlay();
    }
  });
});

// --- PLAYER INPUT ---
function handlePlayerInput() {
  if (currentTurn !== "player") return;

  document.querySelectorAll("#textBox span.justRevealed").forEach(span => {
    span.classList.remove("justRevealed");
  });

  const input = document.getElementById("wordInput");
  const guess = normalizeWord(input.value.trim());
  input.value = "";

  let found = false;
  let alreadyFound = false;
  let playerRevealCount = 0;
  let displayWord = guess;

  document.querySelectorAll("#textBox span.masked").forEach(span => {
    const normalized = normalizeWord(span.dataset.fullword);
    if (normalized === guess) {
      span.classList.remove("masked");
      span.classList.add("revealed", "justRevealed");
      span.textContent = span.dataset.fullword;
      displayWord = span.dataset.fullword;
      playerScore++;
      playerRevealCount++;
      foundSet.add(normalized);
      playerFoundSet.add(normalized);
      found = true;
    }
  });

  if (!found) {
    document.querySelectorAll("#textBox span.revealed").forEach(span => {
      const normalized = normalizeWord(span.dataset.fullword || span.textContent);
      if (normalized === guess) {
        alreadyFound = true;
      }
    });
  }

  const feedback = document.getElementById("feedback");
  if (found) {
    feedback.textContent = `You found "${displayWord}" x ${playerRevealCount}`;
  } else if (alreadyFound) {
    feedback.textContent = `"${guess}" has already been found`;
    input.focus();
    return; // keep player's turn
  } else if (guess) {
    wrongWords.add(guess);
    feedback.textContent = `"${guess}" was not in the text`;
  }

  document.getElementById("playerScore").textContent = playerScore;
  input.focus();
  checkGameFinished();

  // Switch to computer turn
  currentTurn = "computer";
  setTimeout(computerTurn, 1000);
}

// --- COMPUTER TURN (frequency-biased typing simulation) ---
function computerTurn() {
  const maskedSpans = document.querySelectorAll("#textBox span.masked");
  if (maskedSpans.length === 0) return;

  // Build frequency map of remaining masked words
  const maskedWords = {};
  maskedSpans.forEach(span => {
    const w = normalizeWord(span.dataset.fullword);
    maskedWords[w] = (maskedWords[w] || 0) + 1;
  });

  // Find lowest frequency among remaining masked words
  const minFreq = Math.min(...Object.values(maskedWords));
  const candidates = Object.keys(maskedWords).filter(w => maskedWords[w] === minFreq);

  // Pick one candidate at random
  const chosenWord = candidates[Math.floor(Math.random() * candidates.length)];
  if (!chosenWord) {
    currentTurn = "player";
    return;
  }

  // Simulate typing
  const computerInput = document.getElementById("computerInput");
  computerInput.value = "";
  let i = 0;

  const typeInterval = setInterval(() => {
    computerInput.value += chosenWord.charAt(i);
    i++;
    if (i >= chosenWord.length) {
      clearInterval(typeInterval);

      // Reveal all occurrences of chosen word
      let revealedCount = 0;
      document.querySelectorAll("#textBox span.masked").forEach(span => {
        const normalized = normalizeWord(span.dataset.fullword);
        if (normalized === chosenWord) {
          span.classList.remove("masked");
          span.classList.add("revealed", "justRevealed");
          span.textContent = span.dataset.fullword;
          revealedCount++;
          foundSet.add(normalized);
          computerFoundSet.add(chosenWord);
        }
      });

      computerScore += revealedCount;
      document.getElementById("computerFeedback").textContent = `Computer found "${chosenWord}" x ${revealedCount}`;
      document.getElementById("computerScore").textContent = computerScore;

      checkGameFinished();
      currentTurn = "player";
      document.getElementById("wordInput").focus();
    }
  }, 500); // typing speed per letter
}
// --- HELP FEATURE (full reveal for 5s) ---
function showHelp() {
  helpUsed = true;
  helpSeconds += 5;

  const currentHTML = document.getElementById("textBox").innerHTML;
  const fullHTML = bodyText
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/[A-Za-zÀ-ÖØ-öø-ÿ']+/g, '<span class="revealed">$&</span>'))
    .join("<br>");

  document.getElementById("textBox").innerHTML = fullHTML;

  clearTimeout(helpTimer);
  helpTimer = setTimeout(() => {
    document.getElementById("textBox").innerHTML = currentHTML;
    document.getElementById("wordInput").focus();
  }, 5000);
}

// --- HELP FEATURE (first letters) ---
// Not used in Challenge mode, but kept for future Competition mode
function showFirstLetters() {
  helpUsed = true;
  const spans = document.querySelectorAll("#textBox span.masked");

  spans.forEach(span => {
    const word = span.dataset.fullword || span.textContent;
    if (word.length === 1) {
      span.classList.remove("masked");
      span.classList.add("revealed", "justRevealed");
      span.textContent = word;
      foundSet.add(normalizeWord(word));
    } else {
      const firstLetter = word.charAt(0);
      const blanks = "_".repeat(word.length - 1);
      span.textContent = firstLetter + blanks;
      span.classList.add("hinted");
    }
  });

  document.getElementById("wordInput").focus();
}

// --- QUIT FEATURE ---
function giveUp() {
  document.querySelectorAll("#textBox span.masked").forEach(span => {
    span.classList.remove("masked");
    span.classList.add("revealed");
    span.textContent = span.dataset.fullword;
  });
  endGame();
}

// --- END GAME ---
function checkGameFinished() {
  const maskedSpans = document.querySelectorAll("#textBox span.masked");
  if (maskedSpans.length === 0) {
    endGame();
  }
}

function endGame() {
  document.getElementById("wordInput").style.display = "none";
  document.getElementById("computerInput").style.display = "none";
  document.getElementById("feedbackRow").style.display = "none";
  const quitBtn = document.getElementById("giveUpButton");
  quitBtn.textContent = "Play again";
  quitBtn.onclick = playAgain;
  document.getElementById("homeButton").style.display = "inline-block";
  const helpBtn = document.getElementById("challengeHelpButton");
  helpBtn.textContent = "Report and analysis";
  helpBtn.onclick = showReport;
}

// --- REPORT ---
function showReport() {
  const title = document.getElementById("storyTitle").textContent;
  const totalDifferent = Object.keys(wordFrequency).length;
  const totalWords = Object.values(wordFrequency).reduce((a, b) => a + b, 0);
  const wrongList = wrongWords.size > 0 ? [...wrongWords].join(", ") : "none";

  savedTextHTML = document.getElementById("textBox").innerHTML;

  document.getElementById("textBox").innerHTML = `
    <p><strong>${title}</strong> contained ${totalDifferent} different words, amounting to ${totalWords} words altogether.</p>
    <p>You found ${playerFoundSet.size} different words scoring ${playerScore} points.</p>
    <p>The computer found ${computerFoundSet.size} different words scoring ${computerScore} points.</p>
    <p>You also tried: ${wrongList}.</p>
  `;

  const helpBtn = document.getElementById("challengeHelpButton");
  helpBtn.textContent = "See text again";
  helpBtn.onclick = seeTextAgain;
  showingReport = true;
}

// --- SEE TEXT AGAIN ---
function seeTextAgain() {
  document.getElementById("textBox").innerHTML = savedTextHTML;
  const helpBtn = document.getElementById("challengeHelpButton");
  helpBtn.textContent = "Report and analysis";
  helpBtn.onclick = showReport;
}

// --- UTILITIES ---
function playAgain() {
  window.location.href = "index.html";
}

function goHome() {
  window.location.href = "https://marlodge.net";
}