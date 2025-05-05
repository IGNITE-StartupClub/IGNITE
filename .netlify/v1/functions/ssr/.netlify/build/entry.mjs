import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_D32JYtoS.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/accessible-components.astro.mjs');
const _page3 = () => import('./pages/api/submit.astro.mjs');
const _page4 = () => import('./pages/blog_old/_post_.astro.mjs');
const _page5 = () => import('./pages/blog_old/_---page_.astro.mjs');
const _page6 = () => import('./pages/datenschutz.astro.mjs');
const _page7 = () => import('./pages/impressum.astro.mjs');
const _page8 = () => import('./pages/markdown-page.astro.mjs');
const _page9 = () => import('./pages/mdx-page.astro.mjs');
const _page10 = () => import('./pages/mitmachen.astro.mjs');
const _page11 = () => import('./pages/news/_project_.astro.mjs');
const _page12 = () => import('./pages/news/_---page_.astro.mjs');
const _page13 = () => import('./pages/team.astro.mjs');
const _page14 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/accessible-components.astro", _page2],
    ["src/pages/api/submit.ts", _page3],
    ["src/pages/blog_old/[post].astro", _page4],
    ["src/pages/blog_old/[...page].astro", _page5],
    ["src/pages/datenschutz.astro", _page6],
    ["src/pages/impressum.astro", _page7],
    ["src/pages/markdown-page.md", _page8],
    ["src/pages/mdx-page.mdx", _page9],
    ["src/pages/mitmachen.astro", _page10],
    ["src/pages/news/[project].astro", _page11],
    ["src/pages/news/[...page].astro", _page12],
    ["src/pages/team.astro", _page13],
    ["src/pages/index.astro", _page14]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "c96190e7-4dde-406b-a86b-c47220878887"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
