// Film picker: swaps which pre-rendered look is visible. Descriptions match src/lib/film/looks.json.
const FILM_DESCRIPTIONS = {
  original: 'Clean, true-to-life colour. Crisp tones that keep the moment exactly as it was.',
  disposable: 'Warm, punchy colour with green-tinted shadows and grain, like a drugstore film camera.',
  polaroid: 'Soft, faded instant-film tones with creamy highlights and cool shadows.',
  pinhole: 'Moody, muted colour with deep contrast and a heavy dreamy vignette.',
};

const TOUR_STEP_MS = 3800;

function setUpFilmPicker() {
  const chips = document.querySelectorAll('[data-film]');
  const photos = document.querySelectorAll('[data-film-photo]');
  const description = document.getElementById('film-desc');
  const filmName = document.querySelector('[data-film-name]');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const film = chip.dataset.film;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      photos.forEach((p) => p.classList.toggle('is-active', p.dataset.filmPhoto === film));
      description.textContent = FILM_DESCRIPTIONS[film];
      if (filmName) filmName.textContent = chip.textContent;
    });
  });
}

// Hero tour: the phone steps through a guest's night. Advances on its own only while on screen,
// never with reduced motion, and stops for good once someone picks a step or pauses it.
function setUpTour() {
  const tour = document.querySelector('[data-tour]');
  if (!tour) return;
  const screens = tour.querySelectorAll('[data-tour-screen]');
  const steps = tour.querySelectorAll('[data-tour-step]');
  const pauseButton = tour.querySelector('[data-tour-pause]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let timer = null;
  let isStopped = prefersReducedMotion;

  function show(index) {
    current = index;
    screens.forEach((s, i) => s.classList.toggle('is-active', i === index));
    steps.forEach((s, i) => s.setAttribute('aria-pressed', String(i === index)));
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  function startTimer() {
    if (isStopped || timer) return;
    timer = setInterval(() => show((current + 1) % screens.length), TOUR_STEP_MS);
  }

  function stopForGood() {
    isStopped = true;
    stopTimer();
    pauseButton.hidden = true;
  }

  steps.forEach((step, i) => {
    step.addEventListener('click', () => {
      stopForGood();
      show(i);
    });
  });

  if (isStopped) return;

  pauseButton.hidden = false;
  pauseButton.addEventListener('click', stopForGood);

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) startTimer();
    else stopTimer();
  }, { threshold: 0.4 }).observe(tour);
}

document.addEventListener('DOMContentLoaded', () => {
  setUpFilmPicker();
  setUpTour();
});
