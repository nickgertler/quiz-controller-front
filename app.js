// Replace with your Heroku server URL:
const API_BASE = 'https://quiz-controller-api-f86ea1ce8663.herokuapp.com';

// Screens
const screenSession  = document.getElementById('screenSession');
const screenStart    = document.getElementById('screenStart');
const screenQuestion = document.getElementById('screenQuestion');
const screenResults  = document.getElementById('screenResults');
const screenCredits  = document.getElementById('screenCredits');

// Controls
const sessionNameInput = document.getElementById('sessionNameInput');
const createSessionBtn = document.getElementById('createSessionBtn');

const sessionLabelStart= document.getElementById('sessionLabelStart');
const startQuizBtn     = document.getElementById('startQuizBtn');

const sessionLabelQ    = document.getElementById('sessionLabelQ');
const questionTitle    = document.getElementById('questionTitle');
const answersBox       = document.getElementById('answersBox');
const showResultsBtn   = document.getElementById('showResultsBtn');

const sessionLabelR    = document.getElementById('sessionLabelR');
const resultsBox       = document.getElementById('resultsBox');
const nextQuestionBtn  = document.getElementById('nextQuestionBtn');

// State
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

// On page load, go to session screen
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
    // Create session => sets Current Question=0 if it doesn't exist
    await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName })
    });
    // Then load session data
    await loadSessionData();
    // If currentQuestion=0 => show screenStart
    if (currentQuestion === 0) {
      sessionLabelStart.textContent = sessionName;
      showScreen('start');
    } else {
      // Otherwise, show question
      showQuestionScreen();
    }
  } catch (err) {
    console.error('Error creating/loading session:', err);
    alert('Could not create/load session. See console.');
  }
});

// 2) Load session data => GET /session/:sessionName
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
    // POST /session/:sessionName/next => increments question from 0 to 1
    const resp = await fetch(`${API_BASE}/session/${sessionName}/next`, { method: 'POST' });
    const data = await resp.json();
    if (data.error) {
      throw new Error(data.error);
    }
    currentQuestion = data.newCurrentQuestion;
    // Now load the new question
    await showQuestionScreen();
  } catch (err) {
    console.error('Error starting quiz:', err);
    alert('Unable to start the quiz. Check console.');
  }
});

// 4) Show question screen => fetch from /question/:num
async function showQuestionScreen() {
  sessionLabelQ.textContent = sessionName;

  // If we somehow still have question=0 => show start screen
  if (currentQuestion === 0) {
    sessionLabelStart.textContent = sessionName;
    showScreen('start');
    return;
  }

  // Attempt to fetch the question
  try {
    const resp = await fetch(`${API_BASE}/question/${currentQuestion}`);
    if (resp.status === 404) {
      // No question => quiz ended
      showScreen('credits');
      return;
    }
    const qData = await resp.json();
    if (qData.error) {
      showScreen('credits');
      return;
    }

    questionTitle.innerText = `Q${qData.questionNumber}: ${qData.question}`;
    const arr = [];
    for (let i = 1; i <= 4; i++) {
      if (qData.answers[i]) {
        arr.push(`<div>Answer ${i}: ${qData.answers[i]}</div>`);
      }
    }
    answersBox.innerHTML = arr.join('');

    showScreen('question');
  } catch (err) {
    console.error('Error fetching question:', err);
    showScreen('credits');
  }
}

// 5) Show results => GET /results/:num
showResultsBtn.addEventListener('click', async () => {
  sessionLabelR.textContent = sessionName;
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
    // Build simple results table
    let html = `<h3>Q${data.questionNumber}: ${data.question}</h3>`;
    html += `<p><strong>Correct Answer:</strong> ${data.correctAnswer}</p>`;
    html += `<table style=\"width:100%; border-collapse: collapse;\">`;
    html += `<thead><tr><th>Answer</th><th>Votes</th></tr></thead><tbody>`;
    for (let i = 1; i <= 4; i++) {
      if (!data.answers[i]) continue;
      const highlight = (i.toString() === data.correctAnswer.toString()) ? 'background-color:#d1ffd1;' : '';
      html += `<tr style=\"${highlight}\"><td>Answer ${i}: ${data.answers[i]}</td><td>${data.votes[i] || 0}</td></tr>`;
    }
    html += `</tbody></table>`;
    resultsBox.innerHTML = html;

    showScreen('results');
  } catch (err) {
    console.error('Error fetching results:', err);
    showScreen('credits');
  }
});

// 6) Next Question => increments question # again
nextQuestionBtn.addEventListener('click', async () => {
  try {
    const resp = await fetch(`${API_BASE}/session/${sessionName}/next`, { method: 'POST' });
    const data = await resp.json();
    if (data.error) {
      throw new Error(data.error);
    }
    currentQuestion = data.newCurrentQuestion;
    // If we moved beyond the last question => show credits
    await showQuestionScreen();
  } catch (err) {
    console.error('Error going to next question:', err);
    showScreen('credits');
  }
});
