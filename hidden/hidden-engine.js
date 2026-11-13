/* ---------------------------------------------------------------
 * Shared player for the "Hidden Word" listening exercises.
 * Modernised 2026 replacement for the original Hot Potatoes (Half-Baked
 * Software) frameset version, by/for John Higgins.
 *
 * HOW TO ADD A NEW EXERCISE
 * -------------------------
 * 1. Record (or find) one short audio clip per sentence, as .mp3, and
 *    put the files in this folder.
 * 2. Copy an existing exercise file (e.g. hidden.html) to a new name.
 * 3. Edit its EXERCISE object (see schema below) — change the title,
 *    the "next" link, and the questions array.
 * 4. Add a line for it on index.html.
 * That's it — all the player logic (audio, scoring, feedback) lives
 * here in one place and doesn't need to be touched per exercise.
 *
 * EXERCISE = {
 *   title: "Conference Welcome Speech",
 *   next: "hidden4.html",      // URL of the next exercise, or null if last
 *   questions: [
 *     {
 *       audio: "q1",           // expects q1.mp3 in the same folder
 *       before: "Good afternoon, ladies and gentlemen, ",
 *       after: " I have your attention please.",
 *       words: ["daft", "sand", "may", "ten"],
 *       correct: 2,            // 0-based index into words[]
 *       highlight: "may",      // optional — defaults to words[correct];
 *                               // set this when the written form differs
 *                               // from the spoken option, e.g. "100" vs "hundred"
 *       hints: [                // one per word, same order as words[];
 *         "Good afternoon ....",  // shown on a wrong guess — a snippet of
 *         "... ladies and ....",  // the real sentence near where that word
 *         null,                   // might have been misheard. null for the
 *         ".. attention .."       // correct word (unused).
 *       ]
 *     },
 *     ...
 *   ]
 * }
 * ------------------------------------------------------------- */

(function () {
  "use strict";

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") e.className = attrs[k];
        else if (k === "text") e.textContent = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }

  function buildSentence(q) {
    var span = el("span");
    span.appendChild(document.createTextNode(q.before));
    var mark = el("mark", { text: q.highlight || q.words[q.correct] });
    span.appendChild(mark);
    span.appendChild(document.createTextNode(q.after));
    return span;
  }

  function render(exercise) {
    var app = document.getElementById("app");
    document.title = exercise.title + " — Hidden Word Listening";
    app.appendChild(el("h1", { text: "Hidden Word Listening Exercises" }));
    app.appendChild(el("div", { class: "subtitle", text: exercise.title }));

    var langLink = el("div", { style: "text-align:center; margin-bottom:10px;" });
    var thUrl = "../thai-help/" + location.pathname.replace(/\.html$/, "-th.html").split("/").pop();
    langLink.appendChild(el("a", { href: thUrl, text: "ภาษาไทย (Thai instructions)" }));
    app.appendChild(langLink);

    var help = el("details", { class: "help" });
    var summary = el("summary", { text: "How does this work?" });
    var helpBody = el("div");
    helpBody.innerHTML =
      "<p>For each sentence you see four words. Listen as many times as you like — only one of " +
      "the words was actually used by the speaker, though the others may sound similar. Choose the word you heard.</p>" +
      "<p>If you're right, you'll see the whole sentence with the word highlighted. If you're wrong, " +
      "you'll see a short snippet of what was really said near that spot, so you can work out what you misheard.</p>" +
      "<p><a href=\"instruct.html\">Full instructions, with a worked example</a>.</p>";
    help.appendChild(summary);
    help.appendChild(helpBody);
    app.appendChild(help);

    var scoreLine = el("div", { id: "scoreLine" });
    app.appendChild(scoreLine);

    var score = 0, tries = 0;
    var solvedCount = 0;

    function updateScoreLine() {
      var pct = tries > 0 ? Math.round((score / tries) * 100) : 0;
      scoreLine.textContent = tries > 0
        ? "Score: " + score + " / " + tries + " (" + pct + "%)"
        : "Listen, then choose the word you heard for each sentence.";
    }
    updateScoreLine();

    exercise.questions.forEach(function (q, qIndex) {
      var solved = false;
      var card = el("div", { class: "panel question-card" });
      var num = el("span", { class: "q-num", text: String(qIndex + 1) });
      card.appendChild(num);

      var audio = el("audio", {
        controls: "controls",
        preload: "none",
        src: q.audio + ".mp3",
      });
      card.appendChild(audio);

      var wordRow = el("div", { class: "word-row" });
      var feedback = el("div", { class: "feedback" });

      q.words.forEach(function (word, wIndex) {
        var btn = el("button", { class: "word-btn", text: word, type: "button" });
        btn.addEventListener("click", function () {
          if (!solved) {
            tries++;
          }
          if (wIndex === q.correct) {
            btn.classList.add("chosen-right");
            if (!solved) {
              solved = true;
              score++;
              solvedCount++;
              card.classList.add("solved");
            }
            feedback.className = "feedback right";
            feedback.innerHTML = "";
            feedback.appendChild(document.createTextNode("Correct! "));
            feedback.appendChild(buildSentence(q));
            if (solvedCount === exercise.questions.length) {
              appendFinishedControls();
            }
          } else {
            btn.classList.add("chosen-wrong");
            feedback.className = "feedback wrong";
            var hint = q.hints && q.hints[wIndex];
            feedback.textContent = hint ? "Not quite: " + hint : "Not quite — try again.";
          }
          updateScoreLine();
        });
        wordRow.appendChild(btn);
      });

      card.appendChild(wordRow);
      card.appendChild(feedback);
      app.appendChild(card);
    });

    var navDiv = el("div", { class: "nav-buttons" });
    app.appendChild(navDiv);

    function appendFinishedControls() {
      navDiv.innerHTML = "";
      navDiv.appendChild(el("div", { text: "All done for this exercise!" }));
      if (exercise.next) {
        var nextBtn = el("button", { class: "nav", type: "button", text: "Next exercise" });
        nextBtn.addEventListener("click", function () { window.location.href = exercise.next; });
        navDiv.appendChild(nextBtn);
      }
      var homeBtn = el("button", { class: "nav secondary", type: "button", text: "Back to contents" });
      homeBtn.addEventListener("click", function () { window.location.href = "index.html"; });
      navDiv.appendChild(homeBtn);
    }

    var footer = el("footer");
    footer.innerHTML =
      "Pages created by John Higgins. The voices are those of John Higgins, Ann Robinson, Anne Lawrie, and Friedl Burns. " +
      "&middot; <a href=\"index.html\">Back to contents</a> &middot; <a href=\"../index.html\">Higgins home page</a>";
    app.appendChild(footer);
  }

  window.HiddenWordEngine = { render: render };
})();
