async function loadResults() {
  if (currentIndex >= questions.length) {
    // If no question left, show credits
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
      // data structure: { questionNumber, question, answers, correctAnswer, votes }
      const { questionNumber, question, answers, correctAnswer, votes } = data;

      let html = `
        <h3>Q${questionNumber}: ${question}</h3>
        <table class="results-table">
          <thead>
            <tr>
              <th>Answer</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (let i = 1; i <= 4; i++) {
        if (!answers[i]) continue; // skip blank answers
        const isCorrect = (i.toString() === correctAnswer.toString());
        // Apply a highlight class if this row is correct
        html += `
          <tr class="${isCorrect ? 'correct-answer' : ''}">
            <td>Answer ${i}: ${answers[i]}</td>
            <td>${votes[i] || 0}</td>
          </tr>
        `;
      }
      html += `
          </tbody>
        </table>
      `;
      resultsBox.innerHTML = html;
    }
  } catch (err) {
    resultsBox.innerHTML = `<p>Error fetching results: ${err}</p>`;
  }

  // Switch to results screen
  showScreen('results');
}
