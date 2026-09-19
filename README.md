# Shadow Spiral

A Vue + TypeScript narrative game following Noah’s original storyline: school, allowance, borrowing, loan-shark debt, debt collection, rooftop robberies, and collapse.

## Run

```sh
npm ci
npm run dev
```

Play from school, or select **Play the final chapter** in the opening screen's personal archive to enter the interactive ending directly. Each memory has two choices. Click, tap, or press **1 / 2**, then continue when ready. The final choice changes the closing reflection on the original story. Replay Memories resets the ending; Restart Life Simulation resets the whole game.

The procedural scenes illustrate the original school, shortage, loan-shark, syndicate, rooftop, and flatline stages. A low-resolution pixel filter adds crisp block pixels to the animation while keeping interface text readable. The interactive ending follows the original six flashback themes; finite actions begin after a choice. The header controls sound, palette, and reduced motion; the initial motion preference follows the system setting. The filter also applies to combat and parkour, before their status labels are drawn. No image or audio assets are downloaded for these scenes.

## Verify

```sh
npm test
npm run build
```

Optional browser regression checks cover both ending paths, keyboard and touch controls, modal handling, replay, reset, and narrow-screen layout. Keep Vite running, install Playwright locally, then run:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run test:ending
```

Alternatively, set `PLAYWRIGHT_MODULE` to an existing Playwright module path and `E2E_BROWSER_CHANNEL=chrome` to use installed Chrome. `E2E_BASE_URL` overrides the default `http://127.0.0.1:5173`.
