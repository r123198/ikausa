// Film picker: swaps which pre-rendered look is visible. Descriptions match src/lib/film/looks.json.
const FILM_DESCRIPTIONS = {
  original: 'Clean, true-to-life colour. Crisp tones that keep the moment exactly as it was.',
  disposable: 'Warm, punchy colour with green-tinted shadows and grain, like a drugstore film camera.',
  polaroid: 'Soft, faded instant-film tones with creamy highlights and cool shadows.',
  pinhole: 'Moody, muted colour with deep contrast and a heavy dreamy vignette.',
};

document.addEventListener('DOMContentLoaded', () => {
  const chips = document.querySelectorAll('[data-film]');
  const photos = document.querySelectorAll('[data-film-photo]');
  const description = document.getElementById('film-desc');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const film = chip.dataset.film;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      photos.forEach((p) => p.classList.toggle('is-active', p.dataset.filmPhoto === film));
      description.textContent = FILM_DESCRIPTIONS[film];
    });
  });
});
