// Browser-level regression probe: call with an ego-browser Page showing AppStore.
// Checks the actual painted element geometry, not stylesheet implementation text.
export async function inspectStoreLayout(page) {
  await page.waitForSelector('.hyc-store-card');
  await page.waitForFunction(() => {
    const el = document.querySelector('.hyc-store');
    return el && !el.closest('[role="dialog"]').getAnimations({subtree:true}).some(animation => animation.playState === 'running' && animation.effect.getTiming().iterations !== Infinity);
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.hyc-store img')].every(img => img.complete && img.naturalWidth > 0 && getComputedStyle(img).visibility === 'visible'));
  // Motion also updates layout with requestAnimationFrame, outside getAnimations().
  await page.evaluate(() => new Promise((resolve, reject) => {
    let previous = '', stable = 0, frames = 0;
    const sample = () => {
      const root = document.querySelector('.hyc-store');
      const current = JSON.stringify([root.getBoundingClientRect().toJSON(), root.querySelector('.hyc-store-controls').getBoundingClientRect().toJSON()]);
      stable = current === previous ? stable + 1 : 0; previous = current;
      if (stable >= 5) resolve(true);
      else if (++frames > 240) reject(new Error('Store layout did not settle'));
      else requestAnimationFrame(sample);
    }; sample();
  }));
  return page.evaluate(() => {
    const root = document.querySelector('.hyc-store');
    const bar = root.querySelector('.hyc-address');
    const icon = bar.querySelector('img').getBoundingClientRect();
    const label = bar.querySelector(':scope > span').getBoundingClientRect();
    const controls = root.querySelector('.hyc-store-controls');
    const bounds = controls.getBoundingClientRect();
    const items = [...controls.querySelectorAll('button,input')].map(el => ({label:el.textContent || el.getAttribute('aria-label'), ...Object.fromEntries(['top','bottom','left','right','height'].map(k=>[k,el.getBoundingClientRect()[k]]))}));
    const lastBottom = Math.max(...items.map(item=>item.bottom));
    const firstTop = Math.min(...items.map(item=>item.top));
    const mainTop = root.querySelector('main').getBoundingClientRect().top;
    const readableControls = controls.querySelector('input').getBoundingClientRect().width >= 120 && [...controls.querySelectorAll('button')].every(button => button.getBoundingClientRect().height <= 32);
    const horizontalOverflow = items.some(item=>item.left<bounds.left || item.right>bounds.right);
    return {width:root.getBoundingClientRect().width,iconTextGap:label.left-icon.right,controlTopPadding:firstTop-bounds.top,controlBottomPadding:bounds.bottom-lastBottom,mainBelowControls:mainTop>=lastBottom,readableControls,horizontalOverflow,controlsHeight:bounds.height,items,pass:label.left-icon.right>=4 && firstTop>=bounds.top && bounds.bottom-lastBottom>=6 && mainTop>=lastBottom && !horizontalOverflow && readableControls};
  });
}
export async function assertStoreLayout(page) {
  const result=await inspectStoreLayout(page);
  if (!result.pass) throw new Error(`STORE_LAYOUT_FAILED ${JSON.stringify(result)}`);
  return result;
}
