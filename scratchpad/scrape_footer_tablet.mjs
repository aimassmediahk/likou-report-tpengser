import { chromium } from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true});
const ctx = await b.newContext({viewport:{width:834,height:1210}, deviceScaleFactor:2, userAgent:'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15'});
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8099/', {waitUntil: 'networkidle'});
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);

const data = await page.evaluate(() => {
  const foot = document.querySelector('footer');
  if (!foot) return null;
  const styles = getComputedStyle(foot);
  // find the grid container inside footer
  function findGridContainer(el) {
    const all = [el, ...el.querySelectorAll('*')];
    for (const n of all) {
      const s = getComputedStyle(n);
      if (s.display === 'grid') {
        return {
          tag: n.tagName.toLowerCase(),
          className: n.className,
          gridTemplateColumns: s.gridTemplateColumns,
          gap: s.gap,
          columnCount: n.children.length,
          childrenTags: [...n.children].map(c=>c.tagName.toLowerCase()),
          childrenText: [...n.children].map(c=>c.innerText.trim().split('\n')[0].slice(0,40))
        };
      }
    }
    return null;
  }
  return {
    footerHTML: foot.outerHTML.slice(0, 3000),
    footerDisplay: styles.display,
    gridContainer: findGridContainer(foot),
    innerWidth: window.innerWidth
  };
});
console.log(JSON.stringify(data, null, 2));

// Also capture screenshot for reference
await page.screenshot({path: 'source_tablet_footer.png', fullPage: false, clip: {x:0, y: 400, width: 834, height: 900}});

await b.close();
