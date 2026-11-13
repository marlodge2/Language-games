/* ---------------------------------------------------------------
 * Thai-instruction version of the shared "Hidden Word" player.
 * Same engine/logic as hidden-engine.js — the exercise content (words,
 * sentences, hints) is deliberately left in English, since that's what's
 * being practised. Only the surrounding instructions/labels are in Thai
 * (with English kept alongside), to make the page usable for a Thai
 * speaker who isn't fluent in English yet.
 *
 * To add a new exercise, see the schema comment in hidden-engine.js —
 * it's identical here. Each exercise file just needs to load this
 * engine instead, e.g. <script src="hidden-engine-th.js"></script>.
 * ------------------------------------------------------------- */

(function () {
  "use strict";

  var TITLE_TH = {
    "Conference Welcome Speech": "คำกล่าวต้อนรับในที่ประชุม",
    "Supermarket Announcement": "ประกาศในซูเปอร์มาร์เก็ต",
    "Weather Forecast": "พยากรณ์อากาศ",
    "Answering Machine Message": "ข้อความในเครื่องตอบรับโทรศัพท์"
  };

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

  // Current page as its own English URL (strip the "-th" before ".html").
  function englishUrl() {
    return "../hidden/" + location.pathname.replace(/-th\.html$/, ".html").split("/").pop();
  }

  function render(exercise) {
    var app = document.getElementById("app");
    document.title = exercise.title + " — การฟังหาคำที่หายไป (Hidden Word Listening)";

    app.appendChild(el("h1", { text: "การฟังหาคำที่หายไป (Hidden Word Listening)" }));
    var titleTH = TITLE_TH[exercise.title];
    app.appendChild(el("div", {
      class: "subtitle",
      text: titleTH ? exercise.title + " — " + titleTH : exercise.title,
    }));

    var langLink = el("div", { style: "text-align:center; margin-bottom:10px;" });
    var a = el("a", { href: englishUrl(), text: "English version (ไม่มีคำแปลไทย)" });
    langLink.appendChild(a);
    app.appendChild(langLink);

    var help = el("details", { class: "help" });
    help.setAttribute("open", "open");
    var summary = el("summary", { text: "วิธีเล่น (How does this work?)" });
    var helpBody = el("div");
    helpBody.innerHTML =
      "<p>ฟังประโยคแล้วเลือกคำที่คุณได้ยิน คุณจะเห็นคำสี่คำ แต่มีเพียงคำเดียวที่ผู้พูดใช้จริง ฟังซ้ำได้บ่อยเท่าที่ต้องการ<br>" +
      "<span class=\"gloss\">Listen to the sentence and choose the word you heard. You'll see four words — only one was really used. Listen as often as you like.</span></p>" +
      "<p>ถ้าตอบถูก คุณจะเห็นประโยคเต็มพร้อมคำที่ถูกต้องไฮไลต์ไว้ ถ้าตอบผิด จะมีคำใบ้สั้นๆ (เป็นภาษาอังกฤษ) บอกว่าตรงจุดนั้นพูดว่าอะไรจริงๆ เพื่อช่วยให้เข้าใจว่าฟังผิดตรงไหน<br>" +
      "<span class=\"gloss\">If you're right, you'll see the whole sentence with the correct word highlighted. If you're wrong, a short hint (in English) shows what was really said there, to help you work out what you misheard.</span></p>" +
      "<p><a href=\"instruct-th.html\">คำอธิบายเต็มพร้อมตัวอย่าง (Full instructions, with an example)</a></p>";
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
        ? "คะแนน (Score): " + score + " / " + tries + " (" + pct + "%)"
        : "ฟังแล้วเลือกคำที่ได้ยินในแต่ละประโยค (Listen, then choose the word you heard.)";
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
        src: "../hidden/" + q.audio + ".mp3",
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
            feedback.appendChild(document.createTextNode("ถูกต้อง! Correct! "));
            feedback.appendChild(buildSentence(q));
            if (solvedCount === exercise.questions.length) {
              appendFinishedControls();
            }
          } else {
            btn.classList.add("chosen-wrong");
            feedback.className = "feedback wrong";
            var hint = q.hints && q.hints[wIndex];
            feedback.textContent = hint
              ? "ยังไม่ใช่ (Not quite): " + hint
              : "ยังไม่ใช่ ลองอีกครั้ง (Not quite — try again.)";
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
      navDiv.appendChild(el("div", { text: "เรียบร้อย! ทำครบแล้ว (All done for this exercise!)" }));
      if (exercise.next) {
        var nextBtn = el("button", { class: "nav", type: "button", text: "แบบฝึกหัดต่อไป (Next exercise)" });
        nextBtn.addEventListener("click", function () {
          window.location.href = exercise.next.replace(/\.html$/, "-th.html");
        });
        navDiv.appendChild(nextBtn);
      }
      var homeBtn = el("button", { class: "nav secondary", type: "button", text: "กลับไปหน้าหลัก (Back to contents)" });
      homeBtn.addEventListener("click", function () { window.location.href = "index-th.html"; });
      navDiv.appendChild(homeBtn);
    }

    var footer = el("footer");
    footer.innerHTML =
      "Pages created by John Higgins. The voices are those of John Higgins, Ann Robinson, Anne Lawrie, and Friedl Burns. " +
      "&middot; <a href=\"index-th.html\">กลับไปหน้าหลัก (Back to contents)</a> &middot; <a href=\"../index.html\">Higgins home page</a>";
    app.appendChild(footer);
  }

  window.HiddenWordEngine = { render: render };
})();
