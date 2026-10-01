class ScoreHandler {
  constructor() {
    this.score = 0;
    this.maxScore = this.loadMaxScore();
  }

  loadMaxScore() {
    return 0; // psicoZ owns persistence; upstream score remains local to this attempt.
  }

  saveMaxScore() {
    // The album bridge persists only a completed challenge.
  }

  incrementScore() {
    this.score++;

    if (this.score > this.maxScore) {
      this.maxScore = this.score;
      this.saveMaxScore();
    }
  }

  reset() {
    this.score = 0;
  }

  getScore() {
    return this.score;
  }

  getMaxScore() {
    return this.maxScore;
  }
}

export default ScoreHandler;
