// --- VARIABLES GLOBALES ---
let playerScore = 0;
let wrongWords = new Set();
let foundSet = new Set();
let helpUsed = false;
let helpSeconds = 0;
let helpTimer;
let bodyText = ""; // le texte du jeu seulement — titre et section ### exclus
let showingReport = true;

// --- Normalisation (accents, apostrophes) ---
function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/'/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// --- PARAMÈTRES URL ---
const params = new URLSearchParams(window.location.search);
const storyFile = params.get("story") || "visiteurs.txt";

// --- CHARGEMENT DE L'HISTOIRE ---
fetch(storyFile)
  .then(r => r.text())
  .then(text => {
    const lines = text.split(/\r?\n/);
    const titleIdx = lines.findIndex(line => line.trim().length > 0);
    const titleLine = titleIdx >= 0 ? lines[titleIdx] : "Histoire sans titre";
    document.getElementById("storyTitle").textContent = titleLine;

    // Un résumé, s'il y en a un, se trouve entre deux lignes contenant
    // seulement "###" — voir LTEXT001.txt pour le format d'origine. Tout ce
    // qui précède le premier ### est le texte du jeu ; tout ce qui se trouve
    // entre les deux ### est le résumé.
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

    document.getElementById("textBox").innerHTML = bodyHTML || "(Texte introuvable)";

    if (summaryText) {
      showSummaryOverlay(summaryText);
    } else {
      document.getElementById("wordInput").focus();
    }
  })
  .catch(err => {
    document.getElementById("textBox").textContent = "Erreur de chargement.";
    console.error(err);
  });

// --- RÉSUMÉ ---
function showSummaryOverlay(text) {
  document.getElementById("summaryText").textContent = text;
  document.getElementById("summaryOverlay").style.display = "flex";
}

function dismissSummaryOverlay() {
  document.getElementById("summaryOverlay").style.display = "none";
  document.getElementById("wordInput").focus();
}

// --- ÉCOUTEURS ---
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

// --- SAISIE SOLO ---
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
    feedback.textContent = `"${guess}" a déjà été trouvé`;
  } else if (guess) {
    wrongWords.add(guess);
    feedback.textContent = `"${guess}" n'était pas dans le texte`;
  }

  input.focus();
  checkGameFinished();
}

// --- AIDE (révélation complète 5s) ---
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

// --- AIDE (premières lettres) ---
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

// --- ABANDON ---
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

// --- FIN DE JEU ---
function checkGameFinished() {
  const maskedSpans = document.querySelectorAll("#textBox span.masked");
  if (maskedSpans.length === 0) {
    document.getElementById("soloBox").style.display = "none";
    document.getElementById("endScreen").style.display = "block";
    showReport();
  }
}

// --- RAPPORT ---
function showReport() {
  const title = document.getElementById("storyTitle").textContent;

  const spans = document.querySelectorAll("#textBox span.masked, #textBox span.revealed");
  const totalWords = spans.length;
  const uniqueWords = new Set(Array.from(spans).map(s => normalizeWord(s.dataset.fullword || s.textContent))).size;

  const foundWords = foundSet.size;
  const wrongList = Array.from(wrongWords).join(", ") || "aucun";

  let report = `
    <p><strong>${title}</strong> contenait ${uniqueWords} mots différents, ${totalWords} mots au total.</p>
    <p>Vous avez trouvé ${foundWords === uniqueWords ? "tous les mots" : foundWords + " mots"}.</p>
    <p>Vous avez aussi essayé : ${wrongList}.</p>
  `;

  if (helpUsed) {
    report += `<p>Aide utilisée</p>`;
  }

  document.getElementById("textBox").innerHTML = report;

  document.getElementById("endScreen").innerHTML = `
    <div class="buttonRow">
      <button onclick="toggleReport()">Voir le texte</button>
      <button onclick="playAgain()">Nouvelle partie</button>
      <button onclick="goHome()">Retour à la page d'accueil</button>
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

    document.querySelector("#endScreen button").textContent = "Rapport et analyse";
    showingReport = false;
  } else {
    showReport();
    document.querySelector("#endScreen button").textContent = "Voir le texte";
    showingReport = true;
  }
}

// --- UTILITAIRES ---
function playAgain() {
  window.location.href = "index.html";
}

function goHome() {
  window.location.href = "https://marlodge.net";
}
