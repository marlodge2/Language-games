// True/False age-guessing game for aboutage.html.
// Forked from script.js so trialaboutage.html (which still uses the
// original 4-person script.js) is unaffected by this page's changes.

// ---- Random ages, regenerated fresh each time the page loads -------------
// The three pairs are written as married couples: each couple's ages are
// close together, the three couples are spread across the adult range for
// variety, and one couple (picked at random) shares the exact same age, so
// "is the same age as" occasionally comes up among the sentences.
const ADULT_MIN_AGE = 25;
const ADULT_MAX_AGE = 75;
const COUPLE_MAX_GAP = 6;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffled(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function clampAdultAge(age) {
    return Math.min(ADULT_MAX_AGE, Math.max(ADULT_MIN_AGE, age));
}

function generateAges() {
    while (true) {
        // Three bands spread across the adult range, in random order each
        // run, so it's not always the same couple that ends up oldest.
        const span = ADULT_MAX_AGE - ADULT_MIN_AGE + 1;
        const bandSize = Math.floor(span / 3);
        const sameAgeCouple = randomInt(0, 2); // this couple's ages will match exactly
        const ages = [];
        shuffled([0, 1, 2]).forEach((band, coupleIndex) => {
            const lo = ADULT_MIN_AGE + band * bandSize;
            const hi = band === 2 ? ADULT_MAX_AGE : lo + bandSize - 1;
            const first = randomInt(lo, hi);
            const second = coupleIndex === sameAgeCouple
                ? first
                : clampAdultAge(first + randomInt(-COUPLE_MAX_GAP, COUPLE_MAX_GAP));
            ages.push(first, second);
        });

        let ties = 0;
        for (let i = 0; i < ages.length; i++) {
            for (let j = i + 1; j < ages.length; j++) {
                if (ages[i] === ages[j]) ties++;
            }
        }
        if (ties === 1) return ages;
        // A couple's random gap happened to spill into another couple's
        // band and create an extra coincidence — try again.
    }
}

// Builds every true/false sentence for one ordered pair of people, based on
// the actual age gap: exact ties get "the same age as", small gaps ("a
// little"), big gaps ("a lot" / "much"), and plain older/younger wording is
// always offered alongside whichever qualifier applies.
function buildSentencesForPair(a, b) {
    const trueSentences = [];
    const falseSentences = [];
    const diff = Math.abs(a.age - b.age);

    if (diff === 0) {
        trueSentences.push(`${a.name} is the same age as ${b.name}`);
        falseSentences.push(
            `${a.name} is older than ${b.name}`,
            `${a.name} is younger than ${b.name}`,
            `${a.name} is not the same age as ${b.name}`
        );
        return { trueSentences, falseSentences };
    }

    const older = a.age > b.age ? a : b;
    const younger = a.age > b.age ? b : a;

    trueSentences.push(
        `${older.name} is older than ${younger.name}`,
        `${younger.name} is younger than ${older.name}`
    );
    falseSentences.push(
        `${older.name} is younger than ${younger.name}`,
        `${younger.name} is older than ${older.name}`
    );

    if (diff <= 4) {
        trueSentences.push(
            `${older.name} is a little older than ${younger.name}`,
            `${younger.name} is a little younger than ${older.name}`
        );
        falseSentences.push(
            `${older.name} is a little younger than ${younger.name}`,
            `${younger.name} is a little older than ${older.name}`
        );
    } else if (diff >= 15) {
        ["a lot", "much"].forEach((qualifier) => {
            trueSentences.push(
                `${older.name} is ${qualifier} older than ${younger.name}`,
                `${younger.name} is ${qualifier} younger than ${older.name}`
            );
            falseSentences.push(
                `${older.name} is ${qualifier} younger than ${younger.name}`,
                `${younger.name} is ${qualifier} older than ${older.name}`
            );
        });
    }

    return { trueSentences, falseSentences };
}

let people = [];
let allSentences = [];
let allFalseSentences = [];
let lastSentence = '';

// Picks a fresh random set of couples' ages, updates the table to show them,
// and rebuilds the sentence pools from those ages. Called for the very first
// screen and again every time Play Again returns to it, so each game is
// different.
function buildWorld() {
    const [henryAge, maryAge, richardAge, violetAge, georgeAge, aliceAge] = generateAges();
    people = [
        { name: "Henry", age: henryAge },
        { name: "Mary", age: maryAge },
        { name: "Richard", age: richardAge },
        { name: "Violet", age: violetAge },
        { name: "George", age: georgeAge },
        { name: "Alice", age: aliceAge },
    ];

    people.forEach((p) => {
        const cell = document.getElementById('age' + p.name);
        if (cell) cell.textContent = p.age;
    });

    allSentences = [];
    allFalseSentences = [];
    for (let i = 0; i < people.length; i++) {
        for (let j = i + 1; j < people.length; j++) {
            const { trueSentences, falseSentences } = buildSentencesForPair(people[i], people[j]);
            allSentences.push(...trueSentences);
            allFalseSentences.push(...falseSentences);
        }
    }
    lastSentence = '';
}

function getRandomSentence() {
    let sentence;
    do {
        const randomIndex = Math.floor(Math.random() * allSentences.length);
        sentence = allSentences[randomIndex];
    } while (sentence === lastSentence && allSentences.length > 1);
    lastSentence = sentence;
    return sentence;
}

function getRandomFalseSentence() {
    let sentence;
    do {
        const randomIndex = Math.floor(Math.random() * allFalseSentences.length);
        sentence = allFalseSentences[randomIndex];
    } while (sentence === lastSentence && allFalseSentences.length > 1);
    lastSentence = sentence;
    return sentence;
}

const ROUND_SECONDS = 90;
const QUESTION_BASE_MS = 10000; // never auto-pass sooner than this, however short the text
const MARQUEE_SCROLLAMOUNT = 5; // used for both the timing calc and the marquee's own attribute
const MARQUEE_SCROLLDELAY_MS = 85; // browsers' default marquee tick interval
const MARQUEE_SAFETY_MARGIN = 1.15; // a little slack so it always fully clears the edge

// Measures how wide `text` renders as, using the same font as `referenceElement`.
function measureTextWidth(text, referenceElement) {
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'nowrap';
    span.style.font = window.getComputedStyle(referenceElement).font;
    span.textContent = text;
    document.body.appendChild(span);
    const width = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    return width;
}

// The marquee starts fully off the right edge and must travel until it's
// fully off the left edge, i.e. (container width + text width) pixels.
function questionTimeoutFor(sentence) {
    const containerWidth = questionElement.clientWidth || 560;
    const textWidth = measureTextWidth(`${sentence}.`, questionElement);
    const totalDistance = containerWidth + textWidth;
    const scrollMs = (totalDistance / MARQUEE_SCROLLAMOUNT) * MARQUEE_SCROLLDELAY_MS;
    return Math.max(QUESTION_BASE_MS, scrollMs * MARQUEE_SAFETY_MARGIN);
}

let isCurrentTrue = true;
let gameActive = false;
let timeLeft = ROUND_SECONDS;
let timeUp = false; // 90s reached, but let the sentence on screen finish before ending
let timerInterval = null;
let questionTimeoutId = null;

let rightCount = 0;
let wrongCount = 0;
let passCount = 0;
let truthShown = 0;
let falseShown = 0;

const questionElement = document.getElementById('question');
const startButton = document.getElementById('startButton');
const trueButton = document.getElementById('trueButton');
const falseButton = document.getElementById('falseButton');
const feedbackElement = document.getElementById('feedback');
const scoreElement = document.getElementById('score');
const endGameElement = document.getElementById('endGame');

// Turns a count into "once" / "twice" / "N times" (and "0 times").
function timesPhrase(n) {
    if (n === 1) return 'once';
    if (n === 2) return 'twice';
    return `${n} times`;
}

function displayQuestion() {
    if (!gameActive) return;
    clearTimeout(questionTimeoutId);
    const isTrue = Math.random() < 0.6;
    isCurrentTrue = isTrue;
    if (isTrue) truthShown++; else falseShown++;
    const sentence = isTrue ? getRandomSentence() : getRandomFalseSentence();
    questionElement.innerHTML = `<marquee scrollamount="${MARQUEE_SCROLLAMOUNT}">${sentence}.</marquee>`;
    feedbackElement.textContent = '';
    questionTimeoutId = setTimeout(autoPass, questionTimeoutFor(sentence));
}

function scheduleNextQuestion() {
    setTimeout(() => {
        if (!gameActive) return;
        if (timeUp) endGame();
        else displayQuestion();
    }, 1500);
}

function autoPass() {
    if (!gameActive) return;
    passCount++;
    // No message: the sentence just runs off screen and the next one replaces it
    // — unless time is already up, in which case this was the last one.
    if (timeUp) endGame();
    else displayQuestion();
}

function checkAnswer(isUserSaysTrue) {
    if (!gameActive) return;
    clearTimeout(questionTimeoutId);
    if (isUserSaysTrue === isCurrentTrue) {
        rightCount++;
        feedbackElement.textContent = 'Correct!';
        feedbackElement.style.color = '#1a7a3c';
    } else {
        wrongCount++;
        feedbackElement.textContent = 'Incorrect.';
        feedbackElement.style.color = '#c0392b';
    }
    scheduleNextQuestion();
}

function tick() {
    timeLeft--;
    if (timeLeft <= 0) {
        timeLeft = 0;
        timeUp = true;
        clearInterval(timerInterval);
    }
    scoreElement.textContent = `Time left: ${timeLeft}s`;
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearTimeout(questionTimeoutId);
    trueButton.style.display = 'none';
    falseButton.style.display = 'none';
    questionElement.textContent = '';
    feedbackElement.textContent = '';
    const wrongPhrase = wrongCount === 0
        ? 'did not get any wrong'
        : `wrong ${timesPhrase(wrongCount)}`;
    const passPhrase = passCount === 0
        ? "did not pass any of Gama's guesses"
        : `passed ${timesPhrase(passCount)}`;
    scoreElement.textContent =
        `Gama spoke the truth ${timesPhrase(truthShown)} and lied ${timesPhrase(falseShown)}. ` +
        `You were right ${timesPhrase(rightCount)}, ${wrongPhrase} and ${passPhrase}.`;
    endGameElement.innerHTML = '<button id="playAgain">Play Again</button> <button id="returnHome">Return to Home Page</button>';
    document.getElementById('playAgain').addEventListener('click', playAgain);
    document.getElementById('returnHome').addEventListener('click', returnHome);
}

function startGame() {
    lastSentence = '';
    rightCount = 0;
    wrongCount = 0;
    passCount = 0;
    truthShown = 0;
    falseShown = 0;
    timeLeft = ROUND_SECONDS;
    timeUp = false;
    gameActive = true;
    scoreElement.textContent = `Time left: ${timeLeft}s`;
    feedbackElement.textContent = '';
    endGameElement.innerHTML = '';
    startButton.style.display = 'none';
    trueButton.style.display = 'inline';
    falseButton.style.display = 'inline';
    clearInterval(timerInterval);
    clearTimeout(questionTimeoutId);
    timerInterval = setInterval(tick, 1000);
    displayQuestion();
}

function showStartScreen() {
    gameActive = false;
    timeUp = false;
    clearInterval(timerInterval);
    clearTimeout(questionTimeoutId);
    buildWorld();
    questionElement.textContent = 'Study the names and ages above, then click Start.';
    feedbackElement.textContent = '';
    scoreElement.textContent = '';
    endGameElement.innerHTML = '';
    startButton.style.display = 'inline';
    trueButton.style.display = 'none';
    falseButton.style.display = 'none';
}

function playAgain() {
    showStartScreen();
}

function returnHome() {
    window.location.href = 'https://marlodge.net';
}

trueButton.addEventListener('click', () => checkAnswer(true));
falseButton.addEventListener('click', () => checkAnswer(false));
startButton.addEventListener('click', startGame);

// Wait for the player to study the table and click Start before the round begins.
showStartScreen();
