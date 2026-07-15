import { chromium } from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true});
const page = await b.newPage();
await page.goto('http://127.0.0.1:8099/', {waitUntil: 'networkidle'});
await page.waitForTimeout(2500);

const targets = ['Surveys', 'Traffic Count', 'Mystery Shopping', 'Focus Group', 'In-Depth Interview'];
const IGN = new Set(['chevron-down','chevron-right','arrow-right','menu','x','check','search']);

const results = await page.evaluate(({targets, ignore}) => {
  const IGN = new Set(ignore);
  const out = {};
  for (const t of targets) {
    const matches = [];
    document.querySelectorAll('h1,h2,h3,h4,h5').forEach(h => {
      if (h.innerText.trim() === t) {
        // walk up to find card container with svg
        let el = h;
        for (let i=0; i<8; i++) {
          el = el.parentElement;
          if (!el) break;
          const svgs = el.querySelectorAll('svg[class*=lucide-]');
          const found = [];
          svgs.forEach(s => {
            const cls = [...s.classList].find(c=>c.startsWith('lucide-'));
            if (!cls) return;
            const n = cls.replace('lucide-','');
            if (IGN.has(n)) return;
            found.push(n);
          });
          if (found.length > 0) {
            matches.push({depth:i, icons: found});
            break;
          }
        }
      }
    });
    out[t] = matches;
  }
  return out;
}, {targets, ignore: [...IGN]});
console.log(JSON.stringify(results, null, 2));
await b.close();
