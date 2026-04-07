import{j as n}from"./jsx-runtime.D_zvdyIk.js";import{r as o}from"./index.WFquGv8Z.js";const k=[{id:"ignite-events",image:"",category:"extern",team:"IGNITE Events",title:"Events Team",description:"Organisiert Workshops, Hackathons, Startup-Breakfasts und Networking-Events. Verantwortlich für alle öffentlichen Veranstaltungen und Community-Building."},{id:"ignite-relations",image:"",category:"extern",team:"IGNITE Relations & Cooperations",title:"Relations Team",description:"Baut Kontakte zu Organisationen, Unternehmen und dem Advisory Board Mitgliedern auf. Koordiniert Partnerschaften und externe Beziehungen."},{id:"ignite-marketing",image:"",category:"extern",team:"IGNITE Marketing",title:"Marketing Team",description:"Sorgt für Sichtbarkeit durch Social Media, Website, Newsletter und physische Präsenz an der Uni. Erstellt Content und Werbematerial."},{id:"ignite-hr",image:"",category:"intern",team:"IGNITE Human Resources",title:"People Team",description:"Organisiert Recruiting, Info-Gesrpäche und Teambuilding. Ansprechpartner für interne Themen und Meetings."},{id:"ignite-finance-legal",image:"",category:"intern",team:"IGNITE Finance & Legal",title:"Finance & Legal Team",description:"Kümmert sich um Vereinsgründung, Buchhaltung, Budgetierung und Sponsorings. Verwaltet rechtliche und finanzielle Angelegenheiten."},{id:"ignite-quality-control",image:"",category:"intern",team:"IGNITE Quality & Control",title:"Process & Tools Team",description:"Wählt Tools aus, verwaltet Accounts und optimiert interne Arbeitsabläufe. Sorgt für effiziente Zusammenarbeit im Team."}],T={step1:{buttonText:"Bewerbung ausfüllen"},step2:{label:"Wähle 2-3 Teams:",minTeams:2,maxTeams:3,hintTooFew:"Bitte wähle mindestens 2 Teams aus.",hintMaximum:"Du hast die maximale Anzahl erreicht."},step3:{legend:"Was beschreibt deine Situation am besten?",options:[{value:"idea",label:"Ich habe eine Startup-Idee"},{value:"interest",label:"Ich interessiere mich für Startups"},{value:"learn",label:"Ich möchte mehr über Entrepreneurship lernen"},{value:"network",label:"Ich möchte mich vernetzen"}],questions:{}},step4:{questions:{}},step5:{questions:{}},step6:{fields:{name:{label:"Vorname",type:"text",required:!0},lastname:{label:"Nachname",type:"text",required:!0},email:{label:"E-Mail",type:"email",required:!0}}},allQuestions:[]};function E({initialPosition:w=""}){const[u,h]=o.useState(1),[r]=o.useState(T),[g]=o.useState(!1),[a,d]=o.useState(()=>({teams:[],startupInterest:"",name:"",lastname:"",email:"",subscribeNewsletter:!1}));o.useEffect(()=>{r&&r.allQuestions&&d(t=>{const e={...t};return r.allQuestions.forEach(i=>{i in e||(e[i]="")}),e})},[r]);const[b,x]=o.useState(!1),[p,m]=o.useState(!1),s=t=>{const{name:e,value:i}=t.target;d(l=>({...l,[e]:i}))},f=t=>{d(e=>{const i=e.teams||[],l=r?.step2?.maxTeams||3;return i.includes(t)?{...e,teams:i.filter(j=>j!==t)}:i.length>=l?e:{...e,teams:[...i,t]}})},y=t=>!r||t===3?!0:t===4?Object.keys(r.step4?.questions||{}).length>0:t===5?Object.keys(r.step5?.questions||{}).length>0:!0,c=()=>{h(t=>{let e=t+1;for(;e<=6&&!y(e);)e++;return e})},v=async t=>{t.preventDefault(),m(!0);try{const e=await fetch("/api/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(!e.ok){const i=await e.json().catch(()=>({}));throw new Error(i.message||`Server-Fehler (${e.status})`)}x(!0)}catch(e){console.error("Error submitting application:",e),alert(`Es gab einen Fehler beim Absenden: ${e.message}

Bitte versuche es erneut oder schreib uns direkt an.`)}finally{m(!1)}};return g||!r?n.jsx("p",{children:"Lädt Fragebogen..."}):b?n.jsx("p",{children:"Danke für deine Anfrage! Wir freuen uns über dein Interesse und melden uns bald bei dir."}):n.jsxs("form",{id:"application-form",onSubmit:v,className:"questionnaire",children:[u===1&&n.jsx("button",{type:"button",className:"button secondary",onClick:c,children:r.step1?.buttonText||"Jetzt mitmachen"}),u===2&&n.jsxs(n.Fragment,{children:[n.jsxs("div",{children:[n.jsx("label",{style:{marginBottom:"1rem"},children:r.step2?.label||"Wähle 2-3 Teams:"}),n.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:k.map(t=>n.jsxs("label",{style:{display:"flex",alignItems:"center",cursor:"pointer",flexDirection:"row"},children:[n.jsx("input",{type:"checkbox",checked:a.teams.includes(t.id),onChange:()=>f(t.id),style:{flexShrink:0,cursor:"pointer"}}),n.jsx("span",{style:{paddingLeft:"0.75rem",fontSize:"1.2rem",fontWeight:"600",lineHeight:"1.3"},children:t.team})]},t.id))}),a.teams.length<(r.step2?.minTeams||2)&&n.jsx("p",{style:{marginTop:"1rem",fontSize:"0.9rem",color:"var(--neutral-100)",textAlign:"left"},children:r.step2?.hintTooFew||"Bitte wähle mindestens 2 Teams aus."}),a.teams.length===(r.step2?.maxTeams||3)&&n.jsx("p",{style:{marginTop:"1rem",fontSize:"0.9rem",color:"var(--neutral-100)",textAlign:"left"},children:r.step2?.hintMaximum||"Du hast die maximale Anzahl erreicht."})]}),n.jsx("button",{type:"button",className:"button secondary",onClick:c,disabled:a.teams.length<(r.step2?.minTeams||2),children:"Weiter"})]}),u===3&&n.jsxs(n.Fragment,{children:[n.jsxs("fieldset",{style:{border:"none",padding:0},children:[n.jsx("legend",{style:{fontWeight:500,marginBottom:"0.75rem",textAlign:"left"},children:r.step3?.legend||"Was beschreibt deine Situation am besten?"}),n.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem",alignItems:"flex-start"},children:(r.step3?.options||[]).map(t=>n.jsxs("label",{style:{display:"flex",alignItems:"center",cursor:"pointer",flexDirection:"row"},children:[n.jsx("input",{type:"radio",name:"startupInterest",value:t.value,checked:a.startupInterest===t.value,onChange:s,style:{flexShrink:0}}),n.jsx("span",{style:{paddingLeft:"0.75rem"},children:t.label})]},t.value))})]}),Object.keys(r.step3?.questions||{}).map(t=>{const e=r.step3.questions[t];return n.jsxs("label",{children:[e.label,e.fieldType==="select"?n.jsxs("select",{name:t,value:a[t]||"",onChange:s,required:e.required,children:[n.jsx("option",{value:"",children:e.placeholder||"Bitte wählen..."}),(e.options||[]).map((i,l)=>n.jsx("option",{value:i.value,children:i.label},l))]}):e.fieldType==="text"||e.fieldType==="email"?n.jsx("input",{type:e.fieldType,name:t,value:a[t]||"",onChange:s,required:e.required,placeholder:e.placeholder||""}):n.jsx("textarea",{name:t,value:a[t]||"",onChange:s,required:e.required,rows:e.rows,placeholder:e.placeholder||""})]},t)}),n.jsx("button",{type:"button",className:"button secondary",onClick:c,disabled:!a.startupInterest||Object.keys(r.step3?.questions||{}).some(t=>r.step3.questions[t].required&&!a[t]?.trim()),children:"Weiter"})]}),u===4&&Object.keys(r.step4?.questions||{}).length>0&&n.jsxs(n.Fragment,{children:[Object.keys(r.step4.questions).map(t=>{const e=r.step4.questions[t];return n.jsxs("label",{children:[e.label,e.fieldType==="select"?n.jsxs("select",{name:t,value:a[t]||"",onChange:s,required:e.required,children:[n.jsx("option",{value:"",children:e.placeholder||"Bitte wählen..."}),(e.options||[]).map((i,l)=>n.jsx("option",{value:i.value,children:i.label},l))]}):e.fieldType==="text"||e.fieldType==="email"?n.jsx("input",{type:e.fieldType,name:t,value:a[t]||"",onChange:s,required:e.required,placeholder:e.placeholder||""}):n.jsx("textarea",{name:t,value:a[t]||"",onChange:s,required:e.required,rows:e.rows,placeholder:e.placeholder||""})]},t)}),n.jsx("button",{type:"button",className:"button secondary",onClick:c,disabled:Object.keys(r.step4.questions).some(t=>r.step4.questions[t].required&&!a[t]?.trim()),children:"Weiter"})]}),u===5&&Object.keys(r.step5?.questions||{}).length>0&&n.jsxs(n.Fragment,{children:[Object.keys(r.step5.questions).map(t=>{const e=r.step5.questions[t];return n.jsxs("label",{children:[e.label,e.fieldType==="select"?n.jsxs("select",{name:t,value:a[t]||"",onChange:s,required:e.required,children:[n.jsx("option",{value:"",children:e.placeholder||"Bitte wählen..."}),(e.options||[]).map((i,l)=>n.jsx("option",{value:i.value,children:i.label},l))]}):e.fieldType==="text"||e.fieldType==="email"?n.jsx("input",{type:e.fieldType,name:t,value:a[t]||"",onChange:s,required:e.required,placeholder:e.placeholder||""}):n.jsx("textarea",{name:t,value:a[t]||"",onChange:s,required:e.required,rows:e.rows,placeholder:e.placeholder||""})]},t)}),n.jsx("button",{type:"button",className:"button secondary",onClick:c,disabled:Object.keys(r.step5.questions).some(t=>r.step5.questions[t].required&&!a[t]?.trim()),children:"Weiter"})]}),u===6&&n.jsxs(n.Fragment,{children:[n.jsxs("label",{children:[r.step6?.fields?.name?.label||"Vorname",n.jsx("input",{type:"text",name:"name",value:a.name,onChange:s,required:r.step6?.fields?.name?.required!==!1})]}),n.jsxs("label",{children:[r.step6?.fields?.lastname?.label||"Nachname",n.jsx("input",{type:"text",name:"lastname",value:a.lastname,onChange:s,required:r.step6?.fields?.lastname?.required!==!1})]}),n.jsxs("label",{children:[r.step6?.fields?.email?.label||"E-Mail",n.jsx("input",{type:"email",name:"email",value:a.email,onChange:s,required:r.step6?.fields?.email?.required!==!1})]}),n.jsxs("label",{style:{display:"flex",alignItems:"center",cursor:"pointer",flexDirection:"row",marginTop:"1rem"},children:[n.jsx("input",{type:"checkbox",name:"subscribeNewsletter",checked:a.subscribeNewsletter,onChange:t=>d(e=>({...e,subscribeNewsletter:t.target.checked})),style:{flexShrink:0,cursor:"pointer"}}),n.jsx("span",{style:{paddingLeft:"0.75rem",fontSize:"1rem",fontWeight:"400"},children:"Ich möchte den IGNITE Newsletter abonnieren und über Events & Workshops informiert werden"})]}),n.jsx("button",{type:"submit",className:"button secondary",disabled:p,children:p?"Wird gesendet...":"Anfrage absenden"})]}),n.jsx("style",{children:`
        .questionnaire {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 1rem);
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 500;
        }
        select,
        textarea,
        input[type="text"],
        input[type="email"] {
          margin-top: 0.25rem;
          padding: 0.75rem;
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-sm, 4px);
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        input[type="text"]:focus,
        input[type="email"]:focus {
          border-color: var(--primary-400);
          outline: none;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
        }

        input::placeholder {
          color: var(--neutral-700);
          opacity: 1;
          font-style: italic;
          font-size: 0.95rem;
        }

        /* Better styling for checkboxes and radio buttons */
        input[type="checkbox"],
        input[type="radio"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--primary-400, #8c3974);
          border: 2px solid var(--neutral-400);
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        input[type="checkbox"]:checked,
        input[type="radio"]:checked {
          background-color: var(--primary-400);
          border-color: var(--primary-300);
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
        }

        input[type="checkbox"]:hover,
        input[type="radio"]:hover {
          border-color: var(--primary-400);
        }

        /* Textarea improvements */
        textarea {
          font-family: inherit;
          resize: vertical;
          min-height: 120px;
          font-size: 1rem;
          line-height: 1.6;
          padding: 0.75rem;
        }

        textarea::placeholder {
          color: var(--neutral-700);
          opacity: 1;
          font-style: italic;
          font-size: 0.95rem;
        }

        textarea:focus {
          border-color: var(--primary-400);
          outline: none;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
        }

        fieldset {
          margin: 0;
        }

        legend {
          padding: 0;
        }

        /* Basis-Styling für das Select */
        .questionnaire select {
          /* Entferne native Styles */
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;

          /* Farben und Rahmen */
          background-color: var(--neutral-100);
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-md, 8px);

          /* Innenabstand, damit Platz für Pfeil bleibt */
          padding: 0.5rem 2.5rem 0.5rem 0.75rem;
          font-size: var(--text-base, 1rem);
          color: var(--neutral-900);

          /* Übergang für Fokus */
          transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

          /* Eigenes Pfeil-Icon als SVG-Data-URI */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23333444' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
        }

        /* Hover- und Fokus-Styling */
        .questionnaire select:hover,
        .questionnaire select:focus {
          border-color: var(--primary-400);
          box-shadow: 0 0 0 3px rgba(102,51,153,0.2); /* lila Schatten */
          outline: none;
        }

        /* Optional: wenn disabled */
        .questionnaire select:disabled {
          background-color: var(--neutral-200);
          color: var(--neutral-500);
          cursor: not-allowed;
        }
        /* Light Mode Anpassungen */
        @media (prefers-color-scheme: light) {
          input, textarea {
            color: black; /* Schriftfarbe im Light Mode */
          }
        }
      `})]})}export{E as default};
