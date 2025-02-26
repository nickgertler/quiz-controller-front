// Set this to your Heroku API endpoint:
const API_BASE = 'https://quiz-controller-api-f86ea1ce8663.herokuapp.com';

const screenStart    = document.getElementById('screenStart');
const screenQuestion = document.getElementById('screenQuestion');
const screenResults  = document.getElementById('screenResults');
const screenCredits  = document.getElementById('screenCredits');

const startBtn       = document.getElementById('startBtn');
const seeResultsBtn  = document.getElementById('seeResultsBtn');
const nextQuestionBtn= document.getElementById('nextQuestionBtn');

const questionTitle  = document.getElementById('questionTitle');
const answersList    = document.getElementById('answersList');
const resultsBox     = document.getElementById('resultsBox');

// We'll load all questions up front and keep track of which question index we are on.
let questions = []; // array of Airtable records
let currentIndex = 0; // index in the questions array

async function initQuiz() {
  // 1) Fetch the full list of questions (sorted by question number)
  const resp = await fetch(`${API_BASE}/questions`);
  questions = await resp.json();

  // If no questions found, just show an error message
  if (!questions.length) {
    alert('No quiz questions found.');
    return;
  }

  // Show start screen
  showScreen('start');
}

// Show a given screen by ID
function showScreen(name) {
  // hide all
  screenStart.classList.add('hidden');
  screenQuestion.classList.add('hidden');
  screenResults.classList.add('hidden');
  screenCredits.classList.add('hidden');

  // show the selected
  if (name === 'start') {
    screenStart.classList.remove('hidden');
  } else if (name === 'question') {
    screenQuestion.classList.remove('hidden');
  } else if (name === 'results') {
    screenResults.classList.remove('hidden');
  } else if (name === 'credits') {
    screenCredits.classList.remove('hidden');
  }
}

// Display a particular question in the question screen
async function loadQuestion(index) {
  const record = questions[index];
  if (!record) {
    // If we run out of questions, go to credits
    showScreen('credits');
    return;
  }

  const qNum = record.fields['Question Number'];
  // Optionally fetch the question details from the server:
  // (But we already have it in 'record.fields', so you might skip this extra call.)
  // const questionRes = await fetch(`${API_BASE}/question/${qNum}`);
  // const questionData = await questionRes.json();

  // For brevity, let's use the data we already have in record.fields
  const fields = record.fields;
  questionTitle.innerText = `Q${fields['Question Number']}: ${fields['Question']}`;
  
  // Show answers 1-4
  answersList.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const text = fields[`Answer ${i}`] || '';
    if (text) {
      const div = document.createElement('div');
      div.innerText = `Answer ${i}: ${text}`;
      answersList.appendChild(div);
    }
  }

  showScreen('question');
}

// Display results for a particular question
async function loadResults(index) {
  const record = questions[index];
  if (!record) {
    // If no record, show credits
    showScreen('credits');
    return;
  }

  const qNum = record.fields['Question Number'];

  // Hit /results/:num to get aggregated results
  const resp = await fetch(`${API_BASE}/results/${qNum}`);
  const data = await resp.json();
  if (data.error) {
    resultsBox.innerHTML = `<p>${data.error}</p>`;
  } else {
    // Build a small HTML to show the question, answers, correct answer, and vote counts
    let html = `<h3>Q${data.questionNumber}: ${data.question}</h3>`;
    html += `<p><b>Correct Answer:</b> ${data.correctAnswer}</p>`;
    html += `<ul>`;
    for (let i = 1; i <= 4; i++) {
      if (data.answers[i]) {
        html += `<li>Answer ${i}: ${data.answers[i]} — Votes: ${data.results[i]}</li>`;
      }
    }
    html += `</ul>`;
    resultsBox.innerHTML = html;
  }

  showScreen('results');
}

// Button events
startBtn.addEventListener('click', () => {
  currentIndex = 0;
  loadQuestion(currentIndex);
});

seeResultsBtn.addEventListener('click', () => {
  loadResults(currentIndex);
});

nextQuestionBtn.addEventListener('click', () => {
  currentIndex++;
  if (currentIndex < questions.length) {
    loadQuestion(currentIndex);
  } else {
    showScreen('credits'); 
  }
});

// On page load, initialize
initQuiz();
