import { test } from 'node:test';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { build } from 'esbuild';
import { readAssets } from '../scripts/assets.mjs';
import { handleRequest } from '../server/runtime.ts';

const root = resolve('dist');
const routes = [
  '/',
  '/services/',
  '/pricing/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/thank-you/',
  '/404.html',
];
const routeFile = (path) => join(root, path === '/404.html' ? '404.html' : `${path}index.html`);
const html = async (path) => readFile(routeFile(path), 'utf8');
const page = async (path) =>
  new JSDOM(await html(path), { url: `https://presence.test${path}`, runScripts: 'outside-only' });

async function withDOM(path, callback) {
  const dom = await page(path);
  const keys = ['document', 'window', 'Node'];
  const previous = keys.map((key) => globalThis[key]);
  keys.forEach((key) => {
    globalThis[key] = dom.window[key];
  });
  try {
    return await callback(dom.window, dom.window.document);
  } finally {
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete globalThis[key];
      else globalThis[key] = previous[i];
    });
    dom.window.close();
  }
}

async function loadScript(name) {
  const result = await build({
    entryPoints: [`src/scripts/${name}.ts`],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
  });
  const output = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}

test('all nine pages have unique metadata, one h1, a main landmark and valid language', async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const route of routes) {
    const dom = await page(route);
    const doc = dom.window.document;
    assert.equal(doc.documentElement.lang, 'en-GB', route);
    assert.equal(doc.querySelectorAll('h1').length, 1, route);
    assert.equal(doc.querySelectorAll('main').length, 1, route);
    assert.ok(doc.querySelector('title').textContent.length > 15, route);
    assert.ok(doc.querySelector('meta[name="description"]').content.length > 50, route);
    titles.add(doc.title);
    descriptions.add(doc.querySelector('meta[name="description"]').content);
    assert.equal(doc.querySelector('.skip-link').getAttribute('href'), '#main');
    dom.window.close();
  }
  assert.equal(titles.size, routes.length);
  assert.equal(descriptions.size, routes.length);
});

test('internal page links, asset references and fragment targets resolve', async () => {
  for (const route of routes) {
    const dom = await page(route);
    const doc = dom.window.document;
    for (const node of doc.querySelectorAll('a[href], link[href], script[src], img[src]')) {
      const value = node.getAttribute('href') ?? node.getAttribute('src');
      const url = new URL(value, `https://presence.test${route}`);
      if (url.origin !== 'https://presence.test') continue;
      const target = url.pathname.endsWith('/')
        ? routeFile(url.pathname)
        : join(root, url.pathname);
      assert.ok((await stat(target)).isFile(), `${route} → ${value}`);
      if (url.hash) {
        const other = new JSDOM(await readFile(target, 'utf8'));
        assert.ok(
          other.window.document.getElementById(decodeURIComponent(url.hash.slice(1))),
          `${route} → ${value}`,
        );
        other.window.close();
      }
    }
    const ids = [...doc.querySelectorAll('[id]')].map((node) => node.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate ids on ${route}`);
    dom.window.close();
  }
});

test('navigation marks only the current page in each navigation region', async () => {
  for (const route of routes.slice(0, 5)) {
    const dom = await page(route);
    const regions = dom.window.document.querySelectorAll('[aria-label="Main navigation"]');
    assert.equal(regions.length, 1);
    for (const nav of regions) {
      const active = nav.querySelectorAll('[aria-current="page"]');
      assert.equal(active.length, 1, route);
      assert.equal(active[0].getAttribute('href'), route);
    }
    dom.window.close();
  }
});

test('the native server form includes every field, a hidden honeypot and idempotency slot', async () => {
  const dom = await page('/contact/');
  const form = dom.window.document.querySelector('form');
  assert.equal(form.name, 'presence-review');
  assert.equal(form.method, 'post');
  assert.equal(form.getAttribute('action'), '/api/enquiries');
  assert.equal(form.querySelector('[name="form-name"]').value, form.name);
  assert.deepEqual(
    [...form.elements]
      .map((item) => item.name)
      .filter(Boolean)
      .sort(),
    [
      'form-name',
      'submission-id',
      'bot-field',
      'contact-name',
      'business-name',
      'email',
      'website',
      'google-profile',
      'location',
      'telephone',
      'service',
      'goal',
    ].sort(),
  );
  assert.deepEqual(
    [...form.querySelectorAll('[required]')].map((item) => item.name).sort(),
    ['contact-name', 'business-name', 'email', 'telephone', 'goal'].sort(),
  );
  assert.equal(form.querySelector('[name="bot-field"]').closest('p').hidden, true);
  dom.window.close();
});

test('pricing CTAs identify both plans and valid selections prefill the enquiry', async () => {
  const dom = await page('/pricing/');
  const buttons = [...dom.window.document.querySelectorAll('.price-card .button')];
  assert.deepEqual(
    buttons.map((button) => button.getAttribute('href')),
    ['/contact/?service=one-off', '/contact/?service=ongoing', '/contact/?service=new-website'],
  );
  dom.window.close();
  for (const service of ['one-off', 'ongoing', 'new-website', 'unexpected']) {
    await withDOM('/contact/', async (win, doc) => {
      win.history.replaceState(null, '', `/contact/?service=${service}`);
      (await loadScript('form')).setupReviewForm();
      assert.equal(
        doc.querySelector('#service').value,
        service === 'unexpected' ? 'not-sure' : service,
      );
    });
  }
});

test('native email and URL constraints reject malformed values and permit absent optional URLs', async () => {
  await withDOM('/contact/', async (win, doc) => {
    (await loadScript('form')).setupReviewForm();
    const form = doc.querySelector('form');
    assert.equal(form.checkValidity(), false);
    const email = doc.querySelector('#email');
    email.value = 'not-an-email';
    email.dispatchEvent(new win.Event('blur'));
    assert.equal(email.checkValidity(), false);
    assert.match(doc.querySelector('#email-error').textContent, /valid email/);
    email.value = 'owner@example.co.uk';
    email.dispatchEvent(new win.Event('blur'));
    assert.equal(email.checkValidity(), true);
    for (const name of ['website', 'google-profile']) {
      const field = doc.querySelector(`#${name}`);
      for (const value of ['broken', 'ftp://example.co.uk', 'javascript:alert(1)']) {
        field.value = value;
        field.dispatchEvent(new win.Event('blur'));
        assert.equal(field.checkValidity(), false, value);
      }
      for (const value of ['', 'https://example.co.uk/business/', 'http://example.co.uk']) {
        field.value = value;
        field.dispatchEvent(new win.Event('blur'));
        assert.equal(field.checkValidity(), true, value);
      }
    }
  });
});

test('whitespace-only required details fail and errors are associated with their fields', async () => {
  await withDOM('/contact/', async (win, doc) => {
    (await loadScript('form')).setupReviewForm();
    for (const id of ['contact-name', 'business-name', 'goal']) {
      const field = doc.getElementById(id);
      field.value = '   ';
      field.dispatchEvent(new win.Event('blur'));
      assert.equal(field.checkValidity(), false, id);
      assert.equal(field.getAttribute('aria-invalid'), 'true');
      assert.ok(field.getAttribute('aria-describedby').includes(`${id}-error`));
      assert.ok(doc.getElementById(`${id}-error`).textContent);
      field.value = 'Valid detail';
      field.dispatchEvent(new win.Event('blur'));
      assert.equal(field.checkValidity(), true);
      assert.equal(doc.getElementById(`${id}-error`).textContent, '');
    }
  });
});

test('the phone number is required and must look like a phone number', async () => {
  await withDOM('/contact/', async (win, doc) => {
    (await loadScript('form')).setupReviewForm();
    const phone = doc.getElementById('telephone');
    assert.equal(phone.required, true);
    for (const value of ['', '   ', 'call me', '123']) {
      phone.value = value;
      phone.dispatchEvent(new win.Event('blur'));
      assert.equal(phone.checkValidity(), false, value);
    }
    for (const value of ['028 9000 0000', '+44 7700 900123', '(028) 9000-0000']) {
      phone.value = value;
      phone.dispatchEvent(new win.Event('blur'));
      assert.equal(phone.checkValidity(), true, value);
    }
  });
});

test('no page tells visitors the site is a draft, preview or test', async () => {
  for (const route of routes) {
    const dom = await page(route);
    assert.doesNotMatch(
      dom.window.document.body.textContent,
      /private test|static preview|dummy details|draft website|not yet live/i,
      route,
    );
    dom.window.close();
  }
});

test('local preview refuses to fake a successful enquiry and focuses its explanatory error', async () => {
  await withDOM('/contact/', async (win, doc) => {
    (await loadScript('form')).setupReviewForm();
    const form = doc.querySelector('form');
    form.dataset.hosted = 'false';
    for (const [id, value] of Object.entries({
      'contact-name': 'Test Owner',
      'business-name': 'Test Business',
      email: 'test@example.co.uk',
      telephone: '028 9000 0000',
      goal: 'A clearer quote form.',
    })) {
      const field = doc.getElementById(id);
      field.value = value;
      field.dispatchEvent(new win.Event('blur'));
    }
    assert.equal(form.checkValidity(), true);
    const event = new win.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(doc.querySelector('.form-status').hidden, false);
    assert.match(doc.querySelector('.form-status').textContent, /Nothing has been submitted/);
    assert.equal(doc.activeElement, doc.querySelector('.form-status'));
    assert.equal(win.localStorage.length, 0);
    assert.equal(win.sessionStorage.length, 0);
  });
});

async function menuFixture(win, doc, reduce) {
  const dialog = doc.querySelector('#site-menu');
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = () => {
    dialog.open = false;
  };
  const media = { matches: reduce, addEventListener: () => {} };
  win.matchMedia = () => media;
  let now = 0;
  let next = 0;
  const frames = new Map();
  win.performance.now = () => now;
  win.requestAnimationFrame = (callback) => {
    const id = ++next;
    frames.set(id, callback);
    return id;
  };
  win.cancelAnimationFrame = (id) => frames.delete(id);
  const advance = (count = 1) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const tasks = [...frames.values()];
      frames.clear();
      for (const task of tasks) task(now);
    }
  };
  (await loadScript('menu')).setupMenu();
  return {
    dialog,
    media,
    advance,
    frames,
    trigger: doc.querySelector('[data-menu-open]'),
    toggle: doc.querySelector('[data-menu-toggle]'),
    panel: doc.querySelector('[data-menu-panel]'),
  };
}

test('sidebar opens modally, dismisses with Escape and backdrop, and restores focus with reduced motion', async () => {
  await withDOM('/', async (win, doc) => {
    const { dialog, trigger, toggle } = await menuFixture(win, doc, true);
    assert.equal(trigger.hidden, false);
    assert.equal(doc.querySelector('[data-menu-fallback]').hidden, true);
    trigger.click();
    assert.equal(dialog.open, true);
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(doc.activeElement, toggle);
    assert.ok(doc.documentElement.classList.contains('menu-open'));
    const cancel = new win.Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    assert.equal(cancel.defaultPrevented, true);
    assert.equal(dialog.open, false);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(doc.activeElement, trigger);
    assert.equal(doc.documentElement.classList.contains('menu-open'), false);
    trigger.click();
    doc.querySelector('[data-menu-backdrop]').click();
    assert.equal(dialog.open, false);
  });
});

test('the sidebar spring can reverse mid-close without jumping or losing its modal state', async () => {
  await withDOM('/', async (win, doc) => {
    const { dialog, trigger, toggle, panel, advance, frames } = await menuFixture(win, doc, false);
    trigger.click();
    advance(30);
    toggle.click();
    advance(4);
    const presentation = panel.style.transform;
    assert.equal(toggle.getAttribute('aria-label'), 'Reopen menu');
    toggle.click();
    assert.equal(
      panel.style.transform,
      presentation,
      'Retargeting must retain the current presentation value.',
    );
    assert.equal(dialog.open, true);
    advance(100);
    assert.equal(panel.style.transform, 'translate3d(0%, 0, 0)');
    assert.equal(dialog.open, true);
    toggle.click();
    advance(100);
    assert.equal(dialog.open, false);
    assert.equal(doc.activeElement, trigger);
    trigger.click();
    advance(3);
    win.dispatchEvent(new win.Event('pagehide'));
    assert.equal(dialog.open, false);
    assert.equal(frames.size, 0);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  });
});

test('navigation degrades to footer links when native modal support is unavailable', async () => {
  await withDOM('/', async (_win, doc) => {
    const dialog = doc.querySelector('#site-menu');
    dialog.showModal = undefined;
    (await loadScript('menu')).setupMenu();
    assert.equal(doc.querySelector('[data-menu-open]').hidden, true);
    assert.equal(doc.querySelector('[data-menu-fallback]').hidden, false);
    assert.equal(
      doc.querySelector('[data-menu-fallback]').getAttribute('href'),
      '#footer-navigation',
    );
    const footerLinks = [...doc.querySelectorAll('#footer-navigation a')].map((link) =>
      link.getAttribute('href'),
    );
    for (const href of ['/', '/services/', '/pricing/', '/about/', '/contact/'])
      assert.ok(footerLinks.includes(href), `footer navigation must include ${href}`);
  });
});

test('the home page leads with the audit request and keeps detail on separate routes', async () => {
  const home = await page('/');
  const main = home.window.document.querySelector('main');
  const action = main.querySelector('.hero .audit-button');
  assert.equal(action.getAttribute('href'), '/contact/');
  assert.equal(action.textContent.trim(), 'Request a free audit');
  assert.equal(main.querySelectorAll('form,.price-card').length, 0);
  // The services index links every service to its own section.
  assert.equal(main.querySelectorAll('.service-index a[href^="/services/#"]').length, 6);
  const pricing = await page('/pricing/');
  assert.equal(pricing.window.document.querySelectorAll('.price-card').length, 3);
  assert.equal(pricing.window.document.querySelectorAll('.faq').length, 8);
  for (const details of pricing.window.document.querySelectorAll('details'))
    assert.equal(details.firstElementChild.tagName, 'SUMMARY');
  const contact = await page('/contact/');
  const intro = contact.window.document.querySelector('.contact-intro').textContent;
  assert.match(intro, /free/);
  assert.match(intro, /no obligation/);
  home.window.close();
  pricing.window.close();
  contact.window.close();
});

test('the founder is named, and no photo or placeholder appears until a real one is configured', async () => {
  const about = await page('/about/');
  const doc = about.window.document;
  assert.match(doc.querySelector('#founder-heading').textContent, /Oliver Burns/);
  assert.equal(doc.querySelectorAll('main img').length, 0);
  about.window.close();
});

test('axe finds no detectable WCAG A/AA semantic violations in all nine documents (contrast excluded)', async () => {
  for (const route of routes) {
    const dom = await page(route);
    // jsdom has no rendering canvas. Contrast is checked separately from tokens.
    dom.window.HTMLCanvasElement.prototype.getContext = () => null;
    dom.window.eval(axe.source);
    const result = await dom.window.axe.run(dom.window.document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    assert.equal(
      result.violations.length,
      0,
      `${route}: ${JSON.stringify(result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })))}`,
    );
    dom.window.close();
  }
});

test('launch defaults prevent indexing and omit unconfirmed canonical domains', async () => {
  for (const route of routes) {
    const dom = await page(route);
    assert.equal(
      dom.window.document.querySelector('meta[name="robots"]').content,
      'noindex, nofollow',
    );
    assert.equal(dom.window.document.querySelector('link[rel="canonical"]'), null);
    dom.window.close();
  }
  assert.match(await readFile(join(root, 'robots.txt'), 'utf8'), /Disallow: \/\n/);
  assert.doesNotMatch(await readFile(join(root, 'sitemap.xml'), 'utf8'), /<loc>/);
});

test('critical text and button colour pairs meet WCAG AA contrast', () => {
  const luminance = (hex) => {
    const rgb = hex
      .match(/[a-f\d]{2}/gi)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const [foreground, background] of [
    ['282828', 'f8f7f3'],
    ['60605b', 'f8f7f3'],
    ['a5482c', 'f8f7f3'],
    ['fffefa', '282828'],
    ['fffefa', '3d3d3a'],
    ['60605b', 'fffefa'],
    ['60605b', 'efeee8'],
    ['282828', 'efeee8'],
    ['a5482c', 'efeee8'],
    ['a33328', 'fffefa'],
    ['60605b', 'f3f2ec'],
    ['60605b', 'f3e9de'],
    ['a5482c', 'fffefa'],
  ]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `${foreground} on ${background}`);
  }
});

test('generated output contains no inline scripts or styles incompatible with the configured CSP', async () => {
  for (const route of routes) {
    const dom = await page(route);
    assert.equal(
      dom.window.document.querySelectorAll(
        'script:not([src]), style, [style], [onclick], [onsubmit]',
      ).length,
      0,
      route,
    );
    dom.window.close();
  }
});

test('runtime JavaScript is small and no private details or false credibility appear in the build', async () => {
  const files = await readdir(join(root, '_astro'));
  const scripts = files.filter((file) => file.endsWith('.js'));
  let total = 0;
  for (const file of scripts) total += (await stat(join(root, '_astro', file))).size;
  assert.ok(total < 20000, `runtime JS is ${total} bytes`);
  for (const route of routes) {
    const dom = await page(route);
    const text = dom.window.document.body.textContent;
    assert.doesNotMatch(
      text,
      /award-winning|trusted by|Google Certified|Google Partner|unlock your digital potential|30-minute|—/i,
      route,
    );
    for (const link of dom.window.document.querySelectorAll('a[href^="mailto:"]'))
      assert.equal(link.getAttribute('href'), 'mailto:contact@presencewebservices.co.uk');
    assert.equal(dom.window.document.querySelectorAll('a[href^="tel:"]').length, 0);
    dom.window.close();
  }
});

test('all six service areas have an enquiry route and pricing retains scope qualifications', async () => {
  const dom = await page('/services/');
  for (const id of [
    'website-creation',
    'website-management',
    'google-business-profile',
    'review-support',
    'enquiry-improvements',
    'reporting',
  ]) {
    const service = dom.window.document.getElementById(id);
    assert.ok(service, id);
    assert.ok(service.querySelector('a[href^="/contact/"]'), `${id} needs a relevant next step`);
  }
  assert.match(
    dom.window.document.getElementById('website-creation').textContent,
    /quoted separately/,
  );
  dom.window.close();
  const pricing = await page('/pricing/');
  assert.equal(pricing.window.document.querySelectorAll('.faq').length, 8);
  const prices = [...pricing.window.document.querySelectorAll('.price')].map((node) =>
    node.textContent.trim(),
  );
  assert.match(prices[0], /149/);
  assert.match(prices[1], /129/);
  const websiteCard = pricing.window.document.querySelectorAll('.price-card')[2];
  assert.match(websiteCard.textContent, /separate quote/);
  assert.equal(
    websiteCard.querySelector('.button').getAttribute('href'),
    '/contact/?service=new-website',
  );
  assert.ok(
    pricing.window.document
      .querySelector('.agreement-details')
      .textContent.includes('cancellation terms'),
  );
  pricing.window.close();
});

test('self-hosted font files reach the browser through the Sites Worker', async () => {
  const fonts = (await readdir(join(root, '_astro'))).filter((file) => file.endsWith('.woff2'));
  assert.ok(fonts.length > 0, 'The Inter stylesheet must emit font files.');
  const assets = readAssets(root);
  for (const file of fonts) {
    const response = await handleRequest(
      new Request(`https://presence.test/_astro/${file}`),
      { DEPLOYMENT_STAGE: 'staging' },
      assets,
    );
    assert.equal(response.status, 200, file);
    assert.equal(response.headers.get('Content-Type'), 'font/woff2', file);
    assert.deepEqual(
      Buffer.from(await response.arrayBuffer()),
      await readFile(join(root, '_astro', file)),
      file,
    );
    assert.match(response.headers.get('Cache-Control'), /immutable/);
  }
});

test('the privacy policy contains every UK GDPR Article 13 element and matches the code', async () => {
  const dom = await page('/privacy/');
  const text = dom.window.document.querySelector('main').textContent.replace(/\s+/g, ' ');
  const required = [
    /controller/i, // Art 13(1)(a) identity and contact details
    /contact@presencewebservices\.co\.uk/,
    /data protection officer/i, // Art 13(1)(b) (none required, stated)
    /Article 6\(1\)\(b\)/, // Art 13(1)(c) purposes and lawful bases
    /legitimate interests/i, // Art 13(1)(d)
    /Resend/, // Art 13(1)(e) recipients
    /Data Privacy Framework/, // Art 13(1)(f) transfers and safeguards
    /copy of it/i,
    /12 months/, // Art 13(2)(a) retention
    /Rectification/, // Art 13(2)(b) rights
    /Data portability/,
    /acknowledge your complaint within 30 days/, // Art 13(2)(ca), DPA 2018 s.164A
    /ico\.org\.uk/, // Art 13(2)(d) complaint to the regulator
    /not under any legal or contractual obligation/, // Art 13(2)(e)
    /solely on automated processing/, // Art 13(2)(f)
  ];
  for (const pattern of required) assert.match(text, pattern, String(pattern));
  // The cookie described must be the one the server actually sets.
  const runtime = await readFile('server/runtime.ts', 'utf8');
  const cookie = runtime.match(/const cookieName = '([^']+)'/)[1];
  assert.match(text, new RegExp(cookie));
  assert.match(runtime, /Max-Age=600/);
  assert.match(text, /10 minutes/);
  // The stated retention must match the configured retention.
  const config = await readFile('src/config/business.ts', 'utf8');
  assert.match(config, /enquiryRetentionDays: 365/);
  dom.window.close();
});

test('the terms make the required trader disclosures and consumer information available', async () => {
  const dom = await page('/terms/');
  const doc = dom.window.document;
  const text = doc.querySelector('main').textContent.replace(/\s+/g, ' ');
  for (const pattern of [
    /Oliver James Burns/, // PSR reg 8(1)(a), E-Commerce reg 6(1)(a)
    /sole trader/, // PSR reg 8(1)(b)
    /279 Lower Braniel Road/, // PSR reg 8(1)(c), E-Commerce reg 6(1)(b)
    /not registered for VAT/, // PSR reg 8(1)(g), E-Commerce reg 6(2)
    /law of Northern Ireland/, // PSR reg 8(1)(j)
    /after-sales warranty/, // PSR reg 8(1)(k)
    /cancel the contract within 14 days/, // Consumer Contracts Regulations 2013
    /not a member of any alternative dispute resolution scheme/, // DMCC Act 2024 s.308
    /Late Payment of Commercial Debts/,
    /death or personal injury caused by our negligence/, // UCTA 1977 s.2(1)
    /Contracts \(Rights of Third Parties\) Act 1999 does not apply/,
  ])
    assert.match(text, pattern, String(pattern));
  // UK GDPR Article 28(3)(a) to (h): all eight processor obligations are listed.
  assert.equal(doc.querySelectorAll('#data-processing ol > li').length, 8);
  assert.match(
    doc.getElementById('cancellation-form').textContent,
    /hereby give notice that I cancel/,
  );
  dom.window.close();
});

test('public launch is blocked until a business phone number is configured', async () => {
  const config = await readFile('src/config/business.ts', 'utf8');
  const required = config.slice(config.indexOf('const required = ['), config.indexOf('] as const'));
  assert.match(required, /'telephone'/);
});
