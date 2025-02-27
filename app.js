// Replace with your Heroku server URL:
const API_BASE = 'https://quiz-controller-api-f86ea1ce8663.herokuapp.com';

const screenSession    = document.getElementById('screenSession');
const screenController = document.getElementById('screenController');
const screenCredits    = document.getElementById('screenCredits');

const sessionNameInput = document.getElementById('sessionNameInput');
const createSessionBtn = document.getElementById('createSessionBtn');

const sessionLabel     = document.getElementById('sessionLabel');
const questionTitle    = document.getElementById('questionTitle');
const resultsBox       = document.getElementById('resultsBox');

const startQuizBtn     = document.getElementById('startQuizBtn');
const nextQuestionBtn  = document.getElementById('nextQuestionBtn');

// We'll keep track of the session name, plus the current question number
let sessionName = '';
let currentQuestionNumber = 0; // 0 => not started

// Show/hide screens
function showScreen(name) {
  screenSession.classList.add('hidden');
  screenController.classList.add('hidden');
  screenCredits.classList.add('hidden');

  if (name === 'session')    screenSession.classList.remove('hidden');
  if (name === 'controller') screenController.classList.remove('hidden');
  if (name === 'credits')    screenCredits.classList.remove('hidden');
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
  showScreen('session');
});

// 1) Create or Load Session
createSessionBtn.addEventListener('click', async () => {
  const entered = sessionNameInput.value.trim();
  if (!entered) {
    alert('Please enter a session name');
    return;
  }
  sessionName = entered;

  // 1A) Attempt to create session by calling POST /session
  // If it already exists, Airtable won't necessarily error, or you might get duplicates
  // so consider searching first. For simplicity, let's just do a create call each time:
  try {
    await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName })
    });
    // Then load the session from the server to see current question
    await loadSessionData();
    sessionLabel.innerText = sessionName;
    showScreen('controller');
    renderController();
  } catch (err) {
    console.error('Error creating session:', err);
    alert('Could not create/load session. Check console.');
  }
});

// 2) Load Session Data
async function loadSessionData() {
  // GET /session/:sessionName to see the current question
  const resp = await fetch(`${API_BASE}/session/${sessionName}`);
  const data = await resp.json();
  if (data.error) {
    throw new Error(data.error);
  }
  currentQuestionNumber = data.fields['Current Question'] || 0;
}

// Show or hide startQuizBtn depending on whether currentQuestionNumber is 0
function renderController() {
  if (currentQuestionNumber === 0) {
    startQuizBtn.classList.remove('hidden');
    nextQuestionBtn.classList.add('hidden');
    questionTitle.innerText = 'Quiz not started yet.';
    resultsBox.innerHTML = '';
  } else {
    startQuizBtn.classList.add('hidden');
    nextQuestionBtn.classList.remove('hidden');
    loadResultsForCurrentQuestion();
  }
}

// 3) Start Quiz => sets question # to 1
startQuizBtn.addEventListener('click', async () => {
  try {
    // If question # = 0, let's move to #1
    await fetch(`${API_BASE}/session/${sessionName}/next`, {
      method: 'POST'
    });
    await loadSessionData();
    renderController();
  } catch (err) {
    console.error('Error starting quiz:', err);
  }
});

// 4) Next Question => increments question #
nextQuestionBtn.addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/session/${sessionName}/next`, {
      method: 'POST'
    });
    await loadSessionData();
    // If we get back a question # that doesn't exist in the Quiz table => end
    // We'll detect that in loadResultsForCurrentQuestion
    renderController();
  } catch (err) {
    console.error('Error moving to next question:', err);
  }
});

// 5) Load and display results for current question
async function loadResultsForCurrentQuestion() {
  // If currentQuestionNumber is 0 => quiz not started
  if (currentQuestionNumber === 0) {
    questionTitle.innerText = 'Quiz not started.';
    resultsBox.innerHTML = '';
    return;
  }

  // We'll call GET /results/:num => returns question text, answers, correct answer, votes
  try {
    const resp = await fetch(`${API_BASE}/results/${currentQuestionNumber}`);
    if (resp.status === 404) {
      // Means no question found => we've passed the last question => show credits
      showScreen('credits');
      return;
    }
    const data = await resp.json();
    if (data.error) {
      // Possibly no question found, or other error
      showScreen('credits');
      return;
    }

    // We have question data
    questionTitle.innerText = `Q${data.questionNumber}: ${data.question}`;
    let html = `<p><strong>Correct Answer:</strong> ${data.correctAnswer}</p>`;
    html += `<table class=\"results-table\" style=\"width:100%; border-collapse: collapse;\">`;
    html += `<thead><tr><th>Answer</th><th>Votes</th></tr></thead><tbody>`;

    for (let i = 1; i <= 4; i++) {
      if (!data.answers[i]) continue;
      const highlight = (i.toString() === data.correctAnswer.toString())
        ? 'background-color: #d1ffd1;'
        : '';
      html += `<tr style=\"${highlight}\"><td>Answer ${i}: ${data.answers[i]}</td><td>${data.votes[i] || 0}</td></tr>`;
    }

    html += `</tbody></table>`;
    resultsBox.innerHTML = html;
  } catch (err) {
    console.error('Error loading results:', err);
    // If we can't load for any reason, just show credits
    showScreen('credits');
  }
}
