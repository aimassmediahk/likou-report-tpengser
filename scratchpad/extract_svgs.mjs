import { chromium } from 'playwright';
import fs from 'node:fs';
const NEED = ['chart-pie','message-circle','shopping-bag','map-pin','flag','target','gavel','circle-user','tags','package','calendar-check','crown','laptop','eye','brain-circuit','send','clipboard-list'];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true});
const page = await b.newPage();
await page.goto('http://127.0.0.1:8099/', {waitUntil: 'networkidle'});
await page.waitForTimeout(3000);

// scroll to trigger any lazy render + click through pages that might have missing icons
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

const found = await page.evaluate((names) => {
  const out = {};
  for (const name of names) {
    const el = document.querySelector(`svg.lucide-${name}`);
    if (el) out[name] = el.outerHTML;
  }
  return out;
}, NEED);

let missing = NEED.filter(n => !found[n]);
console.error('Found on homepage:', Object.keys(found).length, '/ Need:', NEED.length);
console.error('Missing after home:', missing);

// For missing ones, try clicking into sub-pages that use them
// Attempt each research toolbox item to trigger a lazy import
if (missing.length > 0) {
  // Try scrolling through toolbox area (Our Research Toolbox section is on home already)
  // If still missing after scroll, they may not be used on homepage at all
  // Try clicking into research pages via nav
  const navTargets = ['Research', 'Consultation', 'Training'];
  for (const t of navTargets) {
    if (missing.length === 0) break;
    try {
      await page.evaluate(t => {
        const els = [...document.querySelectorAll('a,button,[role=button]')];
        const el = els.find(e => e.innerText.trim() === t);
        if (el) el.click();
      }, t);
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      const more = await page.evaluate((names) => {
        const out = {};
        for (const name of names) {
          const el = document.querySelector(`svg.lucide-${name}`);
          if (el) out[name] = el.outerHTML;
        }
        return out;
      }, missing);
      Object.assign(found, more);
      missing = NEED.filter(n => !found[n]);
      console.error(`After click ${t}: still missing`, missing);
    } catch(e){console.error(e.message)}
  }
}

console.error('Final missing:', NEED.filter(n => !found[n]));
console.log(JSON.stringify(found));
await b.close();
