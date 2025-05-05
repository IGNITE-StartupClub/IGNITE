import { c as createComponent, r as renderComponent, b as renderTemplate, u as unescapeHTML } from '../chunks/astro/server_BR_yo3lg.mjs';
import 'kleur/colors';
import { $ as $$MarkdownLayout } from '../chunks/MarkdownLayout_BZhC36Z9.mjs';
export { renderers } from '../renderers.mjs';

const html = () => "<h1 id=\"markdown-page\">Markdown Page</h1>\n<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae veniam repellat deleniti obcaecati facilis non, praesentium aperiam laudantium excepturi assumenda doloremque animi quis aliquam eligendi quia nemo asperiores et eaque, sunt voluptatibus, saepe exercitationem id. Quis sequi maxime fugiat nam reprehenderit nesciunt quaerat obcaecati, ipsa dignissimos voluptatum voluptatem, optio quidem quos repudiandae dolorem voluptatibus fuga officia odio nemo recusandae voluptas.</p>\n<pre class=\"astro-code github-dark\" style=\"background-color:#24292e;color:#e1e4e8; overflow-x: auto;\" tabindex=\"0\" data-language=\"js\"><code><span class=\"line\"><span style=\"color:#E1E4E8\">console.</span><span style=\"color:#B392F0\">log</span><span style=\"color:#E1E4E8\">(</span><span style=\"color:#9ECBFF\">'Hello Accessible World!'</span><span style=\"color:#E1E4E8\">)</span></span></code></pre>\n<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae veniam repellat deleniti obcaecati facilis non, praesentium aperiam laudantium excepturi assumenda doloremque animi quis aliquam eligendi quia nemo asperiores et eaque, sunt voluptatibus, saepe exercitationem id. Quis sequi maxime fugiat nam reprehenderit nesciunt quaerat obcaecati, ipsa dignissimos voluptatum voluptatem, optio quidem quos repudiandae dolorem voluptatibus fuga officia odio nemo recusandae voluptas.</p>\n<p><a href=\"https://github.com/markteekman/accessible-astro-starter\">Get this theme on GitHub</a></p>";

				const frontmatter = {"layout":"../layouts/MarkdownLayout.astro","title":"Markdown Page"};
				const file = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/markdown-page.md";
				const url = "/markdown-page";
				function rawContent() {
					return "   \n                                       \n                    \n   \n\n# Markdown Page\n\nLorem ipsum dolor sit amet consectetur adipisicing elit. Vitae veniam repellat deleniti obcaecati facilis non, praesentium aperiam laudantium excepturi assumenda doloremque animi quis aliquam eligendi quia nemo asperiores et eaque, sunt voluptatibus, saepe exercitationem id. Quis sequi maxime fugiat nam reprehenderit nesciunt quaerat obcaecati, ipsa dignissimos voluptatum voluptatem, optio quidem quos repudiandae dolorem voluptatibus fuga officia odio nemo recusandae voluptas.\n\n```js\nconsole.log('Hello Accessible World!')\n```\n\nLorem ipsum dolor sit amet consectetur adipisicing elit. Vitae veniam repellat deleniti obcaecati facilis non, praesentium aperiam laudantium excepturi assumenda doloremque animi quis aliquam eligendi quia nemo asperiores et eaque, sunt voluptatibus, saepe exercitationem id. Quis sequi maxime fugiat nam reprehenderit nesciunt quaerat obcaecati, ipsa dignissimos voluptatum voluptatem, optio quidem quos repudiandae dolorem voluptatibus fuga officia odio nemo recusandae voluptas.\n\n[Get this theme on GitHub](https://github.com/markteekman/accessible-astro-starter)\n";
				}
				async function compiledContent() {
					return await html();
				}
				function getHeadings() {
					return [{"depth":1,"slug":"markdown-page","text":"Markdown Page"}];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`${renderComponent(result, 'Layout', $$MarkdownLayout, {
								file,
								url,
								content,
								frontmatter: content,
								headings: getHeadings(),
								rawContent,
								compiledContent,
								'server:root': true,
							}, {
								'default': () => renderTemplate`${unescapeHTML(html())}`
							})}`;
				});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Content,
	compiledContent,
	default: Content,
	file,
	frontmatter,
	getHeadings,
	rawContent,
	url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
