/* ---------------------------------------------------------------
 * Shared engine for "listening sets" — short audio-clip exercises
 * where the learner hears a sentence and chooses between two answers.
 *
 * Each set page defines a SET object:
 *   {
 *     title:    "Fish and Rice",
 *     subtitle: "a listening exercise — which comes first?",
 *     task:     "Listen to the speaker and decide ...",   (HTML allowed)
 *     labelA:   "FISH &rarr; RICE",   (HTML allowed, e.g. &rarr;)
 *     labelB:   "RICE &rarr; FISH",
 *     items: [
 *       { audio: "fish1.m4a", text: "the sentence spoken", answer: "A" },
 *       ...
 *     ]
 *   }
 * and a page structure matching the IDs used below (see any existing
 * set's index.html for the template to copy). "answer" is "A" or "B",
 * matching whichever of labelA/labelB is correct for that item.
 *
 * To add a new set: copy an existing set folder, replace the audio
 * clips, and edit the SET object passed to ListeningSet.run — no
 * changes to this file are needed.
 * ------------------------------------------------------------- */

(function () {
  "use strict";

  function run(SET) {
    var current = 0;
    var answered = false;
    var results = []; // { answer, chosen, correct }
    var revealTimer = null;

    var player = document.getElementById("player");
    var playBtn = document.getElementById("playBtn");
    var revealBtn = document.getElementById("revealBtn");
    var revealText = document.getElementById("revealText");
    var btnA = document.getElementById("btnA");
    var btnB = document.getElementById("btnB");
    var feedback = document.getElementById("feedback");
    var continueBtn = document.getElementById("continueBtn");
    var progress = document.getElementById("progress");
    var gameScreen = document.getElementById("gameScreen");
    var scoreScreen = document.getElementById("scoreScreen");
    var scoreHeading = document.getElementById("scoreHeading");
    var scoreList = document.getElementById("scoreList");
    var restartBtn = document.getElementById("restartBtn");

    document.getElementById("gameTitle").textContent = SET.title;
    document.getElementById("gameSubtitle").textContent = SET.subtitle;
    document.getElementById("taskText").innerHTML = SET.task;
    btnA.innerHTML = SET.labelA;
    btnB.innerHTML = SET.labelB;
    document.title = SET.title;

    function labelFor(answer) {
      return answer === "A" ? SET.labelA : SET.labelB;
    }

    function loadItem(index) {
      answered = false;
      if (revealTimer) {
        clearTimeout(revealTimer);
        revealTimer = null;
      }
      var item = SET.items[index];
      player.src = item.audio;
      progress.textContent = "Item " + (index + 1) + " of " + SET.items.length;
      revealText.textContent = "";
      feedback.textContent = "";
      feedback.className = "feedback";
      continueBtn.disabled = true;
      btnA.className = "";
      btnB.className = "";
      btnA.disabled = false;
      btnB.disabled = false;
    }

    function showReveal() {
      if (revealTimer) clearTimeout(revealTimer);
      var item = SET.items[current];
      revealText.textContent = item.text;
      revealTimer = setTimeout(function () {
        revealText.textContent = "";
        revealTimer = null;
      }, 3000);
    }

    function choose(choice) {
      if (answered) return;
      answered = true;

      var item = SET.items[current];
      var correct = choice === item.answer;

      results.push({ answer: item.answer, chosen: choice, correct: correct });

      var rightBtn = item.answer === "A" ? btnA : btnB;
      var chosenBtn = choice === "A" ? btnA : btnB;

      if (correct) {
        chosenBtn.classList.add("chosen-right");
        feedback.textContent = "✓ Correct!";
        feedback.className = "feedback right";
      } else {
        chosenBtn.classList.add("chosen-wrong");
        rightBtn.classList.add("chosen-right");
        feedback.textContent = "✗ Not quite — the correct answer was " + stripTags(labelFor(item.answer)) + ".";
        feedback.className = "feedback wrong";
      }

      btnA.disabled = true;
      btnB.disabled = true;
      continueBtn.disabled = false;
    }

    function stripTags(html) {
      var div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent;
    }

    function nextItem() {
      if (!answered) return;
      answered = false;
      continueBtn.disabled = true;
      current++;
      if (current >= SET.items.length) {
        showScore();
      } else {
        loadItem(current);
      }
    }

    function showScore() {
      gameScreen.style.display = "none";
      scoreScreen.style.display = "block";

      var correctCount = results.filter(function (r) { return r.correct; }).length;
      scoreHeading.textContent = "You scored " + correctCount + " out of " + SET.items.length;

      scoreList.innerHTML = "";
      results.forEach(function (r, i) {
        var li = document.createElement("li");
        var mark = r.correct
          ? '<span class="mark-right">✓</span>'
          : '<span class="mark-wrong">✗</span>';
        li.innerHTML = mark + " Item " + (i + 1) + ": correct answer was " + stripTags(labelFor(r.answer));
        scoreList.appendChild(li);
      });
    }

    function restart() {
      current = 0;
      results = [];
      gameScreen.style.display = "block";
      scoreScreen.style.display = "none";
      loadItem(0);
    }

    playBtn.addEventListener("click", function () {
      player.currentTime = 0;
      player.play();
    });
    revealBtn.addEventListener("click", showReveal);
    btnA.addEventListener("click", function () { choose("A"); });
    btnB.addEventListener("click", function () { choose("B"); });
    continueBtn.addEventListener("click", nextItem);
    restartBtn.addEventListener("click", restart);

    loadItem(0);
  }

  window.ListeningSet = { run: run };
})();
