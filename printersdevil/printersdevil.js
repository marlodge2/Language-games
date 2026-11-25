let wordList = [];
let correctRule = null;
let currentWords = [];
let score = 0;
let attempts = 0;

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function removeVowels(word) {
  return word.split('').filter(ch => !VOWELS.has(ch)).join('');
}

function swapFirstLast(word) {
  if (word.length < 2) return word;
  const chars = word.split('');
  const first = chars[0];
  chars[0] = chars[chars.length - 1];
  chars[chars.length - 1] = first;
  return chars.join('');
}

function reverseWord(word) {
  return word.split('').reverse().join('');
}

// Each rule: a short label for the multiple-choice list, and a function
// that mutilates one word.
const RULES = [
  {
    id: 'reverse',
    label: 'Every word is spelled backwards',
    mutilate: reverseWord,
  },
  {
    id: 'swap',
    label: 'The first and last letters of each word are swapped',
    mutilate: swapFirstLast,
  },
  {
    id: 'vowels',
    label: 'All the vowels have been removed',
    mutilate: removeVowels,
  },
  {
    id: 'even-reverse',
    label: 'Words with an even number of letters are reversed; others are left alone',
    mutilate: word => (word.length % 2 === 0 ? reverseWord(word) : word),
  },
  {
    id: 'vowels-am',
    label:
      'Words starting with a letter from A to M have their vowels removed; others have their first and last letters swapped',
    mutilate: word =>
      word[0] <= 'M' ? removeVowels(word) : swapFirstLast(word),
  },
];

async function loadWords() {
  const response = await fetch('./words.txt');
  const text = await response.text();
  wordList = text
    .trim()
    .split('\n')
    .map(w => w.trim())
    .filter(w => w.length >= 4);
}

function pickRandom(array, count) {
  const pool = array.slice();
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

function newPuzzle() {
  document.getElementById('result-message').textContent = '';
  document.getElementById('restored-words').textContent = '';
  document.getElementById('next-button').classList.add('hidden');

  correctRule = RULES[Math.floor(Math.random() * RULES.length)];
  currentWords = pickRandom(wordList, 5);

  const mutilated = currentWords.map(w => correctRule.mutilate(w));
  document.getElementById('mutilated-words').textContent = mutilated.join('   ');

  const distractors = pickRandom(
    RULES.filter(r => r.id !== correctRule.id),
    3
  );
  const choices = [correctRule, ...distractors].sort(() => Math.random() - 0.5);

  const container = document.getElementById('rule-choices');
  container.innerHTML = '';
  choices.forEach(rule => {
    const div = document.createElement('div');
    div.className = 'rule-choice';
    div.textContent = rule.label;
    div.onclick = () => handleGuess(div, rule);
    div.onmouseenter = () => div.classList.add('hovered');
    div.onmouseleave = () => div.classList.remove('hovered');
    container.appendChild(div);
  });
}

function handleGuess(element, rule) {
  attempts++;
  const isCorrect = rule.id === correctRule.id;
  if (isCorrect) score++;
  updateScoreline();

  // Lock the choices and reveal which one was right
  const container = document.getElementById('rule-choices');
  Array.from(container.children).forEach(child => {
    child.classList.add('disabled');
    child.onclick = null;
    child.onmouseenter = null;
    child.onmouseleave = null;
    child.classList.remove('hovered');
  });
  element.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    Array.from(container.children)
      .find(c => c.textContent === correctRule.label)
      .classList.add('correct');
  }

  document.getElementById('result-message').textContent = isCorrect
    ? 'Correct!'
    : 'Not quite — here is the real rule, and the restored words:';
  document.getElementById('restored-words').textContent = currentWords.join('   ');
  document.getElementById('next-button').classList.remove('hidden');
}

function updateScoreline() {
  document.getElementById('scoreline').textContent =
    `Score: ${score} correct out of ${attempts}`;
}

async function startGame() {
  document.getElementById('start-button').disabled = true;
  document.getElementById('start-button').textContent = 'Loading…';
  await loadWords();
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  newPuzzle();
}
