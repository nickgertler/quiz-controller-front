// Set this to your Heroku API endpoint:
const API_BASE = 'https://quiz-controller-api-f86ea1ce8663.herokuapp.com';

const questionText = document.getElementById('questionText');
const answersDiv = document.getElementById('answers');
const nextBtn = document.getElementById('nextQuestionBtn');

async function loadActiveQuestion() {
  try {
    const res = await fetch(`${API_BASE}/active`);
    const data = await res.json();
    if (data.error) {
      // If no active question, show a placeholder
      questionText.innerText = "No Active Question Found!";
      answersDiv.innerHTML = "";
      return;
    }
    // data.fields should hold the question info
    const fields = data.fields;
    questionText.innerText = fields.Question || "Untitled Question";

    // Show answers 1-4
    const answersHTML = [];
    for (let i = 1; i <= 4; i++) {
      const answerText = fields[`Answer ${i}`] || "";
      if (answerText) {
        answersHTML.push(`<div>Answer ${i}: ${answerText}</div>`);
      }
    }
    answersDiv.innerHTML = answersHTML.join("");
  } catch (err) {
    console.error(err);
    questionText.innerText = "Error Loading Question";
  }
}

// On page load
loadActiveQuestion();

// Next button: call /next to pick the next question, then reload
nextBtn.addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    loadActiveQuestion();
  } catch (err) {
    console.error(err);
  }
});
