import { _ as __astro_tag_component__, e as createVNode, F as Fragment } from '../chunks/astro/server_BR_yo3lg.mjs';
import { $ as $$MarkdownLayout } from '../chunks/MarkdownLayout_BZhC36Z9.mjs';
import { m as $$Notification, h as $$Icon } from '../chunks/DefaultLayout_BE8JjL70.mjs';
/* empty css                                 */
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
  "title": "MDX Page"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "mdx-page",
    "text": "MDX Page"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    h1: "h1",
    p: "p",
    pre: "pre",
    span: "span",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "mdx-page",
      children: "MDX Page"
    }), "\n", createVNode($$Notification, {
      type: "info",
      children: [createVNode($$Icon, {
        name: "ion:information-circle-outline"
      }), createVNode("p", {
        children: createVNode(_components.p, {
          children: [createVNode("strong", {
            children: "Info:"
          }), " This page utilizes Astro’s MDX feature which let’s you use components in a markdown file and\nsupports out-of-the-box syntax highlighting with Shiki."]
        })
      })]
    }), "\n", createVNode(_components.p, {
      children: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae veniam repellat deleniti obcaecati facilis non, praesentium aperiam laudantium excepturi assumenda doloremque animi quis aliquam eligendi quia nemo asperiores et eaque, sunt voluptatibus, saepe exercitationem id. Quis sequi maxime fugiat nam reprehenderit nesciunt quaerat obcaecati, ipsa dignissimos voluptatum voluptatem, optio quidem quos repudiandae dolorem voluptatibus fuga officia odio nemo recusandae voluptas."
    }), "\n", createVNode(_components.pre, {
      class: "astro-code github-dark",
      style: {
        backgroundColor: "#24292e",
        color: "#e1e4e8",
        overflowX: "auto"
      },
      tabindex: "0",
      "data-language": "js",
      children: createVNode(_components.code, {
        children: createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "console."
          }), createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "log"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "("
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "'Hello Accessible World!'"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ")"
          })]
        })
      })
    }), "\n", createVNode(_components.p, {
      children: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae veniam repellat deleniti obcaecati facilis non, praesentium aperiam laudantium excepturi assumenda doloremque animi quis aliquam eligendi quia nemo asperiores et eaque, sunt voluptatibus, saepe exercitationem id. Quis sequi maxime fugiat nam reprehenderit nesciunt quaerat obcaecati, ipsa dignissimos voluptatum voluptatem, optio quidem quos repudiandae dolorem voluptatibus fuga officia odio nemo recusandae voluptas."
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.a, {
        href: "https://github.com/markteekman/accessible-astro-starter",
        children: "Get this theme on GitHub"
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

const url = "/mdx-page";
const file = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/mdx-page.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/mdx-page.mdx";
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
