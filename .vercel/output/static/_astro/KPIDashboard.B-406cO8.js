import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as a}from"./index.WFquGv8Z.js";const g=[{value:11,label:"Veranstaltungen",icon:"calendar",suffix:"+"},{value:15,label:"Teammitglieder",icon:"users"},{value:2e3,label:"Erreichte Menschen",icon:"heart",suffix:"+"},{value:5,label:"Partner",icon:"building",suffix:"+"}],u="Unsere Wirkung",m="Was wir gemeinsam erreicht haben",p={calendar:()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),e.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),e.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]}),users:()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]}),heart:()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"})}),book:()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M4 19.5A2.5 2.5 0 0 1 6.5 17H20"}),e.jsx("path",{d:"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"})]}),building:()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"4",y:"2",width:"16",height:"20",rx:"2",ry:"2"}),e.jsx("path",{d:"M9 22v-4h6v4"}),e.jsx("path",{d:"M8 6h.01"}),e.jsx("path",{d:"M16 6h.01"}),e.jsx("path",{d:"M12 6h.01"}),e.jsx("path",{d:"M12 10h.01"}),e.jsx("path",{d:"M12 14h.01"}),e.jsx("path",{d:"M16 10h.01"}),e.jsx("path",{d:"M16 14h.01"}),e.jsx("path",{d:"M8 10h.01"}),e.jsx("path",{d:"M8 14h.01"})]}),star:()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"})})};function k(r,t=2e3,n=!1){const[i,s]=a.useState(0);return a.useEffect(()=>{if(!n)return;let d=null,o=null;const l=c=>{d||(d=c);const h=Math.min((c-d)/t,1),x=1-Math.pow(1-h,4);s(Math.floor(x*r)),h<1&&(o=requestAnimationFrame(l))};return o=requestAnimationFrame(l),()=>{o&&cancelAnimationFrame(o)}},[r,t,n]),i}function f({item:r,isVisible:t}){const n=k(r.value,2e3,t),i=p[r.icon]||p.star;return e.jsxs("div",{className:"kpi-card",children:[e.jsx("div",{className:"kpi-icon",children:e.jsx(i,{})}),e.jsxs("div",{className:"kpi-value",children:[n,r.suffix||""]}),e.jsx("div",{className:"kpi-label",children:r.label})]})}function v(){const[r,t]=a.useState(!1),n=a.useRef(null);return a.useEffect(()=>{const i=new IntersectionObserver(([s])=>{s.isIntersecting&&(t(!0),i.disconnect())},{threshold:.2});return n.current&&i.observe(n.current),()=>i.disconnect()},[]),e.jsxs("section",{className:"kpi-section",ref:n,children:[e.jsxs("div",{className:"kpi-container",children:[e.jsxs("div",{className:"kpi-header",children:[e.jsx("h2",{className:"kpi-heading",children:u}),e.jsx("p",{className:"kpi-subheading",children:m})]}),e.jsx("div",{className:"kpi-grid",children:g.map((i,s)=>e.jsx(f,{item:i,isVisible:r},s))})]}),e.jsx("style",{children:`
        .kpi-section {
          z-index: 40;
        }

        .kpi-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .kpi-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .kpi-heading {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--font-color, #333);
        }

        .kpi-subheading {
          font-size: 1.25rem;
          color: var(--neutral-400, #666);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .kpi-card {
          background: var(--background, #fff);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(140, 57, 116, 0.15);
        }

        .kpi-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #8C3974 0%, #a8457d 100%);
          border-radius: 50%;
          margin-bottom: 1rem;
          color: white;
        }

        .kpi-value {
          font-size: 3rem;
          font-weight: 800;
          color: #8C3974;
          line-height: 1.2;
        }

        .kpi-label {
          font-size: 1rem;
          color: var(--neutral-400, #666);
          margin-top: 0.5rem;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .kpi-section {
            padding: 3rem 0;
          }

          .kpi-heading {
            font-size: 2rem;
          }

          .kpi-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .kpi-card {
            padding: 1.5rem;
          }

          .kpi-value {
            font-size: 2.5rem;
          }
        }

        /* Dark mode support */
        .darkmode .kpi-section {
          background: linear-gradient(135deg, rgba(140, 57, 116, 0.1) 0%, rgba(140, 57, 116, 0.15) 100%);
        }

        .darkmode .kpi-card {
          background: var(--dark-100, #1a1a1a);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .darkmode .kpi-card:hover {
          box-shadow: 0 8px 30px rgba(140, 57, 116, 0.25);
        }
      `})]})}export{v as default};
