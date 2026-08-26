/**
 * AM2 — Quiz Widget v2.0
 */

// ── Dark mode toggle ────────────────────────────────────────────────────────

function initDarkMode() {
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Przełącz motyw');
  btn.title = 'Przełącz motyw';
  document.body.appendChild(btn);

  const stored  = localStorage.getItem('am2-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark  = stored ? stored === 'dark' : sysDark;

  function setTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('am2-theme', dark ? 'dark' : 'light');
  }
  setTheme(isDark);

  btn.addEventListener('click', () => {
    const nowDark = document.documentElement.dataset.theme === 'dark';
    setTheme(!nowDark);
    btn.style.animation = 'none';
    void btn.offsetWidth;
    btn.style.animation = 'scorePop .35s cubic-bezier(.36,.07,.19,.97)';
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('am2-theme')) setTheme(e.matches);
  });
}

// ── Scroll animations ───────────────────────────────────────────────────────

function initScrollAnimations() {
  const sel = '.definition, .theorem, .example, .practice, .tip, .steps, .quiz-card, .recall-card';
  const targets = document.querySelectorAll(sel);

  targets.forEach(el => {
    el.classList.add('animate-in');
    // Stagger sibling cards
    if (el.classList.contains('quiz-card') || el.classList.contains('recall-card')) {
      const siblings = Array.from(el.parentElement.querySelectorAll('.quiz-card, .recall-card'));
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = `${idx * 0.07}s`;
    }
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(el => observer.observe(el));
}

// ── Recall cards ─────────────────────────────────────────────────────────────

function initRecallCards() {
  document.querySelectorAll('.recall-card').forEach(card => {
    const showBtn  = card.querySelector('.btn-reveal-recall');
    const answer   = card.querySelector('.recall-answer');
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
        const colors = { knew: '#22c55e', partial: '#eab308', no: '#ef4444' };
        card.style.borderColor = colors[btn.dataset.rating];
        updateRecallScore();
        updateProgress();
      });
    });
  });
}

function updateRecallScore() {
  const cards = document.querySelectorAll('.recall-card');
  let knew = 0, partial = 0, no = 0;
  cards.forEach(c => {
    if (c.dataset.rated === 'knew')    knew++;
    else if (c.dataset.rated === 'partial') partial++;
    else if (c.dataset.rated === 'no') no++;
  });
  const badge = document.getElementById('recall-score');
  if (badge) badge.textContent = `✓ ${knew}  ~${partial}  ✗ ${no}  z ${cards.length}`;
}

// ── Multiple-choice quiz ─────────────────────────────────────────────────────

class QuizWidget {
  constructor(section) {
    this.section  = section;
    this.cards    = section.querySelectorAll('.quiz-card');
    this.total    = this.cards.length;
    this.correct  = 0;
    this.answered = 0;
    this.init();
  }

  init() {
    this.cards.forEach(card => this.initCard(card));
    this.updateScore();
  }

  initCard(card) {
    const correctIdx = parseInt(card.dataset.correct, 10);
    const opts       = card.querySelectorAll('.quiz-opt');
    const feedback   = card.querySelector('.quiz-feedback');
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
          if (feedback) feedback.classList.add('show', 'correct-fb');
        } else {
          opt.classList.add('wrong');
          opts[correctIdx].classList.add('correct');
          if (feedback) feedback.classList.add('show', 'wrong-fb');
        }

        this.updateScore();
        updateProgress();
      });
    });
  }

  updateScore() {
    const badge = this.section.querySelector('.score-badge');
    if (!badge) return;
    badge.textContent = `${this.correct} / ${this.total}`;
    badge.classList.remove('score-pop');
    void badge.offsetWidth;
    badge.classList.add('score-pop');
  }
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function updateProgress() {
  const fill = document.querySelector('.progress-fill');
  if (!fill) return;
  const all      = document.querySelectorAll('.quiz-card, .recall-card');
  const answered = document.querySelectorAll('.quiz-opt.disabled, .recall-card[data-rated]');
  const pct = all.length ? (answered.length / all.length) * 100 : 0;
  fill.style.width = Math.min(pct, 100) + '%';
}

function initScrollProgress() {
  const fill = document.querySelector('.progress-fill');
  if (!fill) return;
  if (document.querySelector('.quiz-card, .recall-card')) return; // quiz drives it

  document.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.body.scrollHeight - window.innerHeight;
    fill.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  });
}

// ── Reveal toggles ────────────────────────────────────────────────────────────

function initReveals() {
  document.querySelectorAll('[data-reveal]').forEach(btn => {
    const target = document.getElementById(btn.dataset.reveal);
    if (!target) return;
    if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;

    btn.addEventListener('click', () => {
      const isOpen = target.classList.toggle('show');
      btn.textContent = isOpen
        ? (btn.dataset.hideText || 'Ukryj')
        : (btn.dataset.showText || btn.dataset.originalText);
    });
  });
}

// ── Steps: click-to-highlight ─────────────────────────────────────────────────

function initStepHighlight() {
  document.querySelectorAll('.steps ol li').forEach(li => {
    li.addEventListener('click', () => {
      const isActive = li.classList.contains('active');
      document.querySelectorAll('.steps ol li').forEach(el => el.classList.remove('active'));
      if (!isActive) li.classList.add('active');
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initScrollAnimations();
  initReveals();
  initRecallCards();
  initScrollProgress();
  initStepHighlight();

  document.querySelectorAll('.quiz-section').forEach(sec => new QuizWidget(sec));
});
