// --- GLOBALS ---
let playerScore = 0;
let wrongWords = new Set();
let foundSet = new Set();
let helpUsed = false;
let helpSeconds = 0;
let helpTimer;
let bodyText = ""; // the game text only — title and any ### summary section excluded
let showingReport = true;

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
    // "###" and comes after the story text — see LTEXT001.txt for the
    // original format. Everything before the first ### is the game text;
    // everything between the two ### lines is the summary.
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

// --- EVENT LISTENERS ---
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("soloBox").style.display = "block";

  document.getElementById("soloHelpButton").addEventListener("click", showHelp);
  document.getElementById("soloFirstLetterButton").addEventListener("click", showFirstLetters);
  document.getElementById("giveUpButton").addEventListener("click", giveUp);

  document.getElementById("wordInput").addEventListener("keydown", e => {
    if (e.key === "Enter") handleSoloInput();
  });

  document.getElementById("summaryDismissButton").addEventListener("click", dismissSummaryOverlay);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && document.getElementById("summaryOverlay").style.display !== "none") {
      dismissSummaryOverlay();
    }
  });
});

// --- SOLO INPUT ---
function handleSoloInput() {
  document.querySelectorAll("#textBox span.justRevealed").forEach(span => {
    span.classList.remove("justRevealed");
  });

  const input = document.getElementById("wordInput");
  const guess = normalizeWord(input.value.trim());
  input.value = "";

  let found = false;
  let alreadyFound = false;

  document.querySelectorAll("#textBox span.masked").forEach(span => {
    const normalized = normalizeWord(span.dataset.fullword);
    if (normalized === guess) {
      span.classList.remove("masked");
      span.classList.add("revealed", "justRevealed");
      span.textContent = span.dataset.fullword;
      playerScore++;
      foundSet.add(normalized);
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
    feedback.textContent = "";
  } else if (alreadyFound) {
    feedback.textContent = `"${guess}" has already been found`;
  } else if (guess) {
    wrongWords.add(guess);
    feedback.textContent = `"${guess}" was not in the text`;
  }

  input.focus();
  checkGameFinished();
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
function showFirstLetters() {
  helpUsed = true;
  const spans = document.querySelectorAll("#textBox span.masked");

  spans.forEach(span => {
    const word = span.dataset.fullword || span.textContent;
    if (word.length === 1) {
      // single-letter words revealed immediately
      span.classList.remove("masked");
      span.classList.add("revealed", "justRevealed");
      span.textContent = word;
      foundSet.add(normalizeWord(word));
    } else {
      const firstLetter = word.charAt(0);
      const blanks = "_".repeat(word.length - 1);
      span.textContent = firstLetter + blanks;
      span.classList.add("hinted"); // new class so you can see it
    }
  });

  document.getElementById("wordInput").focus();
}

// --- QUIT FEATURE ---
function giveUp() {
  const fullHTML = bodyText
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/[A-Za-zÀ-ÖØ-öø-ÿ']+/g, '<span class="revealed">$&</span>'))
    .join("<br>");

  document.getElementById("textBox").innerHTML = fullHTML;
  document.getElementById("soloBox").style.display = "none";
  document.getElementById("endScreen").style.display = "block";
  showReport();
}

// --- END GAME ---
function checkGameFinished() {
  const maskedSpans = document.querySelectorAll("#textBox span.masked");
  if (maskedSpans.length === 0) {
    document.getElementById("soloBox").style.display = "none";
    document.getElementById("endScreen").style.display = "block";
    showReport();
  }
}

// --- REPORT ---
function showReport() {
  const title = document.getElementById("storyTitle").textContent;

  const spans = document.querySelectorAll("#textBox span.masked, #textBox span.revealed");
  const totalWords = spans.length;
  const uniqueWords = new Set(Array.from(spans).map(s => normalizeWord(s.dataset.fullword || s.textContent))).size;

  const foundWords = foundSet.size;
  const wrongList = Array.from(wrongWords).join(", ") || "none";

  let report = `
    <p><strong>${title}</strong> contained ${uniqueWords} different words, ${totalWords} words altogether.</p>
    <p>You found ${foundWords === uniqueWords ? "all the words" : foundWords + " words"}.</p>
    <p>You also tried: ${wrongList}.</p>
  `;

  if (helpUsed) {
    report += `<p>Help used</p>`;
  }

  document.getElementById("textBox").innerHTML = report;

  document.getElementById("endScreen").innerHTML = `
    <div class="buttonRow">
      <button onclick="toggleReport()">See text again</button>
      <button onclick="playAgain()">New Game</button>
      <button onclick="goHome()">Back to home page</button>
    </div>
  `;
  showingReport = true;
}

function toggleReport() {
  if (showingReport) {
    const fullHTML = bodyText
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/[A-Za-zÀ-ÖØ-öø-ÿ']+/g, '<span class="revealed">$&</span>'))
      .join("<br>");
    document.getElementById("textBox").innerHTML = fullHTML;

    document.querySelector("#endScreen button").textContent = "Report and analysis";
    showingReport = false;
  } else {
    showReport();
    document.querySelector("#endScreen button").textContent = "See text again";
    showingReport = true;
  }
}

// --- UTILITIES ---
function playAgain() {
  window.location.href = "index.html";
}

function goHome() {
  // Direct to your main site
  window.location.href = "https://marlodge.net";
}
