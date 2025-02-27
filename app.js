// Replace with your Heroku server URL:
const API_BASE = 'https://quiz-controller-api-f86ea1ce8663.herokuapp.com';

const screenSession   = document.getElementById('screenSession');
const screenQuestion  = document.getElementById('screenQuestion');
const screenResults   = document.getElementById('screenResults');
const screenCredits   = document.getElementById('screenCredits');

const sessionNameInput= document.getElementById('sessionNameInput');
const createSessionBtn= document.getElementById('createSessionBtn');

const sessionLabelQ   = document.getElementById('sessionLabelQ');
const sessionLabelR   = document.getElementById('sessionLabelR');

const questionTitle   = document.getElementById('questionTitle');
const answersBox      = document.getElementById('answersBox');
const showResultsBtn  = document.getElementById('showResultsBtn');

const resultsBox      = document.getElementById('resultsBox');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');

// State
let sessionName = '';
let currentQuestion = 0; // numeric

// Show/hide screens
function showScreen(name) {
  screenSession.classList.add('hidden');
  screenQuestion.classList.add('hidden');
  screenResults.classList.add('hidden');
  screenCredits.classList.add('hidden');

  if (name === 'session')  screenSession.classList.remove('hidden');
  if (name === 'question') screenQuestion.classList.remove('hidden');
  if (name === 'results')  screenResults.classList.remove('hidden');
  if (name === 'credits')  screenCredits.classList.remove('hidden');
}

// On load, go to session screen
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
    // Then load session data
    await loadSessionData();
    showQuestionScreen();
  } catch (err) {
    console.error('Error creating/loading session:', err);
    alert('Could not create/load session. See console.');
  }
});

// 2) loadSessionData => get the Current Question from /session/:sessionName
async function loadSessionData() {
  const resp = await fetch(`${API_BASE}/session/${sessionName}`);
  const data = await resp.json();
  if (data.error) {
    throw new Error(data.error);
  }
  currentQuestion = data.fields['Current Question'] || 0;
}

// 3) Show question screen
async function showQuestionScreen() {
  sessionLabelQ.innerText = sessionName;
  // If currentQuestion=0 => quiz not started => show a placeholder
  if (currentQuestion === 0) {
    questionTitle.innerText = 'Quiz not started! Click Next Question to begin.';
    answersBox.innerHTML = '';
    showResultsBtn.disabled = true;
    nextQuestionBtn.style.display = 'inline-block'; // visible on results screen only, but let's hide it for question?
    showScreen('question');
    return;
  }
  // currentQuestion > 0 => fetch the question from /question/:num
  try {
    const resp = await fetch(`${API_BASE}/question/${currentQuestion}`);
    if (resp.status === 404) {
      // We must have gone beyond the last question => show credits
      showScreen('credits');
      return;
    }
    const qData = await resp.json();
    if (qData.error) {
      // Also show credits
      showScreen('credits');
      return;
    }

    questionTitle.innerText = `Q${qData.questionNumber}: ${qData.question}`;
    // Show the answers in a simple list
    const arr = [];
    for (let i = 1; i <= 4; i++) {
      if (qData.answers[i]) {
        arr.push(`<div>Answer ${i}: ${qData.answers[i]}</div>`);
      }
    }
    answersBox.innerHTML = arr.join('');
    showResultsBtn.disabled = false;
    nextQuestionBtn.style.display = 'none'; // We'll show Next question on the results screen
  } catch (err) {
    console.error('Error fetching question:', err);
    showScreen('credits');
  }
  showScreen('question');
}

// 4) Show results screen => calls /results/:currentQuestion
showResultsBtn.addEventListener('click', async () => {
  sessionLabelR.innerText = sessionName;
  try {
    const resp = await fetch(`${API_BASE}/results/${currentQuestion}`);
    if (resp.status === 404) {
      // no question => quiz ended
      showScreen('credits');
      return;
    }
    const data = await resp.json();
    if (data.error) {
      showScreen('credits');
      return;
    }
    // Build results table
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
    nextQuestionBtn.style.display = 'inline-block';
    showScreen('results');
  } catch (err) {
    console.error('Error fetching results:', err);
    showScreen('credits');
  }
});

// 5) Next question => increment question
nextQuestionBtn.addEventListener('click', async () => {
  try {
    // POST /session/:sessionName/next => increments Current Question
    const resp = await fetch(`${API_BASE}/session/${sessionName}/next`, { method: 'POST' });
    const data = await resp.json();
    if (data.error) {
      throw new Error(data.error);
    }
    currentQuestion = data.newCurrentQuestion;
    // load that question
    await showQuestionScreen();
  } catch (err) {
    console.error('Error going next question:', err);
    showScreen('credits');
  }
});
