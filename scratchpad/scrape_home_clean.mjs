import { chromium } from 'playwright';
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({executablePath: EXEC, headless: true});
const page = await b.newPage();
await page.goto('http://127.0.0.1:8099/', {waitUntil: 'networkidle'});
await page.waitForTimeout(2500);

const data = await page.evaluate(() => {
  // Ignore UI chrome icons
  const IGNORE = new Set(['chevron-down','chevron-right','chevron-left','chevron-up',
    'arrow-right','arrow-left','arrow-up','arrow-down','menu','x','check',
    'search','plus','minus','more-horizontal','more-vertical']);

  // Collect sections: each section = { section_heading, subsections: [{h3, icon}] }
  const sections = [];
  const headingsAll = [...document.querySelectorAll('h2')];
  headingsAll.forEach(h2 => {
    const sec = { h2: h2.innerText.trim(), items: [] };
    // find the section container that starts at this h2 - walk up until next h2 is not in same subtree
    let container = h2.parentElement;
    for (let i=0; i<8 && container; i++) {
      // walk up to find first ancestor with multiple direct h3/card children
      const h3s = container.querySelectorAll('h3, h4');
      if (h3s.length >= 2) break;
      container = container.parentElement;
    }
    if (!container) return;
    // walk each h3/h4 in container
    const subs = [...container.querySelectorAll('h3, h4')];
    subs.forEach(h => {
      // find card ancestor
      let card = h;
      for (let i=0; i<6 && card; i++) {
        card = card.parentElement;
        if (!card) break;
        // if card contains an lucide svg + h3, this is the card
        const svgs = card.querySelectorAll('svg[class*=lucide-]');
        if (svgs.length >= 1) {
          let icon = null;
          for (const s of svgs) {
            const cls = [...s.classList].find(c=>c.startsWith('lucide-'));
            if (!cls) continue;
            const name = cls.replace('lucide-','');
            if (IGNORE.has(name)) continue;
            icon = name;
            break;
          }
          if (icon) {
            sec.items.push({ h: h.innerText.trim(), icon });
            return;
          }
        }
      }
      sec.items.push({ h: h.innerText.trim(), icon: null });
    });
    if (sec.items.length > 0) sections.push(sec);
  });
  // Dedup: pick unique sections by h2
  const seen = new Set();
  const unique = [];
  for (const s of sections) {
    if (seen.has(s.h2)) continue;
    seen.add(s.h2);
    unique.push(s);
  }
  // Also collect all lucide icons on page (with context) for reference
  const allIcons = [];
  document.querySelectorAll('svg[class*=lucide-]').forEach(svg => {
    const cls = [...svg.classList].find(c=>c.startsWith('lucide-'));
    if (!cls) return;
    const name = cls.replace('lucide-','');
    if (IGNORE.has(name)) return;
    // find nearest heading
    let el = svg;
    let context = '';
    for (let i=0; i<8 && el; i++) {
      el = el.parentElement;
      if (!el) break;
      const h = el.querySelector('h1,h2,h3,h4,h5,h6');
      if (h) { context = h.innerText.trim(); break; }
    }
    allIcons.push({ name, context });
  });
  return { sections: unique, allIcons };
});
console.log(JSON.stringify(data, null, 2));
await b.close();
