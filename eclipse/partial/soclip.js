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

// --- Word category lists (from museum/funcword.html) ---
// Stored pre-normalized (lowercase, apostrophes stripped) so they compare
// directly against normalizeWord(word) \u2014 exactly as guesses are matched.
function makeWordSet(raw) {
  return new Set(raw.trim().split(/\s+/).map(normalizeWord));
}

const DETERMINERS = makeWordSet(`
  A ALL AN ANOTHER ANY ANYBODY ANYTHING BOTH EACH EITHER ENOUGH EVERY
  EVERYBODY EVERYONE EVERYTHING FEW FEWER HE HER HERS HERSELF HIM HIMSELF
  HIS I IT ITS ITSELF LESS MANY ME MINE MORE MOST MUCH MY MYSELF NEITHER
  NO NOBODY NONE NOONE NOTHING OTHER OTHERS OUR OURS OURSELVES SHE SOME
  SOMEBODY SOMEONE SOMETHING SUCH THAT THE THEIR THEIRS THEM THEMSELVES
  THESE THEY THIS THOSE US WE WHAT WHICH WHO WHOM WHOSE YOU YOUR YOURS
  YOURSELF YOURSELVES
`);

const AUXILIARIES = makeWordSet(`
  AM ARE AREN'T BE BEEN BEING CAN CAN'T COULD COULDN'T DID DIDN'T DO DOES
  DOESN'T DOING DONE DON'T GET GETS GETTING GOT HAD HADN'T HAS HASN'T HAVE
  HAVEN'T HAVING HE'D HE'LL HE'S I'D I'LL I'M IS I'VE ISN'T IT'S MAY MIGHT
  MUST MUSTN'T OUGHT OUGHTN'T SHALL SHAN'T SHE'D SHE'LL SHE'S SHOULD
  SHOULDN'T THAT'S THEY'D THEY'LL THEY'RE WAS WASN'T WE'D WE'LL WERE WE'RE
  WEREN'T WE'VE WILL WON'T WOULD WOULDN'T YOU'D YOU'LL YOU'RE YOU'VE
`);

const PREPOSITIONS = makeWordSet(`
  ABOUT ABOVE AFTER ALONG ALTHOUGH AMONG AND AROUND AS AT BEFORE BELOW
  BENEATH BESIDE BETWEEN BEYOND BUT BY DOWN DURING EXCEPT FOR FROM IF IN
  INTO NEAR NOR OF OFF ON OR OUT OVER ROUND SINCE SO THAN THAT THOUGH
  THROUGH TILL TO TOWARDS UNDER UNLESS UNTIL UP WHEREAS WHILE WITH WITHIN
  WITHOUT
`);

const ADVERBS = makeWordSet(`
  AGAIN AGO ALMOST ALREADY ALSO ALWAYS ANYWHERE BACK ELSE EVEN EVER
  EVERYWHERE FAR HENCE HERE HITHER HOW HOWEVER JUST NEAR NEARBY NEARLY
  NEVER NOT NOW NOWHERE OFTEN ONLY QUITE RATHER SOMETIMES SOMEWHERE SOON
  STILL THEN THENCE THERE THEREFORE THITHER THUS TODAY TOMORROW TOO
  UNDERNEATH VERY WHEN WHENCE WHERE WHITHER WHY YES YESTERDAY YET
`);

const NUMBERS = makeWordSet(`
  BILLION BILLIONTH EIGHT EIGHTEEN EIGHTEENTH EIGHTH EIGHTIETH EIGHTY
  ELEVEN ELEVENTH FIFTEEN FIFTEENTH FIFTH FIFTIETH FIFTY FIRST FIVE
  FORTIETH FORTY FOUR FOURTEEN FOURTEENTH FOURTH HUNDRED HUNDREDTH LAST
  MILLION MILLIONTH NEXT NINE NINETEEN NINETEENTH NINETIETH NINETY NINTH
  ONCE ONE SECOND SEVEN SEVENTEEN SEVENTEENTH SEVENTH SEVENTIETH SEVENTY
  SIX SIXTEEN SIXTEENTH SIXTH SIXTIETH SIXTY TEN TENTH THIRD THIRTEEN
  THIRTEENTH THIRTIETH THIRTY THOUSAND THOUSANDTH THREE THRICE TWELFTH
  TWELVE TWENTIETH TWENTY TWICE TWO
`);

// A word belongs to "content words" if it's in none of the five function-word
// lists above \u2014 so it's tested as their complement, not its own list.
function wordCategories(originalWord) {
  const norm = normalizeWord(originalWord);
  const cats = [];
  if (/^[A-Z\u00c0-\u00d6]/.test(originalWord)) cats.push("capitalised");
  if (originalWord.length <= 4) cats.push("short");
  if (originalWord.length >= 5) cats.push("long");
  if (DETERMINERS.has(norm)) cats.push("determiners");
  if (AUXILIARIES.has(norm)) cats.push("auxiliaries");
  if (PREPOSITIONS.has(norm)) cats.push("prepositions");
  if (ADVERBS.has(norm)) cats.push("adverbs");
  if (NUMBERS.has(norm)) cats.push("numbers");
  const isFunctionWord = ["determiners", "auxiliaries", "prepositions", "adverbs", "numbers"]
    .some(c => cats.includes(c));
  if (!isFunctionWord) cats.push("content");
  return cats;
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
        line.replace(/[A-Za-zÀ-ÖØ-öø-ÿ']+/g, match => {
          const cats = wordCategories(match).join(" ");
          return `<span class="masked" data-fullword="${match}" data-categories="${cats}">${match}</span>`;
        })
      )
      .join("<br>");

    document.getElementById("textBox").innerHTML = bodyHTML || "(No story text found)";

    if (summaryText) {
      showSummaryOverlay(summaryText);
    } else {
      showRevealSetup();
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
  showRevealSetup();
}

// --- EVENT LISTENERS ---
window.addEventListener("DOMContentLoaded", () => {
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

  document.querySelectorAll("#revealChecks input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", applyRevealCategories);
  });
  document.getElementById("startGuessingButton").addEventListener("click", startGuessing);
  document.getElementById("printWorksheetButton").addEventListener("click", () => window.print());
});

// --- REVEAL SETUP (Partial Eclipse) ---
function showRevealSetup() {
  document.getElementById("revealSetup").style.display = "block";
}

// "First letters"/"Last letters" aren't word-intrinsic categories like the
// other nine — they're a partial hint applied to whatever's still masked
// once the whole-word categories have done their work. Mirrors the existing
// in-game "First Letters" help feature's single-letter-word special case.
function hintedText(word, showFirst, showLast) {
  if (word.length <= 1) return word;
  return word
    .split("")
    .map((ch, i) => {
      if (i === 0 && showFirst) return ch;
      if (i === word.length - 1 && showLast) return ch;
      return "_";
    })
    .join("");
}

// Recomputes every masked/given/hinted word from scratch against the
// currently checked categories, so ticking and unticking boxes is always
// consistent regardless of order — a word stays revealed as long as ANY
// checked whole-word category still matches it, or gets a first/last-letter
// hint if only those are ticked, otherwise it's fully masked.
function applyRevealCategories() {
  const checked = Array.from(document.querySelectorAll("#revealChecks input[type=checkbox]:checked"))
    .map(cb => cb.dataset.category);
  const showFirst = checked.includes("firstLetters");
  const showLast = checked.includes("lastLetters");

  document.querySelectorAll("#textBox span.masked, #textBox span.given, #textBox span.hinted").forEach(span => {
    const cats = (span.dataset.categories || "").split(" ");
    const word = span.dataset.fullword;
    const fullyShown = checked.some(c => cats.includes(c));

    span.classList.remove("masked", "given", "hinted");
    if (fullyShown) {
      span.classList.add("given");
      span.textContent = word;
    } else if (showFirst || showLast) {
      span.classList.add("hinted");
      span.textContent = hintedText(word, showFirst, showLast);
    } else {
      span.classList.add("masked");
      span.textContent = word; // masked spans keep their letters, just hidden by CSS
    }
  });
}

function startGuessing() {
  document.getElementById("revealSetup").style.display = "none";
  document.getElementById("soloBox").style.display = "block";
  document.getElementById("wordInput").focus();
}

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

  document.querySelectorAll("#textBox span.masked, #textBox span.hinted").forEach(span => {
    const normalized = normalizeWord(span.dataset.fullword);
    if (normalized === guess) {
      span.classList.remove("masked", "hinted");
      span.classList.add("revealed", "justRevealed");
      span.textContent = span.dataset.fullword;
      playerScore++;
      foundSet.add(normalized);
      found = true;
    }
  });

  let wasGiven = false;
  if (!found) {
    document.querySelectorAll("#textBox span.revealed").forEach(span => {
      const normalized = normalizeWord(span.dataset.fullword || span.textContent);
      if (normalized === guess) {
        alreadyFound = true;
      }
    });
    document.querySelectorAll("#textBox span.given").forEach(span => {
      const normalized = normalizeWord(span.dataset.fullword || span.textContent);
      if (normalized === guess) {
        wasGiven = true;
      }
    });
  }

  const feedback = document.getElementById("feedback");
  if (found) {
    feedback.textContent = "";
  } else if (alreadyFound) {
    feedback.textContent = `"${guess}" has already been found`;
  } else if (wasGiven) {
    feedback.textContent = `"${guess}" was already shown to you`;
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
  // Only reveal what's still masked or hinted — leave already-given/already-found
  // spans as they are, so the report can still tell them apart afterwards.
  document.querySelectorAll("#textBox span.masked, #textBox span.hinted").forEach(span => {
    span.classList.remove("masked", "hinted");
    span.classList.add("revealed");
    span.textContent = span.dataset.fullword;
  });

  document.getElementById("soloBox").style.display = "none";
  document.getElementById("endScreen").style.display = "block";
  showReport();
}

// --- END GAME ---
function checkGameFinished() {
  const maskedSpans = document.querySelectorAll("#textBox span.masked, #textBox span.hinted");
  if (maskedSpans.length === 0) {
    document.getElementById("soloBox").style.display = "none";
    document.getElementById("endScreen").style.display = "block";
    showReport();
  }
}

// --- REPORT ---
function showReport() {
  const title = document.getElementById("storyTitle").textContent;

  // .given spans (revealed by the teacher's category setup, not guessed)
  // are deliberately excluded here — the report only covers words the
  // player was actually responsible for finding.
  const spans = document.querySelectorAll("#textBox span.masked, #textBox span.revealed");
  const totalWords = spans.length;
  const uniqueWords = new Set(Array.from(spans).map(s => normalizeWord(s.dataset.fullword || s.textContent))).size;

  const givenCount = document.querySelectorAll("#textBox span.given").length;

  const foundWords = foundSet.size;
  const wrongList = Array.from(wrongWords).join(", ") || "none";

  let report = `
    <p><strong>${title}</strong> contained ${uniqueWords} different words, ${totalWords} words altogether${givenCount ? " (plus " + givenCount + " given words shown in advance)" : ""}.</p>
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
