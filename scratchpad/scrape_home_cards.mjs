import { chromium } from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true});
const page = await b.newPage();
await page.goto('http://127.0.0.1:8099/', {waitUntil: 'networkidle'});
await page.waitForTimeout(2500);
const IGNORE = ['chevron-down','chevron-right','chevron-left','chevron-up','arrow-right','arrow-left','arrow-up','arrow-down','menu','x','search','plus','minus','more-horizontal','more-vertical'];

const data = await page.evaluate((IGNORE) => {
  const IGN = new Set(IGNORE);
  // Find every SVG lucide, walk UP to find its card container (element containing exactly 1 heading + this svg)
  const pairs = [];
  document.querySelectorAll('svg[class*=lucide-]').forEach(svg => {
    const cls = [...svg.classList].find(c=>c.startsWith('lucide-'));
    if (!cls) return;
    const name = cls.replace('lucide-','');
    if (IGN.has(name)) return;
    // walk up 8 levels finding first ancestor with exactly one heading immediately in its subtree AND this svg is closest to that heading
    let el = svg;
    let bestH = null;
    for (let i=0; i<8; i++) {
      el = el.parentElement;
      if (!el) break;
      const hs = el.querySelectorAll('h1,h2,h3,h4,h5,h6');
      if (hs.length >= 1) {
        // pick the nearest heading (by DOM position) that is inside this el
        bestH = hs[0];
        break;
      }
    }
    pairs.push({icon: name, heading: bestH ? bestH.innerText.trim() : ''});
  });
  return pairs;
}, IGNORE);

// Print groupings: for each heading text, list icons
const byHeading = {};
data.forEach(p => {
  if (!p.heading) return;
  byHeading[p.heading] = byHeading[p.heading] || new Set();
  byHeading[p.heading].add(p.icon);
});
const out = {};
Object.entries(byHeading).forEach(([h, icons]) => out[h] = [...icons]);
console.log(JSON.stringify(out, null, 2));
await b.close();
