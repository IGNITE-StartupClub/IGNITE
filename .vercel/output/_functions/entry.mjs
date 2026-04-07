import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_Grfx94II.mjs';
import { manifest } from './manifest_xObagw1s.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/accessible-components.astro.mjs');
const _page4 = () => import('./pages/api/confirm.astro.mjs');
const _page5 = () => import('./pages/api/contact.astro.mjs');
const _page6 = () => import('./pages/api/contact-config.astro.mjs');
const _page7 = () => import('./pages/api/db-report.astro.mjs');
const _page8 = () => import('./pages/api/feedback.astro.mjs');
const _page9 = () => import('./pages/api/health.astro.mjs');
const _page10 = () => import('./pages/api/newsletter.astro.mjs');
const _page11 = () => import('./pages/api/newsletter01.astro.mjs');
const _page12 = () => import('./pages/api/questionnaire-config.astro.mjs');
const _page13 = () => import('./pages/api/submit.astro.mjs');
const _page14 = () => import('./pages/api/subscribe.astro.mjs');
const _page15 = () => import('./pages/api/unsubscribe.astro.mjs');
const _page16 = () => import('./pages/datenschutz.astro.mjs');
const _page17 = () => import('./pages/feedback.astro.mjs');
const _page18 = () => import('./pages/igniteworkshops.astro.mjs');
const _page19 = () => import('./pages/impressum.astro.mjs');
const _page20 = () => import('./pages/kontakt.astro.mjs');
const _page21 = () => import('./pages/materialien/_material_.astro.mjs');
const _page22 = () => import('./pages/materialien/_---page_.astro.mjs');
const _page23 = () => import('./pages/mdx-page copy.astro.mjs');
const _page24 = () => import('./pages/mitmachen.astro.mjs');
const _page25 = () => import('./pages/news/_project_.astro.mjs');
const _page26 = () => import('./pages/news/_---page_.astro.mjs');
const _page27 = () => import('./pages/peer-to-peer.astro.mjs');
const _page28 = () => import('./pages/robots.txt.astro.mjs');
const _page29 = () => import('./pages/stakeholder-journey.astro.mjs');
const _page30 = () => import('./pages/subscribe.astro.mjs');
const _page31 = () => import('./pages/team.astro.mjs');
const _page32 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/accessible-components.astro", _page3],
    ["src/pages/api/confirm.ts", _page4],
    ["src/pages/api/contact.ts", _page5],
    ["src/pages/api/contact-config.ts", _page6],
    ["src/pages/api/db-report.ts", _page7],
    ["src/pages/api/feedback.ts", _page8],
    ["src/pages/api/health.ts", _page9],
    ["src/pages/api/newsletter.ts", _page10],
    ["src/pages/api/newsletter01.ts", _page11],
    ["src/pages/api/questionnaire-config.ts", _page12],
    ["src/pages/api/submit.ts", _page13],
    ["src/pages/api/subscribe.ts", _page14],
    ["src/pages/api/unsubscribe.ts", _page15],
    ["src/pages/datenschutz.mdx", _page16],
    ["src/pages/feedback.astro", _page17],
    ["src/pages/IGNITEWorkshops.mdx", _page18],
    ["src/pages/impressum.mdx", _page19],
    ["src/pages/kontakt.astro", _page20],
    ["src/pages/materialien/[material].astro", _page21],
    ["src/pages/materialien/[...page].astro", _page22],
    ["src/pages/mdx-page copy.mdx", _page23],
    ["src/pages/mitmachen.astro", _page24],
    ["src/pages/news/[project].astro", _page25],
    ["src/pages/news/[...page].astro", _page26],
    ["src/pages/peer-to-peer.mdx", _page27],
    ["src/pages/robots.txt.ts", _page28],
    ["src/pages/stakeholder-journey.astro", _page29],
    ["src/pages/subscribe.astro", _page30],
    ["src/pages/team.astro", _page31],
    ["src/pages/index.astro", _page32]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "64695436-3095-4260-86f6-1d3f860f59b1",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
