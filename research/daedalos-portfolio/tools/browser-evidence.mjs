import { writeFile } from 'node:fs/promises';

// Call from ego-browser nodejs with a Page from the existing task space.
// This renders DOM to a bitmap; it is explicitly not a native screenshot.
export async function captureDOM(page, selector, filename) {
  await page.waitForFunction(selector => {
    let element = document.querySelector(selector);
    if (!element) return false;
    while (element) {
      if (Number(getComputedStyle(element).opacity) < 0.999) return false;
      if (element.getAnimations().some(animation => animation.playState === 'running' && animation.effect.getTiming().iterations !== Infinity)) return false;
      element = element.parentElement;
    }
    return true;
  }, selector, { timeout: 10000 });
  const data = await page.evaluate(async selector => {
    if (!window.htmlToImage) await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = '/System/PersonalOS/capture.js'; script.onload = resolve; script.onerror = reject; document.head.append(script); });
    const element = document.querySelector(selector);
    if (!element) throw new Error('Capture target not found');
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) throw new Error('Capture target is not visible');
    return window.htmlToImage.toPng(element, { pixelRatio: 1, skipFonts: true, backgroundColor: '#f7f9fc' });
  }, selector);
  await writeFile(filename, Buffer.from(data.split(',')[1], 'base64'));
}
