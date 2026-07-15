import { chromium } from 'playwright';
const EXEC = process.env.PLAYWRIGHT_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({executablePath: EXEC, headless: true});
const page = await b.newPage();
await page.goto('http://127.0.0.1:8099/', {waitUntil: 'networkidle'});
await page.waitForTimeout(2500);

// Extract ordered blocks + icon associations
const data = await page.evaluate(() => {
  const root = document.body;
  // Walk in document order — collect headings + icon-bearing containers
  const blocks = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    if (seen.has(n)) continue;
    const tag = n.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      blocks.push({type: tag, text: n.innerText.trim()});
    } else if (tag === 'svg' && n.classList && [...n.classList].some(c => c.startsWith('lucide-'))) {
      const iconClass = [...n.classList].find(c => c.startsWith('lucide-'));
      const icon = iconClass.replace('lucide-','');
      // find nearest heading ancestor or sibling
      let parent = n.closest('a, button, [class*=card], [class*=item], div');
      let contextText = '';
      if (parent) {
        // walk up to find nearest heading in ancestors or in a card container
        let container = parent;
        for (let i=0; i<6 && container; i++) {
          const h = container.querySelector('h1,h2,h3,h4,h5,h6');
          if (h) { contextText = h.innerText.trim(); break; }
          container = container.parentElement;
        }
      }
      blocks.push({type: 'icon', name: icon, context: contextText});
    } else if (tag === 'p') {
      const t = n.innerText.trim();
      if (t.length > 20 && t.length < 400) blocks.push({type:'p', text: t.slice(0,120)});
    }
  }
  return blocks;
});
console.log(JSON.stringify(data, null, 2));
await b.close();
