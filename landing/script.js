// Film picker: swaps which pre-rendered look is visible. Descriptions match src/lib/film/looks.json.
const FILM_DESCRIPTIONS = {
  original: 'Clean, true-to-life colour. Crisp tones that keep the moment exactly as it was.',
  disposable: 'Warm, punchy colour with green-tinted shadows and grain, like a drugstore film camera.',
  polaroid: 'Soft, faded instant-film tones with creamy highlights and cool shadows.',
  pinhole: 'Moody, muted colour with deep contrast and a heavy dreamy vignette.',
  digicam: 'Bright, crisp point-and-shoot colour with cool tones and a flash-lit pop, like a 2000s digital camera.',
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
    if (pauseButton) pauseButton.hidden = true;
  }

  steps.forEach((step, i) => {
    step.addEventListener('click', () => {
      stopForGood();
      show(i);
    });
  });

  if (isStopped) return;

  if (pauseButton) {
    pauseButton.hidden = false;
    pauseButton.addEventListener('click', stopForGood);
  }

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) startTimer();
    else stopTimer();
  }, { threshold: 0.4 }).observe(tour);
}

// Pricing: pick how many people, optionally add unlimited shots, and the price follows.
// Prices mirror the passes in supabase/migrations/20261115000001_participant_pricing.sql.
const PRICE_ROLL_MS = 320;
const pesoFormat = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });

function formatPlanPrice(amount) {
  return amount === 0 ? 'Free' : `₱${pesoFormat.format(amount)}`;
}

function setUpPlanPicker() {
  const picker = document.querySelector('[data-plan-picker]');
  if (!picker) return;
  const options = picker.querySelector('[data-plan-options]');
  const indicator = options.querySelector('.plan-picker__indicator');
  const radios = options.querySelectorAll('input[type="radio"]');
  const addon = picker.querySelector('[data-addon-price]');
  const price = picker.querySelector('[data-plan-price]');
  const peopleLabels = picker.querySelectorAll('[data-plan-people]');
  const shots = picker.querySelector('[data-plan-shots]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function chosen() {
    return options.querySelector('input[type="radio"]:checked');
  }

  function moveIndicator() {
    const target = chosen().nextElementSibling;
    indicator.style.width = `${target.offsetWidth}px`;
    indicator.style.transform = `translateX(${target.offsetLeft + target.parentElement.offsetLeft}px)`;
  }

  function update() {
    const radio = chosen();
    const total = Number(radio.dataset.price) + (addon.checked ? Number(addon.dataset.addonPrice) : 0);
    const text = formatPlanPrice(total);

    peopleLabels.forEach((label) => { label.textContent = radio.value; });
    shots.textContent = addon.checked ? 'Unlimited shots per person' : '25 shots per person';
    moveIndicator();

    if (price.textContent === text) return;
    price.textContent = text;
    if (!prefersReducedMotion) {
      price.animate(
        [{ opacity: 0, transform: 'translateY(0.4em)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: PRICE_ROLL_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
    }
  }

  options.classList.add('is-enhanced');
  radios.forEach((radio) => radio.addEventListener('change', update));
  addon.addEventListener('change', update);
  new ResizeObserver(moveIndicator).observe(options);

  // Place the frame first, then let it slide on later changes.
  update();
  requestAnimationFrame(() => options.classList.add('is-ready'));
}

document.addEventListener('DOMContentLoaded', () => {
  setUpFilmPicker();
  setUpTour();
  setUpPlanPicker();
});
