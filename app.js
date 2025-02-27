// Replace with your Heroku server URL:
const API_BASE = 'https://quiz-controller-api-f86ea1ce8663.herokuapp.com';

// Footer for session name
const sessionFooter = document.getElementById('sessionFooter');

// Screens
const screenSession   = document.getElementById('screenSession');
const screenStart     = document.getElementById('screenStart');
const screenQuestion  = document.getElementById('screenQuestion');
const screenResults   = document.getElementById('screenResults');
const screenCredits   = document.getElementById('screenCredits');

// Controls
const sessionNameInput= document.getElementById('sessionNameInput');
const createSessionBtn= document.getElementById('createSessionBtn');
const startQuizBtn    = document.getElementById('startQuizBtn');

// Question / Results
const questionTitle   = document.getElementById('questionTitle');
const answersBox      = document.getElementById('answersBox');
const showResultsBtn  = document.getElementById('showResultsBtn');
const resultsBox      = document.getElementById('resultsBox');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');

let sessionName = '';
let currentQuestion = 0; // numeric

// Show/hide screens
function showScreen(name) {
  screenSession.classList.add('hidden');
  screenStart.classList.add('hidden');
  screenQuestion.classList.add('hidden');
  screenResults.classList.add('hidden');
  screenCredits.classList.add('hidden');

  if (name === 'session')  screenSession.classList.remove('hidden');
  if (name === 'start')    screenStart.classList.remove('hidden');
  if (name === 'question') screenQuestion.classList.remove('hidden');
  if (name === 'results')  screenResults.classList.remove('hidden');
  if (name === 'credits')  screenCredits.classList.remove('hidden');
}

// On load
document.addEventListener('DOMContentLoaded', () => {
  showScreen('session');
});

// 1) Create or load session
createSessionBtn.addEventListener('click', async () => {
  const entered = sessionNameInput.value.trim();
  if (!entered) {
    alert('Please enter a session name');
    return;
  }
  sessionName = entered;
  try {
    // Create session => sets Current Question=0 if not existing
    await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName })
    });
    await loadSessionData();
    // If currentQuestion=0 => show Start screen
    if (currentQuestion === 0) {
      // Put session name in the start screen session ID prompt
      sessionIDPrompt.textContent = `Session: ${sessionName}`;
      showScreen('start');
    } else {
      // Otherwise, jump to the question screen
      // Put session name in the start screen session ID prompt
      sessionFooter.textContent = `Session: ${sessionName}`;
      showQuestionScreen();
    }
  } catch (err) {
    console.error('Error creating/loading session:', err);
    alert('Could not create/load session. See console.');
  }
});

// 2) loadSessionData => get Current Question
async function loadSessionData() {
  const resp = await fetch(`${API_BASE}/session/${sessionName}`);
  const data = await resp.json();
  if (data.error) {
    throw new Error(data.error);
  }
  currentQuestion = data.fields['Current Question'] || 0;
}

// 3) Start quiz => sets question from 0 to 1
startQuizBtn.addEventListener('click', async () => {
  try {
    const resp = await fetch(`${API_BASE}/session/${sessionName}/next`, { method: 'POST' });
    const json = await resp.json();
    if (json.error) {
      throw new Error(json.error);
    }
    currentQuestion = json.newCurrentQuestion;
    showQuestionScreen();
  } catch (err) {
    console.error('Error starting quiz:', err);
    alert('Unable to start quiz. Check console.');
  }
});

// 4) Show question => fetch /question/:num
async function showQuestionScreen() {
  if (currentQuestion === 0) {
    showScreen('start');
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/question/${currentQuestion}`);
    if (resp.status === 404) {
      showScreen('credits');
      return;
    }
    const qData = await resp.json();
    if (qData.error) {
      showScreen('credits');
      return;
    }

    questionTitle.textContent = `Q${qData.questionNumber}: ${qData.question}`;
    answersBox.innerHTML = '';

    // Show each answer in a box
    for (let i = 1; i <= 4; i++) {
      if (qData.answers[i]) {
        const div = document.createElement('div');
        div.className = 'answer-box';
        div.textContent = `${qData.answers[i]}`;
        answersBox.appendChild(div);
      }
    }
    // Put session name in the small footer and start screen session ID prompt
    sessionFooter.textContent = `Session: ${sessionName}`;
    showScreen('question');
  } catch (err) {
    console.error('Error fetching question:', err);
    showScreen('credits');
  }
}

// 5) Show results => calls /results/:num
showResultsBtn.addEventListener('click', async () => {
  try {
    const resp = await fetch(`${API_BASE}/results/${currentQuestion}`);
    if (resp.status === 404) {
      showScreen('credits');
      return;
    }
    const data = await resp.json();
    if (data.error) {
      showScreen('credits');
      return;
    }

    // Build answer boxes with flex row for text vs. votes
    let html = `<h1 id="questionTitle" class="question-heading">Q${data.questionNumber}: ${data.question}</h1>`;
    html += `<div class=\"answers-container\">`;

    for (let i = 1; i <= 4; i++) {
      if (!data.answers[i]) continue;
      // highlight correct if needed
      const highlight = (i.toString() === data.correctAnswer.toString()) ? 'background-color:#c8ffca;' : '';
      html += `
        <div class="result-box" style="${highlight}">
          <div class="result-row">
            <div class="answer-text">${data.answers[i]}</div>
            <div class="vote-count">${data.votes[i] || 0} votes</div>
          </div>
        </div>`;
    }
    html += `</div>`;

    resultsBox.innerHTML = html;
    showScreen('results');
  } catch (err) {
    console.error('Error fetching results:', err);
    showScreen('credits');
  }
});

// 6) Next Question => increments question number
nextQuestionBtn.addEventListener('click', async () => {
  try {
    const resp = await fetch(`${API_BASE}/session/${sessionName}/next`, { method: 'POST' });
    const json = await resp.json();
    if (json.error) {
      throw new Error(json.error);
    }
    currentQuestion = json.newCurrentQuestion;
    showQuestionScreen();
  } catch (err) {
    console.error('Error going to next question:', err);
    showScreen('credits');
  }
});
