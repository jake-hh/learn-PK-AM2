/**
 * AM2 — Quiz Widget
 * Obsługuje: quizy wielokrotnego wyboru + karty do przypominania (recall)
 */

// ── Recall cards (Teoria — wpisz własną odpowiedź, potem oceń) ──────────────

function initRecallCards() {
  document.querySelectorAll('.recall-card').forEach(card => {
    const showBtn = card.querySelector('.btn-reveal-recall');
    const answer = card.querySelector('.recall-answer');
    const rateBtns = card.querySelectorAll('.rate-btn');

    if (!showBtn || !answer) return;

    showBtn.addEventListener('click', () => {
      answer.classList.add('show');
      showBtn.style.display = 'none';
      rateBtns.forEach(b => b.classList.add('show'));
      updateRecallScore();
    });

    rateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rateBtns.forEach(b => b.disabled = true);
        card.dataset.rated = btn.dataset.rating;
        card.style.borderColor = btn.dataset.rating === 'knew'
          ? '#22c55e' : btn.dataset.rating === 'partial'
          ? '#eab308' : '#ef4444';
        updateRecallScore();
      });
    });
  });
}

function updateRecallScore() {
  const cards = document.querySelectorAll('.recall-card');
  const total = cards.length;
  let knew = 0, partial = 0, no = 0;
  cards.forEach(c => {
    if (c.dataset.rated === 'knew') knew++;
    else if (c.dataset.rated === 'partial') partial++;
    else if (c.dataset.rated === 'no') no++;
  });
  const badge = document.getElementById('recall-score');
  if (badge) badge.textContent = `✓ ${knew} | ~ ${partial} | ✗ ${no} z ${total}`;
}

// ── Multiple-choice quiz ────────────────────────────────────────────────────

class QuizWidget {
  constructor(section) {
    this.section = section;
    this.cards = section.querySelectorAll('.quiz-card');
    this.total = this.cards.length;
    this.correct = 0;
    this.answered = 0;
    this.init();
  }

  init() {
    this.cards.forEach(card => this.initCard(card));
    this.updateScore();
  }

  initCard(card) {
    const correctIdx = parseInt(card.dataset.correct, 10);
    const opts = card.querySelectorAll('.quiz-opt');
    const feedback = card.querySelector('.quiz-feedback');
    let done = false;

    opts.forEach((opt, i) => {
      opt.addEventListener('click', () => {
        if (done) return;
        done = true;
        this.answered++;

        opts.forEach(o => {
          o.classList.add('disabled');
          o.style.pointerEvents = 'none';
        });

        if (i === correctIdx) {
          opt.classList.add('correct');
          this.correct++;
          if (feedback) {
            feedback.classList.add('show', 'correct-fb');
          }
        } else {
          opt.classList.add('wrong');
          opts[correctIdx].classList.add('correct');
          if (feedback) {
            feedback.classList.add('show', 'wrong-fb');
          }
        }

        this.updateScore();
        this.updateProgress();
      });
    });
  }

  updateScore() {
    const badge = this.section.querySelector('.score-badge');
    if (badge) badge.textContent = `${this.correct} / ${this.total}`;
  }

  updateProgress() {
    const fill = document.querySelector('.progress-fill');
    if (!fill) return;
    const allCards = document.querySelectorAll('.quiz-card, .recall-card');
    const allAnswered = document.querySelectorAll('.quiz-opt.disabled, .recall-card[data-rated]');
    const pct = allCards.length ? (allAnswered.length / allCards.length) * 100 : 0;
    fill.style.width = Math.min(pct, 100) + '%';
  }
}

// ── Reveal toggles ──────────────────────────────────────────────────────────

function initReveals() {
  document.querySelectorAll('[data-reveal]').forEach(btn => {
    const targetId = btn.dataset.reveal;
    const target = document.getElementById(targetId);
    if (!target) return;

    btn.addEventListener('click', () => {
      const isOpen = target.classList.toggle('show');
      btn.textContent = isOpen
        ? (btn.dataset.hideText || 'Ukryj')
        : (btn.dataset.showText || btn.dataset.originalText || btn.textContent);
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
    });
  });
}

// ── Scroll progress ─────────────────────────────────────────────────────────

function initScrollProgress() {
  const fill = document.querySelector('.progress-fill');
  if (!fill) return;

  // Only use scroll if there's no quiz
  const hasQuiz = document.querySelector('.quiz-card, .recall-card');
  if (hasQuiz) return;

  document.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.body.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (scrolled / total) * 100 : 0;
    fill.style.width = pct + '%';
  });
}

// ── Highlight current step (steps ol) ──────────────────────────────────────

function initStepHighlight() {
  document.querySelectorAll('.steps ol li').forEach((li, i) => {
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      document.querySelectorAll('.steps ol li').forEach(el => el.style.opacity = '0.5');
      li.style.opacity = '1';
      li.style.background = '#eef2ff';
    });
  });
}

// ── Boot ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initRecallCards();
  initScrollProgress();
  initStepHighlight();

  document.querySelectorAll('.quiz-section').forEach(sec => {
    new QuizWidget(sec);
  });
});
