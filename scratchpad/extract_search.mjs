import { chromium } from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true});
const page = await b.newPage();
await page.goto('http://127.0.0.1:8099/', {waitUntil: 'networkidle'});
await page.waitForTimeout(2500);
const svg = await page.evaluate(() => {
  const el = document.querySelector('svg.lucide-search');
  return el ? el.outerHTML : null;
});
console.log(svg || 'NOT FOUND');
await b.close();
