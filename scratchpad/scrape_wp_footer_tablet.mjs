import { chromium } from 'playwright';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true});
const ctx = await b.newContext({viewport:{width:834,height:1210}, deviceScaleFactor:2, userAgent:'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15'});
const page = await ctx.newPage();
await page.goto('https://81.hkwordpress.com/', {waitUntil: 'networkidle'});
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);

const data = await page.evaluate(() => {
  // Find footer + inspect its widget columns
  const foot = document.querySelector('footer#colophon, footer.site-footer, .site-footer, #colophon');
  if (!foot) return {error: 'no footer'};
  // Find the widget area
  const widgetArea = foot.querySelector('.site-below-footer-wrap, [class*=widget-area], .site-primary-footer-inner-wrap, .site-footer-primary-section');
  const widgets = foot.querySelectorAll('.widget, .ast-builder-html-element, [class*=footer-widget]');
  // Find the grid layout parent
  const grids = [];
  document.querySelectorAll('footer *').forEach(el => {
    const s = getComputedStyle(el);
    if (s.display === 'grid' || (s.display === 'flex' && s.flexWrap === 'wrap' && el.children.length >= 3)) {
      grids.push({
        tag: el.tagName.toLowerCase(),
        className: (el.className||'').split(' ').slice(0,6).join(' '),
        display: s.display,
        gridTemplateColumns: s.gridTemplateColumns,
        gap: s.gap,
        childCount: el.children.length,
        childrenSample: [...el.children].slice(0,3).map(c=>c.className.split(' ')[0])
      });
    }
  });
  // Sample menu column headings
  const menuHeadings = [...foot.querySelectorAll('h1,h2,h3,h4,h5,.widget-title')].map(h=>h.innerText.trim());
  return {
    footerClass: foot.className,
    widgetCount: widgets.length,
    menuHeadings,
    grids: grids.slice(0,8),
  };
});
console.log(JSON.stringify(data, null, 2));
await b.close();
