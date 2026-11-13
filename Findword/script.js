// ------------------------------
// Load dictionary
// ------------------------------
let dictionary = [];

fetch("dictionary.json")
  .then(r => r.json())
  .then(data => {
    dictionary = data;
    console.log("Dictionary loaded:", dictionary.length, "entries");
    updateResults();
  })
  .catch(err => console.error("Failed to load dictionary:", err));


// ------------------------------
// DOM references
// ------------------------------
const spellInclude = document.getElementById("spellInclude");
const spellExclude = document.getElementById("spellExclude");
const pronInclude  = document.getElementById("pronInclude");
const pronExclude  = document.getElementById("pronExclude");
const syllableSelect = document.getElementById("syllableSelect");

const resultsList = document.getElementById("resultsList");
const details = document.getElementById("details");
const resultsCount = document.getElementById("resultsCount");
const exportBtn = document.getElementById("exportBtn");

// Accumulated "combined list" controls — lets a search be kept and
// added to before running a different search (e.g. *ful then *less).
const addToListBtn = document.getElementById("addToListBtn");
const viewListBtn = document.getElementById("viewListBtn");
const clearListBtn = document.getElementById("clearListBtn");
const listCountLabel = document.getElementById("listCountLabel");

let savedList = new Set();
let lastFiltered = [];
let viewingList = false;
let selectedEntry = null;

// POS controls
const posSelect = document.getElementById("posSelect");
const subtypeSelect = document.getElementById("subtypeSelect");
const subtypeLabel = document.getElementById("subtypeLabel");
const raritySelect = document.getElementById("raritySelect");
const resetPosBtn = document.getElementById("resetPosBtn");


// ------------------------------
// IPA palette
// ------------------------------
// Symbols go into whichever pronunciation field was last focused
// (Includes or Excludes), so the palette works for both.
let ipaTarget = pronInclude;

[pronInclude, pronExclude].forEach(field => {
  field.addEventListener("focus", () => { ipaTarget = field; });
});

document.querySelectorAll("#ipaPalette button").forEach(btn => {
  btn.addEventListener("click", () => {
    ipaTarget.value += btn.textContent;
    ipaTarget.focus();
    updateResults();
  });
});


// ------------------------------
// Utility: wildcard matcher
// ------------------------------
function matchesWildcard(value, pattern) {
  if (!pattern) return true;

  if (pattern.endsWith("*")) {
    return value.startsWith(pattern.slice(0, -1));
  }

  if (pattern.startsWith("*")) {
    return value.endsWith(pattern.slice(1));
  }

  return value.includes(pattern);
}


// ------------------------------
// Utility: normalize IPA
// ------------------------------
function normalizeIPA(ipa) {
  return (ipa || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ˈˌː]/g, "");
}


// ------------------------------
// Utility: fuzzy IPA equivalence
// ------------------------------
function ipaEquivalent(ipa) {
  return ipa
    .replace(/iː/g, "i")
    .replace(/ɪ/g, "i")
    .replace(/uː/g, "u")
    .replace(/ʊ/g, "u")
    .replace(/ɔː/g, "o")
    .replace(/ɒ/g, "o")
    .replace(/ɜː/g, "ə")
    .replace(/ə/g, "ə");
}


// ------------------------------
// POS subtype map
// ------------------------------
const posSubtypeMap = {
  verb: [
    { code: "G", label: "Anomalous" },
    { code: "H", label: "Transitive" },
    { code: "I", label: "Intransitive" },
    { code: "J", label: "Trans & Intrans" }
  ],
  noun: [
    { code: "K", label: "Countable" },
    { code: "L", label: "Uncountable" },
    { code: "M", label: "Both C & U" },
    { code: "N", label: "Proper noun" }
  ],
  adj: [
    { code: "A", label: "No -er/-est" },
    { code: "B", label: "+r/+st" },
    { code: "C", label: "+er/+est" },
    { code: "D", label: "y→ier/iest" },
    { code: "E", label: "Irregular" }
  ],
  adv: [
    { code: "u", label: "Ordinary" },
    { code: "v", label: "Interrogative" },
    { code: "w", label: "Relative" },
    { code: "+", label: "Particle" }
  ],
  pron: [
    { code: "x", label: "Ordinary" },
    { code: "y", label: "Interrogative" },
    { code: "z", label: "Relative" }
  ]
};


// ------------------------------
// Highlight active filters
// ------------------------------
function updateFilterHighlights() {
  if (posSelect.value !== "any") posSelect.classList.add("active-filter");
  else posSelect.classList.remove("active-filter");

  if (subtypeSelect.style.display !== "none" && subtypeSelect.value !== "any")
    subtypeSelect.classList.add("active-filter");
  else
    subtypeSelect.classList.remove("active-filter");

  if (raritySelect.value !== "any") raritySelect.classList.add("active-filter");
  else raritySelect.classList.remove("active-filter");

  if (syllableSelect.value !== "all") syllableSelect.classList.add("active-filter");
  else syllableSelect.classList.remove("active-filter");
}


// ------------------------------
// POS dropdown behaviour
// ------------------------------
posSelect.addEventListener("change", () => {
  const pos = posSelect.value;

  raritySelect.value = "any";

  if (!posSubtypeMap[pos]) {
    subtypeSelect.style.display = "none";
    subtypeLabel.style.display = "none";
    subtypeSelect.innerHTML = '<option value="any">ANY</option>';
    updateResults();
    return;
  }

  subtypeSelect.style.display = "inline-block";
  subtypeLabel.style.display = "inline-block";

  subtypeSelect.innerHTML = '<option value="any">ANY</option>';
  posSubtypeMap[pos].forEach(st => {
    const opt = document.createElement("option");
    opt.value = st.code;
    opt.textContent = st.label;
    subtypeSelect.appendChild(opt);
  });

  updateResults();
});

subtypeSelect.addEventListener("change", () => {
  if (subtypeSelect.value !== "any" && posSelect.value === "any") {
    posSelect.value = "any";
    subtypeSelect.value = "any";
  }
  updateResults();
});

raritySelect.addEventListener("change", updateResults);


// ------------------------------
// Reset POS button
// ------------------------------
resetPosBtn.addEventListener("click", () => {
  posSelect.value = "any";
  subtypeSelect.innerHTML = '<option value="any">ANY</option>';
  subtypeSelect.style.display = "none";
  subtypeLabel.style.display = "none";
  raritySelect.value = "any";

  updateResults();
});


// ------------------------------
// POS decoder for details panel
// ------------------------------
const posNames = {
  G: "Verb (anomalous)",
  H: "Verb (transitive)",
  I: "Verb (intransitive)",
  J: "Verb (trans & intrans)",
  K: "Noun (countable)",
  L: "Noun (uncountable)",
  M: "Noun (both C & U)",
  N: "Noun (proper)",
  O: "Adjective",
  P: "Adverb",
  Q: "Pronoun",
  R: "Definite article",
  S: "Indefinite article",
  T: "Preposition",
  U: "Prefix",
  V: "Conjunction",
  W: "Interjection",
  X: "Particle",
  Y: "Abbreviation",
  Z: "Not classified"
};

const rarityNames = {
  "*": "common",
  "%": "normal",
  "$": "rare"
};

function posCodesOf(entry) {
  return (entry || "").split(",").map(c => c.trim()).filter(Boolean);
}

function decodeOnePOS(code) {
  const pos = code.charAt(0);
  const rarity = code.charAt(2);
  return `${posNames[pos] || "?"} — ${rarityNames[rarity] || "?"}`;
}

function decodePOS(codeString) {
  const codes = posCodesOf(codeString);
  if (!codes.length) return "(unclassified)";
  return codes.map(decodeOnePOS).join("; ");
}


// ------------------------------
// Clear all filters
// ------------------------------
function clearAllFilters() {
  spellInclude.value = "";
  spellExclude.value = "";
  pronInclude.value = "";
  pronExclude.value = "";
  syllableSelect.value = "all";

  posSelect.value = "any";
  subtypeSelect.innerHTML = '<option value="any">ANY</option>';
  subtypeSelect.style.display = "none";
  subtypeLabel.style.display = "none";

  raritySelect.value = "any";

  posSelect.classList.remove("active-filter");
  subtypeSelect.classList.remove("active-filter");
  raritySelect.classList.remove("active-filter");
  syllableSelect.classList.remove("active-filter");

  updateResults();

  resultsList.scrollTop = 0;
  spellInclude.focus();
}


// ------------------------------
// Main filter
// ------------------------------
function updateResults() {

  viewingList = false;

  updateFilterHighlights();

  const si = spellInclude.value.toLowerCase();
  const se = spellExclude.value.toLowerCase();

  const pi = pronInclude.value.toLowerCase();
  const pe = pronExclude.value.toLowerCase();

  const syll = syllableSelect.value;

  const filtered = dictionary.filter(entry => {

    const word  = (entry.spelling || "").toLowerCase();
    const ascii = (entry.pron_ascii || "").toLowerCase();

    const ipaRaw = entry.pron_ipa || "";
    const ipaNorm = ipaEquivalent(normalizeIPA(ipaRaw));
    const ipaInput = ipaEquivalent(normalizeIPA(pi));

    // Spelling includes
    if (si) {
      const patterns = si.split("|").map(p => p.trim()).filter(p => p.length);
      const ok = patterns.some(p => matchesWildcard(word, p));
      if (!ok) return false;
    }

    // Spelling excludes
    if (se && matchesWildcard(word, se)) return false;

    // Pronunciation includes
    if (pi) {
      const patterns = pi.split("|").map(p => p.trim()).filter(p => p.length);

      const ok = patterns.some(p => {
        const asciiMatch = ascii.includes(p);
        const ipaMatch   = ipaNorm.includes(ipaEquivalent(normalizeIPA(p)));
        return asciiMatch || ipaMatch;
      });

      if (!ok) return false;
    }

    // Pronunciation excludes
    if (pe) {
      const patterns = pe.split("|").map(p => p.trim()).filter(p => p.length);

      const bad = patterns.some(p => {
        const asciiMatch = ascii.includes(p);
        const ipaMatch   = ipaNorm.includes(ipaEquivalent(normalizeIPA(p)));
        return asciiMatch || ipaMatch;
      });

      if (bad) return false;
    }

    // Syllables
    if (syll !== "all") {
      if (syll === "4plus" && entry.syllables < 4) return false;
      if (syll !== "4plus" && entry.syllables !== Number(syll)) return false;
    }

    // POS filtering
    const posChoice = posSelect.value;
    const subtypeChoice = subtypeSelect.value;
    const rarityChoice = raritySelect.value;

    if (posChoice !== "any" || subtypeChoice !== "any" || rarityChoice !== "any") {
      const posGroups = {
        verb: ["G","H","I","J"],
        noun: ["K","L","M","N"],
        adj: ["O"],
        adv: ["P"],
        pron: ["Q"],
        article: ["R","S"],
        prep: ["T"],
        conj: ["V"],
        interj: ["W"],
        particle: ["X"],
        prefix: ["U"],
        abbr: ["Y"],
        other: ["Z"]
      };

      // A word can have several pos codes (e.g. "cook" is both verb and noun).
      // It matches if ANY one of its codes satisfies pos + subtype + rarity together.
      const matches = posCodesOf(entry.pos).some(code => {
        if (posChoice !== "any" && !posGroups[posChoice].includes(code.charAt(0))) return false;
        if (subtypeChoice !== "any" && code.charAt(1) !== subtypeChoice) return false;
        if (rarityChoice !== "any" && code.charAt(2) !== rarityChoice) return false;
        return true;
      });

      if (!matches) return false;
    }

    return true;
  });

  lastFiltered = filtered;
  renderResults(filtered);
  updateListToolbar();
}


// ------------------------------
// Combined list (accumulate results across searches)
// ------------------------------
function addCurrentToList() {
  lastFiltered.forEach(entry => savedList.add(entry));
  updateListToolbar();
}

function clearList() {
  savedList.clear();
  if (viewingList) {
    viewingList = false;
    renderResults(lastFiltered, false);
  }
  updateListToolbar();
}

function toggleListView() {
  viewingList = !viewingList;
  if (viewingList) {
    renderResults(sortedSavedList(), true);
  } else {
    renderResults(lastFiltered, false);
  }
  updateListToolbar();
}

function sortedSavedList() {
  return Array.from(savedList).sort((a, b) =>
    (a.spelling || "").localeCompare(b.spelling || "")
  );
}

function updateListToolbar() {
  const n = savedList.size;
  listCountLabel.textContent = `List: ${n} word${n === 1 ? "" : "s"}`;
  viewListBtn.textContent = viewingList ? "Back to search results" : `View list (${n})`;
  viewListBtn.disabled = n === 0;
  clearListBtn.disabled = n === 0;
  addToListBtn.disabled = viewingList;
}

function removeFromList(entry) {
  savedList.delete(entry);
  if (selectedEntry === entry) {
    selectedEntry = null;
    details.innerHTML = '<div class="details-placeholder">Select a word to view details</div>';
  }
  if (viewingList) {
    renderResults(sortedSavedList(), true);
  }
  updateListToolbar();
}

// Delete/Backspace removes the selected word while browsing the list
// (ignored while typing in a filter field).
document.addEventListener("keydown", (e) => {
  if (!viewingList || !selectedEntry) return;
  if (e.key !== "Delete" && e.key !== "Backspace") return;

  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

  e.preventDefault();
  removeFromList(selectedEntry);
});


// ------------------------------
// Render results
// ------------------------------
function renderResults(list, isListView = false) {
  resultsList.innerHTML = "";
  selectedEntry = null;

  resultsCount.textContent = isListView
    ? `${list.length} word${list.length === 1 ? "" : "s"} in list.`
    : `${list.length} word${list.length === 1 ? "" : "s"} found.`;

  if (!list.length) {
    resultsList.textContent = "No Match";
    details.innerHTML = "";
    return;
  }

  list.forEach(entry => {
    const div = document.createElement("div");
    div.className = "result-item";

    const wordSpan = document.createElement("span");
    wordSpan.textContent = entry.spelling;
    div.appendChild(wordSpan);

    if (isListView) {
      const delBtn = document.createElement("span");
      delBtn.className = "delete-word";
      delBtn.textContent = "×";
      delBtn.title = "Remove from list";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromList(entry);
      });
      div.appendChild(delBtn);
    }

    // ------------------------------
    // Selection highlight
    // ------------------------------
    div.addEventListener("click", () => {
      document.querySelectorAll(".result-item").forEach(el =>
        el.classList.remove("result-selected")
      );
      div.classList.add("result-selected");
      selectedEntry = entry;
      showDetails(entry);
    });

    resultsList.appendChild(div);
  });
}


// ------------------------------
// Show details
// ------------------------------
function showDetails(entry) {
  details.innerHTML = `
    <strong>${entry.spelling}</strong><br>
    IPA: ${entry.pron_ipa || "(none)"}<br>
    ASCII: ${entry.pron_ascii || "(none)"}<br>
    POS: ${decodePOS(entry.pos)}<br>
    Syllables: ${entry.syllables}<br>
  `;
}
function exportResultsAsText() {
  // Collect all visible results
  const items = Array.from(document.querySelectorAll(".result-item"))
                     .map(el => el.textContent);

  if (!items.length) {
    alert("No results to export.");
    return;
  }

  // Join with newlines
  const textContent = items.join("\n");

  // Create a downloadable blob
  const blob = new Blob([textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  // Create a temporary link
  const a = document.createElement("a");
  a.href = url;
  a.download = "findword-results.txt";
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ------------------------------
// Event listeners
// ------------------------------
spellInclude.addEventListener("input", updateResults);
spellExclude.addEventListener("input", updateResults);
pronInclude.addEventListener("input", updateResults);
pronExclude.addEventListener("input", updateResults);
syllableSelect.addEventListener("change", updateResults);

addToListBtn.addEventListener("click", addCurrentToList);
viewListBtn.addEventListener("click", toggleListView);
clearListBtn.addEventListener("click", clearList);
exportBtn.addEventListener("click", exportResultsAsText);
