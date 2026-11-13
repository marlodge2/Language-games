// trip.js

window.addEventListener("DOMContentLoaded", () => {
  const days = document.querySelectorAll(".day");
  const cluePanel = document.getElementById("cluePanel");
  const clueList = cluePanel.querySelector("ul");
  const clueBtn = document.getElementById("showCluesBtn");
  const introLine = document.getElementById("introLine");
  const townRow = document.getElementById("townRow");

  // --- Town sets ---
  const townSets = {
    "the South of England": ["Bath", "Bristol", "Salisbury", "Oxford", "Cambridge", "Bournemouth", "London"],
    "Scotland": ["Edinburgh", "Glasgow", "Inverness", "Aberdeen", "Stirling", "Dundee", "Perth"],
    "Wales": ["Cardiff", "Swansea", "Newport", "Bangor", "Wrexham", "Aberystwyth", "Llandudno"],
    "the North of England": ["Manchester", "Liverpool", "Leeds", "Sheffield", "Newcastle", "Durham", "Carlisle"],
    "Ireland": ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kilkenny", "Sligo"]
  };

  let lastRegion = null;
  let towns = [];
  let townElements = [];
  let solution = {};

  // Shuffle helper
  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  // Pick region without repeating last
  function pickRegion() {
    const regions = Object.keys(townSets);
    let region;
    do {
      region = regions[Math.floor(Math.random() * regions.length)];
    } while (region === lastRegion);
    lastRegion = region;
    return region;
  }

  // Load towns dynamically
  function loadTowns() {
    const region = pickRegion();
    towns = townSets[region];
    townRow.innerHTML = "";

    towns.forEach(town => {
      const div = document.createElement("div");
      div.className = "town";
      div.textContent = town;
      div.setAttribute("draggable", "true");
      townRow.appendChild(div);
    });

    introLine.textContent =
      `Last week's Happy Tours took a party round ${region}. Can you match the towns to the days?`;

    townElements = Array.from(document.querySelectorAll(".town"));
  }
function resetGame() {
  // Clear clues
  clueList.innerHTML = "";
  cluePanel.classList.add("hidden");
  usedClues.clear();
  clueCount = 0;
  startClueGiven = false;
  finishClueGiven = false;
  consecutiveCluesGiven = 0;

  // Reset scores
  foundCount = 0;
  wrongCount = 0;
  updateScore();

  // Clear all day assignments
  days.forEach(day => {
    const assignmentBox = day.querySelector(".assignment");
    assignmentBox.textContent = "";
    assignmentBox.classList.remove("correct", "wrong");
  });

  // Re‑enable town boxes
  document.querySelectorAll(".town").forEach(town => {
    town.classList.remove("disabled");
    town.textContent = town.getAttribute("data-original") || town.textContent;
  });

  // Reload towns and solution
  loadTowns();
  createSolution();
  setupDragDrop();
}

  // --- Solution setup ---
  function createSolution() {
    solution = {};
    shuffle([...towns]).forEach((town, i) => {
      const dayName = days[i].getAttribute("data-day");
      solution[dayName] = town;
    });
    console.log("Solution:", solution);
  }

  // --- Clue panel handling ---
  const usedClues = new Set();
  let clueCount = 0;
  let startClueGiven = false;
  let finishClueGiven = false;

let consecutiveCluesGiven = 0;   // track how many breakdown clues used
const maxConsecutiveClues = 1;   // allow only one per game

function generateClue() {
  clueCount++;
  const dayNames = Array.from(days).map(d => d.getAttribute("data-day"));

  // --- special start/finish clues ---
  if (clueCount === 3 && !startClueGiven && !finishClueGiven) {
    if (Math.random() < 0.5) {
      const startTown = solution[dayNames[0]];
      startClueGiven = true;
      return `They started their journey in ${startTown}.`;
    } else {
      const finishTown = solution[dayNames[dayNames.length - 1]];
      finishClueGiven = true;
      return `They finished their journey in ${finishTown}.`;
    }
  }
  if (clueCount === 7) {
    if (!startClueGiven) {
      const startTown = solution[dayNames[0]];
      startClueGiven = true;
      return `They started their journey in ${startTown}.`;
    }
    if (!finishClueGiven) {
      const finishTown = solution[dayNames[dayNames.length - 1]];
      finishClueGiven = true;
      return `They finished their journey in ${finishTown}.`;
    }
  }

  // --- weighted random choice ---
  let weights = [
    { type: "offset", weight: 6 },
    { type: "notStartEnd", weight: 3 },
    { type: "consecutive", weight: 1 }
  ];
  if (consecutiveCluesGiven >= maxConsecutiveClues) {
    weights = weights.filter(w => w.type !== "consecutive");
  }
  if (weights.length === 0) {
    weights = [{ type: "offset", weight: 1 }];
  }

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * totalWeight;
  let type = weights[0].type;
  for (const w of weights) {
    if (r < w.weight) { type = w.type; break; }
    r -= w.weight;
  }

  let clue;
  let attempts = 0;
  do {
    attempts++;
    if (type === "consecutive") {
      const i = Math.floor(Math.random() * (dayNames.length - 1));
      const site1 = solution[dayNames[i]];
      const site2 = solution[dayNames[i + 1]];
      clue = `Their coach broke down while they were going from ${site1} to ${site2}.`;
      consecutiveCluesGiven++;
    }
    if (type === "notStartEnd") {
      const middleDay = dayNames[Math.floor(Math.random() * (dayNames.length - 2)) + 1];
      const town = solution[middleDay];
      clue = `They did not begin or end their journey in ${town}.`;
    }
    if (type === "offset") {
      const i = Math.floor(Math.random() * (dayNames.length - 2));
      const maxOffset = dayNames.length - i - 1;
      if (maxOffset >= 2) {
        const offset = 2 + Math.floor(Math.random() * Math.min(4, maxOffset)); // capped at 5
        const j = i + offset;
        if (j < dayNames.length) {
          const site1 = solution[dayNames[i]];
          const site2 = solution[dayNames[j]];
          clue = `Their visit to ${site1} was ${offset} days before ${site2}.`;
        }
      }
      if (!clue) {
        // fallback
        const site1 = solution[dayNames[i]];
        const site2 = solution[dayNames[i + 1]];
        clue = `Their coach broke down while they were going from ${site1} to ${site2}.`;
      }
    }
  } while (usedClues.has(clue) && attempts < 10);

  usedClues.add(clue);
  return clue;
}

// --- Clue button click handler ---
clueBtn.addEventListener("click", () => {
  cluePanel.classList.remove("hidden");
  const li = document.createElement("li");
  const clueText = generateClue();
  if (clueText) {
    li.textContent = clueText;
    clueList.appendChild(li);
  }
});

// --- Scoreboard setup ---
  let foundCount = 0;
  let wrongCount = 0;

  function updateScore() {
    document.getElementById("scoreBoard").textContent =
      `Found: ${foundCount} | Wrong guesses: ${wrongCount}`;
  }

function checkWin() {
  if (foundCount === towns.length) {
    clueBtn.style.display = "none";

    const congrats = document.createElement("div");
    congrats.classList.add("win-message");
    congrats.textContent = "Congratulations, you solved the diary puzzle in " + clueCount + " clues!";

    clueBtn.insertAdjacentElement("afterend", congrats);

    // Create a centered container for buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("center-buttons");

    const replayBtn = document.createElement("button");
replayBtn.textContent = "Play again";
replayBtn.addEventListener("click", () => {
  location.reload();  // reloads the current page
});

    const quitBtn = document.createElement("button");
    quitBtn.textContent = "Quit";
    quitBtn.addEventListener("click", () => {
      buttonContainer.remove();
      congrats.remove();
      window.location.href = "https://marlodge.net";
    });

    // Add buttons to container
    buttonContainer.appendChild(replayBtn);
    buttonContainer.appendChild(quitBtn);

    // Insert container after win message
    congrats.insertAdjacentElement("afterend", buttonContainer);
  }
}

  // --- Drag and drop setup ---
function setupDragDrop() {
  days.forEach(day => {
    // Remove any existing listeners first
    day.replaceWith(day.cloneNode(true));
  });
  // Re‑select days after cloning
  const freshDays = document.querySelectorAll(".day");

  townElements.forEach(town => {
    town.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", town.textContent);
    });
  });

  freshDays.forEach(day => {
    day.addEventListener("dragover", e => {
      e.preventDefault();
      day.classList.add("drag-over");
    });

    day.addEventListener("dragleave", () => {
      day.classList.remove("drag-over");
    });

    day.addEventListener("drop", e => {
      e.preventDefault();
      day.classList.remove("drag-over");

      const townName = e.dataTransfer.getData("text/plain");
      const dayName = day.getAttribute("data-day");
      const assignmentBox = day.querySelector(".assignment");

      if (solution[dayName] === townName) {
        if (!assignmentBox.classList.contains("correct")) { // prevent double count
          assignmentBox.textContent = townName;
          assignmentBox.classList.add("correct");
          foundCount++;
          updateScore();
        }
        const townBox = [...document.querySelectorAll(".town")]
          .find(t => t.textContent === townName);
        if (townBox) {
          townBox.classList.add("disabled");
          townBox.textContent = "";
        }
        checkWin();
      } else {
        assignmentBox.textContent = "✖";
        assignmentBox.classList.add("wrong");
        wrongCount++;
        updateScore();
        setTimeout(() => {
          assignmentBox.textContent = "";
          assignmentBox.classList.remove("wrong");
        }, 1000);
      }
    });
  });
}

  // --- Initialize game ---
  loadTowns();
  createSolution();
  setupDragDrop();
  updateScore();
});
