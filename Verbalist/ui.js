"use strict";
/* UI wiring for Verbalist — reads/writes Verbalist.state and re-renders. */

const V = window.Verbalist;
const uiState = V.state;

// Map each toggle-group's data-value to a uiState mutation.
const GROUP_SETTERS = {
  tense: (v) => (uiState.tense = v),
  modal: (v) => {
    uiState.hasModal = v === "modal";
    uiState.emphatic = v === "emphatic";
  },
  perfect: (v) => (uiState.hasPerfect = v === "on"),
  aspect: (v) => {
    uiState.aspect = v;
    if (v !== "goingTo") {
      uiState.goingToPerfect = false;
      uiState.goingToContinuous = false;
    }
  },
  goingToPerfect: (v) => (uiState.goingToPerfect = v === "on"),
  goingToContinuous: (v) => (uiState.goingToContinuous = v === "on"),
  voice: (v) => (uiState.voice = v),
  polarity: (v) => (uiState.polarity = v),
  statementType: (v) => (uiState.statementType = v),
};

function currentGroupValue(group) {
  switch (group) {
    case "modal":
      return uiState.hasModal ? "modal" : uiState.emphatic ? "emphatic" : "none";
    case "perfect":
      return uiState.hasPerfect ? "on" : "off";
    case "goingToPerfect":
      return uiState.goingToPerfect ? "on" : "off";
    case "goingToContinuous":
      return uiState.goingToContinuous ? "on" : "off";
    default:
      return uiState[group];
  }
}

// Derived visibility/availability rules (equivalent to the union of the many
// VB *_Click handlers that show/hide/reset the Emphatic option and the
// stative/intransitive browser buttons — see app.js header comment).
function emphaticAvailable() {
  return (
    !uiState.hasPerfect &&
    uiState.aspect === "simple" &&
    uiState.polarity === "affirmative" &&
    uiState.statementType !== "question"
  );
}

function applyDerivedRules() {
  if (uiState.emphatic && !emphaticAvailable()) {
    uiState.emphatic = false;
    uiState.hasModal = false;
  }
}

function render() {
  applyDerivedRules();

  document.querySelectorAll(".group[data-group]").forEach((group) => {
    const key = group.dataset.group;
    const current = currentGroupValue(key);
    group.querySelectorAll("button.toggle").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === current);
    });
  });

  const emphaticBtn = document.getElementById("emphaticBtn");
  emphaticBtn.disabled = !emphaticAvailable();

  document.getElementById("goingToPerfectGroup").hidden = uiState.aspect !== "goingTo";
  document.getElementById("goingToContinuousGroup").hidden = uiState.aspect !== "goingTo";

  document.getElementById("stativeBtn").hidden = uiState.aspect === "simple";
  document.getElementById("intransBtn").hidden = uiState.voice !== "passive";

  const { phrase } = V.buildVerb();
  // The VB source concatenates fixed literals (e.g. a trailing " " plus a
  // leading-space " ...") in a few branches, leaving harmless doubled
  // spaces / a stray space before punctuation. Tidy that at display time
  // only — app.js itself stays a literal, traceable port of Buildverb.
  const displayPhrase = phrase.replace(/ {2,}/g, " ").replace(/ ([?,])/g, "$1");
  document.getElementById("phraseBox").textContent = displayPhrase;
  document.getElementById("verbName").textContent = uiState.mainVerb.toUpperCase();

  const ruleText = V.ruleNoteText();
  const ruleEl = document.getElementById("ruleNote");
  ruleEl.hidden = !ruleText;
  ruleEl.textContent = ruleText;

  const warnings = V.warningsList();
  const warnEl = document.getElementById("warnings");
  warnEl.hidden = warnings.length === 0;
  warnEl.innerHTML = "";
  warnings.forEach((w) => {
    const div = document.createElement("div");
    div.className = "panel " + (w.severity === "red" ? "panel-warning" : "panel-warning-mild");
    div.textContent = w.text;
    warnEl.appendChild(div);
  });

  document.getElementById("definition").textContent = uiState.defin || "";

  const noteEl = document.getElementById("usageNote");
  noteEl.hidden = !uiState.note;
  noteEl.textContent = uiState.note || "";
}

function wireToggleGroups() {
  document.querySelectorAll(".group[data-group] button.toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".group").dataset.group;
      GROUP_SETTERS[group](btn.dataset.value);
      render();
    });
  });
}

function wireSelectors() {
  const pronounSelect = document.getElementById("pronounSelect");
  pronounSelect.addEventListener("change", () => {
    uiState.person = Number(pronounSelect.value);
    render();
  });

  const modalSelect = document.getElementById("modalSelect");
  modalSelect.addEventListener("change", () => {
    uiState.whichModal = Number(modalSelect.value);
    render();
  });
}

function wireNewVerbDialog() {
  const dialog = document.getElementById("newVerbDialog");
  const form = document.getElementById("newVerbForm");
  const input = document.getElementById("newVerbInput");

  document.getElementById("newVerbBtn").addEventListener("click", () => {
    input.value = "";
    dialog.showModal();
    input.focus();
  });
  document.getElementById("newVerbCancel").addEventListener("click", () => dialog.close());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const word = input.value.trim().split(/\s+/)[0] || "";
    dialog.close();
    if (!word) return;
    const accepted = await V.discover(word);
    if (accepted) render();
  });
}

function wireAboutDialog() {
  const dialog = document.getElementById("aboutDialog");
  document.getElementById("aboutBtn").addEventListener("click", () => dialog.showModal());
  document.getElementById("aboutClose").addEventListener("click", () => dialog.close());
}

function wireListDialog() {
  const dialog = document.getElementById("listDialog");
  const title = document.getElementById("listDialogTitle");
  const body = document.getElementById("listDialogBody");
  document.getElementById("listDialogClose").addEventListener("click", () => dialog.close());

  function openList(kind) {
    const words = V.verbs
      .filter((v) => v[kind])
      .map((v) => v.word)
      .sort();
    const label = kind === "stative" ? "stative" : "intransitive";
    title.textContent = `There are ${words.length} ${label} verbs in Verbalist's database.`;
    body.innerHTML = "";
    for (const w of words) {
      const span = document.createElement("span");
      span.textContent = w;
      body.appendChild(span);
    }
    dialog.showModal();
  }

  document.getElementById("stativeBtn").addEventListener("click", () => openList("stative"));
  document.getElementById("intransBtn").addEventListener("click", () => openList("intransitive"));
}

async function main() {
  try {
    await V.loadVerbs();
  } catch (err) {
    console.error("Could not load the verb dictionary:", err);
    const banner = document.createElement("div");
    banner.className = "panel panel-warning";
    banner.textContent =
      "Couldn't load the verb dictionary (" + err.message + "). Meanings, irregular forms " +
      "and usage notes won't be available, but spelling rules will still work. If you're " +
      "viewing this file directly on your computer rather than through a web server, that's " +
      "usually why — browsers block local pages from loading their own data files this way.";
    document.querySelector("main").prepend(banner);
  }
  await V.discover("walk");
  wireToggleGroups();
  wireSelectors();
  wireNewVerbDialog();
  wireAboutDialog();
  wireListDialog();
  render();
}

main();
