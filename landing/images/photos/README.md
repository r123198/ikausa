# Photos inside the phone mockups

Each number is used in exactly one place on the page, so 18 different photos means nothing repeats.
Replace them all at once with:

```bash
landing/scripts/import-photos.sh ~/path/to/your/photos
```

Best results: photos taken with Ikausa itself at a real event (they already have the film look),
with people in them, and only of guests who agreed to be on the website.

| File | Where it shows |
|---|---|
| 01, 02 | Hero: the two prints beside the phone |
| 03 | Hero phone: roll cover (invite screen and developed roll) |
| 04 | Hero phone: camera viewfinder; also behind the invite sheet in "How it works" |
| 05 – 09 | Hero phone: developed roll grid |
| 10 | "The roll" phone: roll cover (Santos Reunion) |
| 11 – 16 | "The roll" phone: scrolling photo grid |
| 17 | Closing, left phone: wedding invite cover |
| 18 | Closing, right phone: camera viewfinder |

The film-look picker uses its own four files (`images/original-1.webp`, `disposable-1.webp`,
`polaroid-1.webp`, `pinhole-1.webp`, `digicam-1.webp`): the same shot in each look. They are
`assets/films/<look>-sample-1.jpg` from `node scripts/build-film-looks.mjs`, converted with
`cwebp -q 78 -metadata none`.

The current photos come from `assets/images/occasions/` (the app's cover presets).
