// Optional browser regression checks. Run Vite first, then:
// PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs npm run test:ending
// A locally installed `playwright` package also works without that variable.
// Set E2E_BROWSER_CHANNEL=chrome to use an installed Chrome browser.
import assert from 'node:assert/strict';
import { test } from 'node:test';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const launchOptions = { headless: true, channel: process.env.E2E_BROWSER_CHANNEL };

test('ending choices wait for input, change responses, survive replay and reset the game', async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors: string[] = [];
    page.on('pageerror', (error: Error) => errors.push(error.message));
    page.on('console', (message: { type(): string; text(): string }) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(baseUrl);
    await page.getByRole('button', { name: 'Play the final chapter' }).click();
    await page.getByRole('region', { name: 'Interactive final chapter' }).waitFor();
    const openingHeading = await page.locator('.ending-container h1').innerText();
    const responses: string[][] = [];
    const finalMessages: string[] = [];

    for (const route of [0, 1]) {
      const routeResponses: string[] = [];
      const headings = new Set<string>();
      for (let chapter = 0; chapter < 6; chapter++) {
        const heading = await page.locator('.ending-container h1').innerText();
        headings.add(heading);
        assert.equal(await page.locator('.memory-choice').count(), 2);
        assert.equal(await page.locator('.memory-response').count(), 0);

        // Enter must never skip an unanswered memory.
        await page.locator('.ending-container h1').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.ending-container h1').innerText(), heading);
        if (route === 0) await page.keyboard.press('1');
        else await page.locator('.memory-choice').nth(1).click();
        await page.locator('.memory-response').waitFor();
        const response = await page.locator('.memory-response > p').last().innerText();
        routeResponses.push(response);
        assert.equal(await page.locator('.ending-container h1').innerText(), heading);

        // A second key press cannot overwrite the selected memory.
        await page.keyboard.press(route === 0 ? '2' : '1');
        assert.equal(await page.locator('.memory-response > p').last().innerText(), response);
        if (route === 0) {
          await page.locator('.ending-container h1').focus();
          await page.keyboard.press('Enter');
        } else {
          await page.locator('.memory-response button').click();
        }
        await page.waitForFunction((previous: string) => document.querySelector('.ending-container h1')?.textContent !== previous, heading);
      }
      assert.equal(headings.size, 6, 'Each memory must advance to a different chapter');
      await page.locator('.memorial-panel').waitFor();
      finalMessages.push(await page.locator('.last-message').innerText());
      responses.push(routeResponses);
      assert.equal(await page.locator('.memory-choice').count(), 0);

      if (route === 0) {
        await page.getByRole('button', { name: /VIEW CRISIS DOSSIER/ }).click();
        await page.getByRole('dialog').waitFor();
        await page.keyboard.press('1');
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.last-message').innerText(), finalMessages[0]);
        await page.getByRole('button', { name: /RETURN TO GAME/ }).click();
        await page.getByRole('button', { name: /REPLAY MEMORIES/ }).click();
        await page.locator('.memory-choice').first().waitFor();
        assert.equal(await page.locator('.ending-container h1').innerText(), openingHeading);
        assert.equal(await page.locator('.memory-response').count(), 0);
      }
    }

    assert.notEqual(finalMessages[0], finalMessages[1], 'The final choice must change the closing reflection');
    for (let chapter = 0; chapter < 6; chapter++) {
      assert.notEqual(responses[0][chapter], responses[1][chapter], 'Both choices must give a different response');
    }
    await page.getByRole('button', { name: /RESTART LIFE SIMULATION/ }).click();
    await page.getByRole('region', { name: 'Your story' }).waitFor();
    assert.equal(await page.locator('.ending-container').count(), 0);
    await page.getByRole('button', { name: 'Play the final chapter' }).click();
    await page.locator('.memory-choice').first().waitFor();
    assert.equal(await page.locator('.ending-container h1').innerText(), openingHeading);
    assert.equal(await page.locator('.memory-response').count(), 0);
    assert.deepEqual(errors, [], 'The complete interactive flow must have no browser exceptions');
  } finally {
    await browser.close();
  }
});

test('the original school, allowance, tolerance and shortage route is preserved', async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(baseUrl);
    await page.getByRole('region', { name: 'Your story' }).waitFor();
    await page.waitForFunction(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('.scene-container canvas');
      return canvas?.getContext('2d')?.getImageData(320, 180, 1, 1).data[3] === 255;
    });
    const pixels = await page.locator('.scene-container canvas').evaluate((canvas: HTMLCanvasElement) => {
      const image = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
      const colors = new Set<string>();
      let blocks = 0;
      let matching = 0;
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const first = (y * canvas.width + x) * 4;
          const neighbors = [first + 4, first + canvas.width * 4, first + canvas.width * 4 + 4];
          if (neighbors.every((neighbor) => [0, 1, 2, 3].every((channel) => image.data[first + channel] === image.data[neighbor + channel]))) matching++;
          colors.add(`${image.data[first]},${image.data[first + 1]},${image.data[first + 2]}`);
          blocks++;
        }
      }
      return { width: canvas.width, height: canvas.height, ratio: matching / blocks, colors: colors.size };
    });
    assert.deepEqual([pixels.width, pixels.height], [640, 360]);
    assert.ok(pixels.colors > 16, 'The canvas must contain a painted scene, not a blank placeholder');
    assert.ok(pixels.ratio > 0.995, `The nearest-neighbor filter must produce solid 2×2 pixels; got ${pixels.ratio}`);
    assert.match(await page.locator('.situation-text').innerText(), /prescription stimulant behind gym bleachers/);
    for (const step of [
      { button: /^Take it/i, heading: 'ALLOWANCE COVERS', text: /Weekly allowance \(\$25\) covers the dealer/ },
      { button: /^Buy more with allowance/i, heading: 'TOLERANCE', text: /Tolerance doubles/ },
      { button: /^Keep taking it/i, heading: 'WITHDRAWAL', text: /Dealer cuts you off without cash/ },
    ]) {
      await page.getByRole('button', { name: step.button }).click();
      await page.getByRole('heading', { name: step.heading, exact: true }).waitFor();
      assert.match(await page.locator('.situation-text').innerText(), step.text);
    }
    assert.equal(await page.locator('.choice-btn').count(), 2);
    assert.match(await page.locator('.choices-container').innerText(), /Ask parents for emergency money/i);
  } finally {
    await browser.close();
  }
});

test('the final chapter is playable by touch on a narrow screen with reduced motion', async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    });
    await page.goto(baseUrl);
    await page.getByRole('button', { name: 'Play the final chapter' }).tap();
    const choice = page.locator('.memory-choice').last();
    await choice.scrollIntoViewIfNeeded();
    const bounds = await choice.boundingBox();
    assert.ok(bounds && bounds.width > 200 && bounds.height >= 44, 'Choices must remain usable touch targets');
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 376, 'Choices must fit the narrow viewport');
    await choice.tap();
    await page.locator('.memory-response').waitFor();
    await page.locator('.memory-response button').tap();
    await page.locator('.memory-choice').first().waitFor();
    const overflow = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ending: (() => {
        const region = document.querySelector('.ending-container')!;
        return region.scrollWidth > region.clientWidth + 1;
      })(),
    }));
    assert.deepEqual(overflow, { page: false, ending: false });
  } finally {
    await browser.close();
  }
});
