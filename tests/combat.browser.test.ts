// Optional UI checks: start Vite, then run npm run test:combat.
// PLAYWRIGHT_MODULE and E2E_BROWSER_CHANNEL can select an existing Playwright/Chrome install.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import type { Page } from 'playwright';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const launchOptions = { headless: true, channel: process.env.E2E_BROWSER_CHANNEL };

async function enterFirstFight(page: Page) {
  await page.goto(baseUrl);
  for (const name of [
    /^Take it/i, /^Buy more with allowance/i, /^Keep taking it/i, /^No \(Seek street cash\)/i,
    /^Take predatory loan/i, /^Borrow more to cover interest/i, /^Ask loan shark for more credit/i,
    /^Join syndicate to work off debt/i, /^Fight the Shopkeeper/i,
  ]) await page.getByRole('button', { name }).click();
  await page.getByRole('region', { name: 'Debt collection fight' }).waitFor();
}

async function health(page: Page, label: string) {
  return Number(await page.getByRole('meter', { name: label, exact: true }).getAttribute('aria-valuenow'));
}

async function waitForHealthBelow(page: Page, label: string, previous: number) {
  await page.waitForFunction(({ name, value }) => {
    const meter = [...document.querySelectorAll('[role="meter"]')].find((element) => element.getAttribute('aria-label') === name);
    return meter && Number(meter.getAttribute('aria-valuenow')) < value;
  }, { name: label, value: previous });
}

test('attacks, held guard and cancellation work; surrender exits once without delayed navigation', async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors: string[] = [];
    page.on('pageerror', (error: Error) => errors.push(error.message));
    await enterFirstFight(page);
    if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.E2E_SCREENSHOT_DIR, 'shadow-spiral-combat.png'), fullPage: true });
    const enemyMeter = page.getByRole('meter').last();
    const enemyLabel = (await enemyMeter.getAttribute('aria-label'))!;
    const enemyBefore = await health(page, enemyLabel);
    const punch = page.getByRole('button', { name: /^Punch/ });
    const block = page.getByRole('button', { name: /^Block/ });
    await punch.click();
    await waitForHealthBelow(page, enemyLabel, enemyBefore);
    await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('.controls-panel button')?.disabled);

    const beforeGuard = await health(page, 'Your health');
    await page.keyboard.down('s');
    assert.equal(await block.getAttribute('aria-pressed'), 'true');
    await waitForHealthBelow(page, 'Your health', beforeGuard);
    const guardedDamage = beforeGuard - await health(page, 'Your health');
    assert.equal(await block.getAttribute('aria-pressed'), 'true', 'Taking a blocked hit must preserve a held guard');
    await page.keyboard.up('s');
    assert.equal(await block.getAttribute('aria-pressed'), 'false');

    const beforeOpenHit = await health(page, 'Your health');
    await waitForHealthBelow(page, 'Your health', beforeOpenHit);
    const openDamage = beforeOpenHit - await health(page, 'Your health');
    assert.ok(openDamage > guardedDamage, 'Holding guard must reduce incoming damage');
    await punch.waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('.controls-panel button')?.disabled);

    const box = (await block.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    assert.equal(await block.getAttribute('aria-pressed'), 'true');
    await block.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', isPrimary: true });
    assert.equal(await block.getAttribute('aria-pressed'), 'false', 'Interrupted touch or mouse gestures must release guard');
    await page.mouse.up();

    await page.keyboard.down('s');
    assert.equal(await block.getAttribute('aria-pressed'), 'true');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await block.getAttribute('aria-pressed'), 'false', 'Leaving the window must release guard');
    await page.keyboard.up('s');

    await page.getByRole('button', { name: /^Surrender/i }).click();
    await page.getByRole('button', { name: /ENTER THIEVES STAGE/ }).click();
    await page.getByRole('heading', { name: 'DUMPED IN ALLEY', exact: true }).waitFor();
    assert.equal(await page.getByText('Lost combat! Beaten and cast into the street.', { exact: true }).count(), 1);
    await page.getByRole('button', { name: /^Stumble into the night/i }).click();
    await page.getByRole('heading', { name: 'STREET THEFT', exact: true }).waitFor();
    await page.waitForTimeout(1300);
    assert.equal(await page.getByRole('heading', { name: 'STREET THEFT', exact: true }).count(), 1, 'Exited combat must not schedule another outcome later');
    assert.equal(await page.getByText('Lost combat! Beaten and cast into the street.', { exact: true }).count(), 1);
    assert.equal(await page.locator('.arena-canvas').count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('winning the first fight starts the next opponent with fresh combat state', async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await enterFirstFight(page);
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await page.getByRole('button', { name: /COLLECT EARNINGS/ }).count()) break;
      await page.getByRole('button', { name: /^Kick/ }).click();
      await page.waitForFunction(() => {
        const kick = document.querySelector<HTMLButtonElement>('button[aria-label="Kick [D]"]');
        return !!document.querySelector('.battle-overlay') || (kick && !kick.disabled);
      });
    }
    await page.getByRole('button', { name: /COLLECT EARNINGS/ }).click();
    await page.getByRole('button', { name: /^Fight the Gambler/i }).click();
    await page.getByRole('region', { name: 'Debt collection fight' }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Block/ }).getAttribute('aria-pressed'), 'false');
    for (const meter of await page.getByRole('meter').all()) {
      assert.equal(await meter.getAttribute('aria-valuenow'), await meter.getAttribute('aria-valuemax'), 'Each fighter must begin the new encounter at full health');
    }
    assert.equal(await page.locator('.battle-overlay').count(), 0);
    const opponent = page.getByRole('meter').last();
    const label = (await opponent.getAttribute('aria-label'))!;
    const before = await health(page, label);
    await page.getByRole('button', { name: /^Punch/ }).click();
    await waitForHealthBelow(page, label, before);
  } finally {
    await browser.close();
  }
});

test('volume and mute controls change the real master audio output', async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.addInitScript(() => {
      const outputs: GainNode[] = [];
      Object.defineProperty(window, '__combatAudioOutputs', { value: outputs });
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function(destination: AudioNode | AudioParam, ...ports: number[]) {
        if (destination instanceof AudioDestinationNode && this instanceof GainNode) outputs.push(this);
        return Reflect.apply(connect, this, [destination, ...ports]);
      };
    });
    await enterFirstFight(page);
    const slider = page.getByRole('slider', { name: 'Sound volume' });
    await slider.focus();
    await page.keyboard.press('Home');
    for (let step = 0; step < 4; step++) await page.keyboard.press('ArrowRight');
    const sliderValue = await slider.inputValue();
    const sliderMaximum = Number(await slider.getAttribute('max'));
    const volume = Number(sliderValue) / sliderMaximum;
    assert.ok(volume > 0 && volume < 1);
    await page.waitForFunction(() => {
      const outputs = (window as unknown as { __combatAudioOutputs: GainNode[] }).__combatAudioOutputs;
      return outputs.length > 0 && outputs.every((node) => node.gain.value > 0);
    });
    const selectedGains = await page.evaluate(() => (window as unknown as { __combatAudioOutputs: GainNode[] }).__combatAudioOutputs.map((node) => node.gain.value));
    assert.ok(selectedGains.every((gain) => Math.abs(gain - volume) < 0.00001), 'The slider must change actual master output volume');
    const mute = page.getByRole('button', { name: 'Mute sound', exact: true });
    await mute.click();
    assert.equal(await mute.getAttribute('aria-pressed'), 'true');
    // AudioParam automation becomes observable on the next audio render quantum.
    await page.waitForFunction(() => (window as unknown as { __combatAudioOutputs: GainNode[] }).__combatAudioOutputs.every((node) => node.gain.value === 0), undefined, { timeout: 500 });
    const mutedGains = await page.evaluate(() => (window as unknown as { __combatAudioOutputs: GainNode[] }).__combatAudioOutputs.map((node) => node.gain.value));
    assert.ok(mutedGains.length > 0 && mutedGains.every((gain) => gain === 0), 'Mute must silence actual connected master gains');
    await mute.click();
    assert.equal(await mute.getAttribute('aria-pressed'), 'false');
    await page.waitForFunction(() => (window as unknown as { __combatAudioOutputs: GainNode[] }).__combatAudioOutputs.every((node) => node.gain.value > 0));
    const restoredGains = await page.evaluate(() => (window as unknown as { __combatAudioOutputs: GainNode[] }).__combatAudioOutputs.map((node) => node.gain.value));
    assert.ok(restoredGains.every((gain) => Math.abs(gain - volume) < 0.00001), 'Unmuting must restore the selected master output volume');
  } finally {
    await browser.close();
  }
});

test('combat controls remain usable by touch on a narrow screen', async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    await enterFirstFight(page);
    for (const label of [/^Punch/, /^Kick/, /^Block/, /^Boost/, /^Surrender/i]) {
      const button = page.getByRole('button', { name: label });
      await button.scrollIntoViewIfNeeded();
      const bounds = (await button.boundingBox())!;
      assert.ok(bounds.width >= 44 && bounds.height >= 44, 'Combat buttons must provide usable touch targets');
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 376, 'Combat controls must fit the phone viewport');
    }
    const enemy = page.getByRole('meter').last();
    if (process.env.E2E_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.E2E_SCREENSHOT_DIR, 'shadow-spiral-combat-mobile.png'), fullPage: true });
    const label = (await enemy.getAttribute('aria-label'))!;
    const before = await health(page, label);
    await page.getByRole('button', { name: /^Punch/ }).tap();
    await waitForHealthBelow(page, label, before);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  } finally {
    await browser.close();
  }
});
