import { _ as __astro_tag_component__, f as createVNode, F as Fragment } from '../chunks/astro/server_BPXzsi7f.mjs';
import { $ as $$MarkdownLayout } from '../chunks/MarkdownLayout_l-J29eKh.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const MDXLayout = function ({children}) {
  const {layout, ...content} = frontmatter;
  content.file = file;
  content.url = url;
  return createVNode($$MarkdownLayout, {
    file,
    url,
    content,
    frontmatter: content,
    headings: getHeadings(),
    'server:root': true,
    children
  });
};
const frontmatter = {
  "layout": "../layouts/MarkdownLayout.astro",
  "title": "Impressum"
};
function getHeadings() {
  return [];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    p: "p",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode("h1", {
      children: "Impressum"
    }), "\n", createVNode("p", {
      children: ["Silas Kruckenberg", createVNode("br", {}), "\nUniversitätsallee 1", createVNode("br", {}), "\n21335 Lüneburg"]
    }), "\n", createVNode("h3", {
      children: "Kontakt"
    }), "\n", createVNode("p", {
      children: createVNode(_components.p, {
        children: ["E-Mail: ", createVNode("a", {
          href: "mailto:ignite.startupclub@gmail.com",
          children: createVNode(_components.a, {
            href: "mailto:ignite.startupclub@gmail.com",
            children: "ignite.startupclub@gmail.com"
          })
        })]
      })
    }), "\n", createVNode("h3", {
      children: "Redaktionell verantwortlich"
    }), "\n", createVNode("p", {
      children: "Silas Kruckenberg"
    }), "\n", createVNode("h3", {
      children: "Verbraucher­streit­beilegung/Universal­schlichtungs­stelle"
    }), "\n", createVNode("p", {
      children: createVNode(_components.p, {
        children: "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
      })
    })]
  });
}
function MDXContent(props = {}) {
  return createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  });
}

const url = "/impressum";
const file = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/impressum.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/impressum.mdx";
__astro_tag_component__(Content, 'astro:jsx');

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Content,
	default: Content,
	file,
	frontmatter,
	getHeadings,
	url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
