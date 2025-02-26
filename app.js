// Replace this with your Heroku URL
const API_BASE = 'https://quiz-controller-api-f86ea1ce8663.herokuapp.com';

const screenStart    = document.getElementById('screenStart');
const screenQuestion = document.getElementById('screenQuestion');
const screenResults  = document.getElementById('screenResults');
const screenCredits  = document.getElementById('screenCredits');

const startBtn       = document.getElementById('startBtn');
const showResultsBtn = document.getElementById('showResultsBtn');
const nextBtn        = document.getElementById('nextBtn');

const questionTitle  = document.getElementById('questionTitle');
const answersList    = document.getElementById('answersList');
const resultsBox     = document.getElementById('resultsBox');

// We'll store the full list of questions in an array, sorted by Question Number.
let questions = [];
let currentIndex = 0; // which question (by array index) we're on

// 1) On page load, fetch the question list and show the Start screen
async function init() {
  try {
    const resp = await fetch(`${API_BASE}/questions`);
    questions = await resp.json();
  } catch (err) {
    console.error('Error loading questions:', err);
    alert('Could not load questions from server!');
  }
  // Show the Start screen
  showScreen('start');
}

// 2) Show a specific screen, hide others
function showScreen(screenName) {
  screenStart.classList.add('hidden');
  screenQuestion.classList.add('hidden');
  screenResults.classList.add('hidden');
  screenCredits.classList.add('hidden');

  if (screenName === 'start')    screenStart.classList.remove('hidden');
  if (screenName === 'question') screenQuestion.classList.remove('hidden');
  if (screenName === 'results')  screenResults.classList.remove('hidden');
  if (screenName === 'credits')  screenCredits.classList.remove('hidden');
}

// 3) Load and display the question at `questions[currentIndex]`
function loadQuestion() {
  // If we've run past the last question, show credits
  if (currentIndex >= questions.length) {
    showScreen('credits');
    return;
  }
  const record = questions[currentIndex];
  const fields = record.fields;
  const qNum = fields['Question Number'];
  questionTitle.innerText = `Question ${qNum}: ${fields['Question'] || ''}`;

  // Show the four answers
  answersList.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const answerText = fields[`Answer ${i}`] || '';
    if (answerText) {
      const div = document.createElement('div');
      div.innerText = `Answer ${i}: ${answerText}`;
      answersList.appendChild(div);
    }
  }

  // Switch to question screen
  showScreen('question');
}

// 4) Load results for the current question
async function loadResults() {
  if (currentIndex >= questions.length) {
    // If no question left, go to credits
    showScreen('credits');
    return;
  }
  const record = questions[currentIndex];
  const qNum = record.fields['Question Number'];

  try {
    const resp = await fetch(`${API_BASE}/results/${qNum}`);
    const data = await resp.json();

    if (data.error) {
      resultsBox.innerHTML = `<p>${data.error}</p>`;
    } else {
      const { question, correctAnswer, answers, votes } = data;
      let html = `<p><strong>Q${data.questionNumber}:</strong> ${question}</p>`;
      html += `<p><strong>Correct Answer:</strong> ${correctAnswer}</p>`;
      html += `<ul>`;
      for (let i = 1; i <= 4; i++) {
        const ansText = answers[i] || '';
        if (ansText) {
          html += `<li>Answer ${i}: ${ansText} — Votes: ${votes[i]}</li>`;
        }
      }
      html += `</ul>`;
      resultsBox.innerHTML = html;
    }
  } catch (err) {
    resultsBox.innerHTML = `<p>Error fetching results: ${err}</p>`;
  }

  // Switch to results screen
  showScreen('results');
}

// Button Handlers
startBtn.addEventListener('click', () => {
  currentIndex = 0;
  loadQuestion();
});

showResultsBtn.addEventListener('click', () => {
  loadResults();
});

nextBtn.addEventListener('click', () => {
  // After seeing results, move to the next question
  currentIndex++;
  loadQuestion();
});

// Initialize on page load
init();
