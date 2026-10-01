// Local lab audit: read production output, launch isolated Chrome, navigate localhost,
// collect browser performance entries, then write docs/performance-results.json.
// No profile reuse, uploads, package installation, throttling, or server changes.
import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = new URL(process.env.PERF_URL ?? 'http://127.0.0.1:4173/');
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.protocol !== 'http:') {
  throw new Error('This audit is restricted to a local HTTP preview.');
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) {
      const data = await readFile(path);
      files.push({ path: relative(join(root, 'dist'), path).replaceAll('\\', '/'), bytes: data.length,
        sha256: createHash('sha256').update(data).digest('hex') });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

const distFiles = await walk(join(root, 'dist'));
const forbiddenDistFiles = distFiles.filter(({ path }) => path !== 'audio/woodstock-demo-v1.wav' && /(^|\/)(source-art|docs|vendor-skills|node_modules|masters?)(\/|$)|\.(mp3|wav|flac|aac|ogg|m4a|aiff|glb|gltf)$/i.test(path));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = {
  generatedAt: new Date().toISOString(), target: target.href,
  environment: { node: process.version, browser: browser.version(), platform: process.platform,
    cache: 'Disabled using Network.setCacheDisabled; a new isolated context per profile',
    network: 'Local Vite preview; no network or CPU throttling; no external service',
    tools: 'Installed @playwright/test; standard PerformanceObserver and PerformanceResourceTiming; no DevTools MCP or trace' },
  distFiles, forbiddenDistFiles, profiles: [],
};

try {
  const profiles = [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    { name: 'mobile-emulated', viewport: { width: 393, height: 851 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
  ];
  for (const profile of profiles) {
    const { name, ...contextOptions } = profile;
    const context = await browser.newContext({ ...contextOptions, locale: 'pt-BR' });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    let phase = 'initial';
    const requests = [];
    const errors = [];
    const warnings = [];
    const byRequest = new Map();
    page.on('request', (request) => {
      const entry = { phase, url: request.url(), type: request.resourceType(), method: request.method() };
      requests.push(entry);
      byRequest.set(request, entry);
    });
    page.on('response', (response) => {
      const entry = byRequest.get(response.request());
      if (response.status() >= 400) errors.push({ phase, type: 'http', url: response.url(), status: response.status() });
      if (entry) Object.assign(entry, { status: response.status(), contentType: response.headers()['content-type'] ?? null,
        contentEncoding: response.headers()['content-encoding'] ?? null,
        cacheControl: response.headers()['cache-control'] ?? null });
    });
    page.on('requestfailed', (request) => errors.push({ phase, type: 'requestfailed', url: request.url(), error: request.failure()?.errorText }));
    page.on('pageerror', (error) => errors.push({ phase, type: 'pageerror', error: error.message }));
    page.on('console', (message) => { if (message.type() === 'error') errors.push({ phase, type: 'console', error: message.text() }); });
    page.on('console', (message) => { if (message.type() === 'warning') warnings.push({ phase, message: message.text() }); });
    await page.addInitScript(() => {
      history.scrollRestoration = 'manual';
      const measurement = window.__psicozPerf = { lcp: null, layoutShifts: [], supportedEntryTypes: PerformanceObserver.supportedEntryTypes };
      if (measurement.supportedEntryTypes.includes('largest-contentful-paint')) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) measurement.lcp = {
            startTime: entry.startTime, renderTime: entry.renderTime, loadTime: entry.loadTime,
            size: entry.size, url: entry.url,
            element: entry.element ? `${entry.element.tagName.toLowerCase()}${entry.element.id ? `#${entry.element.id}` : ''}` : null,
          };
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }
      if (measurement.supportedEntryTypes.includes('layout-shift')) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) measurement.layoutShifts.push({
            value: entry.value, startTime: entry.startTime, hadRecentInput: entry.hadRecentInput,
            sources: entry.sources?.map(({ node }) => node ? `${node.tagName?.toLowerCase()}${node.id ? `#${node.id}` : ''}` : null),
          });
        }).observe({ type: 'layout-shift', buffered: true });
      }
    });

    async function settle() {
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
    }

    async function snapshot() {
      return page.evaluate(() => {
        const measurement = window.__psicozPerf;
        // CLS session windows: maximum session, gaps <1s and duration <5s.
        let cls = 0, session = 0, sessionStart = 0, previous = 0;
        for (const shift of measurement.layoutShifts.filter((entry) => !entry.hadRecentInput)) {
          if (!session || shift.startTime - previous >= 1000 || shift.startTime - sessionStart >= 5000) {
            session = shift.value; sessionStart = shift.startTime;
          } else session += shift.value;
          previous = shift.startTime;
          cls = Math.max(cls, session);
        }
        const navigation = performance.getEntriesByType('navigation')[0];
        const all = [navigation, ...performance.getEntriesByType('resource')].filter(Boolean);
        const resources = all.map((entry) => ({
          name: entry.name, type: entry.entryType === 'navigation' ? 'document' : entry.initiatorType,
          transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize,
          startTime: entry.startTime, duration: entry.duration,
        }));
        return {
          position: { scrollX, scrollY, viewportWidth: innerWidth, viewportHeight: innerHeight,
            documentHeight: document.documentElement.scrollHeight },
          totals: resources.reduce((sum, entry) => ({ transferBytes: sum.transferBytes + entry.transferSize,
            encodedBytes: sum.encodedBytes + entry.encodedBodySize, decodedBytes: sum.decodedBytes + entry.decodedBodySize,
            entries: sum.entries + 1 }), { transferBytes: 0, encodedBytes: 0, decodedBytes: 0, entries: 0 }),
          lcp: measurement.lcp, cls, layoutShifts: measurement.layoutShifts,
          fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
          navigation: { type: navigation?.type, responseStart: navigation?.responseStart,
            domContentLoadedEventEnd: navigation?.domContentLoadedEventEnd, loadEventEnd: navigation?.loadEventEnd },
          resources,
          images: [...document.images].map((img) => ({ source: img.currentSrc || img.src, loading: img.loading,
            complete: img.complete, naturalWidth: img.naturalWidth, width: img.width, height: img.height })),
          fonts: { status: document.fonts.status, check700: document.fonts.check('700 48px UnifrakturCook'),
            faces: [...document.fonts].map((font) => ({ family: font.family, weight: font.weight, status: font.status })),
            heroComputedFamily: getComputedStyle(document.querySelector('#hero-title')).fontFamily,
            heroComputedWeight: getComputedStyle(document.querySelector('#hero-title')).fontWeight },
          supportedEntryTypes: measurement.supportedEntryTypes,
        };
      });
    }

    await page.goto(target.href, { waitUntil: 'load' });
    await settle();
    const initial = await snapshot();
    const accessibilitySnapshot = await page.locator('body').ariaSnapshot();
    phase = 'scroll';
    let scrollSteps = 0;
    while (scrollSteps < 100) {
      const atBottom = await page.evaluate(() => {
        const bottom = document.documentElement.scrollHeight - innerHeight;
        scrollTo({ top: Math.min(scrollY + innerHeight * 0.8, bottom), behavior: 'instant' });
        return Math.abs(scrollY - bottom) <= 2;
      });
      scrollSteps += 1;
      await page.waitForTimeout(120);
      if (atBottom) break;
    }
    await settle();
    const afterScroll = await snapshot();
    // Restore the top before a real document reload; cache stays disabled.
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    phase = 'reload';
    await page.reload({ waitUntil: 'load' });
    await settle();
    const reload = await snapshot();
    // Investigate reported preload warnings without changing page code or CSS.
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    async function renderedFonts() {
      const { root: documentRoot } = await cdp.send('DOM.getDocument');
      const entries = [];
      for (const selector of ['#hero-title', '#collection-title']) {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: documentRoot.nodeId, selector });
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        entries.push({ selector, fonts });
      }
      return entries;
    }
    await page.waitForTimeout(4500);
    const normalFontProbe = { ...await snapshot(), renderedFonts: await renderedFonts() };
    phase = 'nfc-font-check';
    const nfcUrl = new URL(target);
    nfcUrl.searchParams.set('edition', 'nfc');
    await page.goto(nfcUrl.href, { waitUntil: 'load' });
    await settle();
    await page.waitForTimeout(4500);
    const nfcFontProbe = { ...await snapshot(), renderedFonts: await renderedFonts() };
    const blockedContentRequests = requests.filter(({ url, type }) => type === 'media' || /\.(mp3|wav|flac|aac|ogg|m4a|aiff|glb|gltf)(\?|$)|\/three[^/]*\.js|\/game\//i.test(url));
    results.profiles.push({ ...profile, initial, afterScroll, scrollSteps, reload,
      lazyAddedUrls: afterScroll.resources.filter((entry) => !initial.resources.some((before) => before.name === entry.name)).map((entry) => entry.name),
      requests, blockedContentRequests, errors, warnings, normalFontProbe, nfcFontProbe, accessibilitySnapshot });
    console.log(`${name}: initial ${initial.totals.transferBytes} B, after scroll ${afterScroll.totals.transferBytes} B, LCP ${initial.lcp?.startTime ?? 'n/a'} ms, CLS ${initial.cls}; errors ${errors.length}`);
    await context.close();
  }
} finally {
  await browser.close();
}

results.distBytes = distFiles.reduce((total, file) => total + file.bytes, 0);
await writeFile(join(root, 'docs', 'performance-results.json'), `${JSON.stringify(results, null, 2)}\n`);
if (forbiddenDistFiles.length || results.profiles.some((profile) => profile.errors.length || profile.blockedContentRequests.length)) {
  process.exitCode = 1;
}
console.log(`Wrote docs/performance-results.json; dist ${results.distBytes} B, forbidden files ${forbiddenDistFiles.length}`);
