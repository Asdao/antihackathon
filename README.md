# Shadow Spiral

A Vue + TypeScript narrative game following Noah’s original storyline: school, allowance, borrowing, loan-shark debt, debt collection, rooftop robberies, and collapse.

## Run

```sh
npm ci
npm run dev
```

Play from school, or select **Play the final chapter** in the opening screen's personal archive to enter the interactive ending directly. Each memory has two choices. Click, tap, or press **1 / 2**, then continue when ready. The final choice changes the closing reflection on the original story. Replay Memories resets the ending; Restart Life Simulation resets the whole game.

The procedural scenes illustrate the original school, shortage, loan-shark, syndicate, rooftop, and flatline stages. A low-resolution pixel filter adds crisp block pixels to the animation while keeping interface text readable. The interactive ending follows the original six flashback themes; finite actions begin after a choice. The header controls sound, palette, and reduced motion; the initial motion preference follows the system setting. The filter also applies to combat and parkour, before their status labels are drawn. No image or audio assets are downloaded for these scenes.

## Combat and sound

The original debt-collection fights take place at the corner grocery, underground gambling den, and warehouse. Watch the opponent's windup, then block and counter during recovery. Punch with **A**, kick with **D**, and hold **S** to guard; the same actions are available on the touch controls. **Space** activates the existing boost mechanic.

Fight animations show anticipation, contact, recoil, and recovery. Sound separates the swing from the impact, with distinct punches, kicks, and blocks and a quiet procedural retro backing track. Adjust **VOL** in the header or mute all sound. Reduced motion removes camera shake and limits ambient animation.

## Verify

```sh
npm test
npm run build
```

Optional browser regression checks cover the ending paths, combat attacks and guard, audio controls, replay, reset, and narrow-screen layouts. Keep Vite running, install Playwright locally, then run:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run test:ending
npm run test:combat
```

Alternatively, set `PLAYWRIGHT_MODULE` to an existing Playwright module path and `E2E_BROWSER_CHANNEL=chrome` to use installed Chrome. `E2E_BASE_URL` overrides the default `http://127.0.0.1:5173`.
