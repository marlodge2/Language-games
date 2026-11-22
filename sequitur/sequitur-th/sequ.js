let phrases = [];
let currentIndex = 0;
let correctCount = 0;
let attemptCount = 0;

function enableStartButton() {
  const select = document.getElementById("story-select");
  document.getElementById("start-button").disabled = !select.value;
}

async function startGame() {
  const select = document.getElementById("story-select");
  const storyFile = select.value;

  try {
    const response = await fetch('./' + storyFile);
    if (!response.ok) throw new Error('Failed to load ' + storyFile);

    const text = await response.text();
    phrases = text.trim().split('\n');

    // First line is the title - use it for display, remove from phrases
    const storyTitle = phrases[0].trim();
    phrases = phrases.slice(1).filter(p => p.trim());

    document.querySelector('#game-screen h2').textContent = storyTitle;

    currentIndex = 0;
    correctCount = 0;
    attemptCount = 0;

    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    renderStory();
    updateScore();
    showOptions();
  } catch (error) {
    console.error('Start game error:', error);
    document.getElementById('options').innerHTML =
      '<strong>เกิดข้อผิดพลาดในการโหลด ' + storyFile +
      ' กรุณาตรวจสอบว่าไฟล์มีอยู่จริง<br><span class="gloss">Error loading ' +
      storyFile + '. Check that the file exists and is accessible.</span></strong>';
  }
}

function renderStory() {
  const box = document.getElementById('story-box');
  box.innerHTML = '';
  for (let i = 0; i < phrases.length; i++) {
    const span = document.createElement('span');
    span.textContent = phrases[i] + ' ';
    if (i <= currentIndex) {
      span.classList.add('revealed');
    }
    box.appendChild(span);
  }
}

function updateScore() {
  // Score display removed per user request
}

// Show end screen when game is complete (normal completion)
function showEndScreen() {
  document.getElementById('instruction').style.display = 'none';
  document.getElementById('game-controls').classList.add('hidden');

  document.getElementById('end-controls').classList.remove('hidden');

  const storyTitle = document.querySelector('#game-screen h2').textContent;
  const finalScore = document.getElementById('options');
  finalScore.innerHTML =
    `<p>คุณเล่นเรื่อง "${storyTitle}" จบแล้ว ตอบถูก ${correctCount} จาก ${attemptCount} ครั้ง` +
    `<br><span class="gloss">You completed "${storyTitle}" with ${correctCount} correct out of ${attemptCount} attempts.</span></p>`;
}

// Show quit options (after Quit button is pressed)
function showQuitOptions() {
  document.getElementById('instruction').style.display = 'none';
  document.getElementById('options').innerHTML = '';

  document.getElementById('end-controls').classList.remove('hidden');
  document.getElementById('game-controls').classList.add('hidden');
}

// Quit button during gameplay
function quitGame() {
  currentIndex = phrases.length - 1;
  renderStory();

  showQuitOptions();
}

// Return to title screen
function quitToTitle() {
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('title-screen').classList.remove('hidden');

  currentIndex = 0;
  correctCount = 0;
  attemptCount = 0;
  phrases = [];

  document.getElementById('end-controls').classList.add('hidden');
  document.getElementById('game-controls').classList.remove('hidden');
  document.getElementById('instruction').style.display = 'block';

  document.getElementById('story-box').innerHTML = '';
  document.getElementById('options').innerHTML = '';

  document.querySelector('#game-screen h2').textContent = 'ชื่อเรื่อง (Story Title)';

  const startBtn = document.getElementById('start-button');
  startBtn.disabled = true;
  startBtn.textContent = 'เริ่มเกม (Start Game)';
}

// Go back to the text games page
function goHome() {
  window.location.href = '../../textgames.html';
}

// Play again - return to title screen to choose new story
function restartGame() {
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('title-screen').classList.remove('hidden');

  currentIndex = 0;
  correctCount = 0;
  attemptCount = 0;
  phrases = [];

  document.getElementById('story-box').innerHTML = '';
  document.getElementById('options').innerHTML = '';
  document.getElementById('end-controls').classList.add('hidden');
  document.getElementById('game-controls').classList.remove('hidden');
  document.getElementById('instruction').style.display = 'block';

  document.querySelector('#game-screen h2').textContent = '';

  const select = document.getElementById('story-select');
  select.value = '';

  const startBtn = document.getElementById('start-button');
  startBtn.disabled = true;
  startBtn.textContent = 'เริ่มเกม (Start Game)';
}

function showOptions(totalChoices = 3) {
  if (currentIndex >= phrases.length - 1) {
    showEndScreen();
    return;
  }

  const correct = phrases[currentIndex + 1];

  const blacklist = new Set([
    phrases[currentIndex],
    correct,
    ...phrases.slice(0, currentIndex + 2)
  ]);

  const pool = phrases.filter(p => p && !blacklist.has(p));
  const maxDistractors = Math.min(totalChoices - 1, pool.length);
  const distractors = [];

  while (distractors.length < maxDistractors && pool.length > 0) {
    const randIndex = Math.floor(Math.random() * pool.length);
    distractors.push(pool.splice(randIndex, 1)[0]);
  }

  const choices = [correct, ...distractors].sort(() => Math.random() - 0.5);
  const container = document.getElementById('options');
  container.innerHTML = '';

  choices.forEach(choice => {
    const div = document.createElement('div');
    div.className = 'choice';
    div.textContent = choice;
    div.onclick = () => handleChoice(div, choice === correct);
    div.onmouseenter = () => div.classList.add('hovered');
    div.onmouseleave = () => div.classList.remove('hovered');
    container.appendChild(div);
  });
}

function handleChoice(element, isCorrect) {
  attemptCount++;
  if (isCorrect) correctCount++;
  updateScore();

  if (!isCorrect) {
    element.classList.add('disabled');
    element.onclick = null;
    return;
  }

  currentIndex++;
  if (currentIndex >= phrases.length - 1) {
    renderStory();
    showEndScreen();
    return;
  }

  renderStory();
  showOptions();
}

function needHelp() {
  const helpBtn = document.getElementById('help-button');
  const helpMsg = document.getElementById('help-message');
  const previousIndex = currentIndex;

  currentIndex = phrases.length - 1;
  renderStory();

  helpBtn.disabled = true;
  if (helpMsg) helpMsg.classList.remove('hidden');

  setTimeout(() => {
    currentIndex = previousIndex;
    renderStory();
    helpBtn.disabled = false;
    if (helpMsg) helpMsg.classList.add('hidden');
  }, 5000);
}
