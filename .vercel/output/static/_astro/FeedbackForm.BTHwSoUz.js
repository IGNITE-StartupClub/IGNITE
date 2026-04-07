import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as i}from"./index.WFquGv8Z.js";const k=[{id:"ssg-2026",name:"Student Startup Guide Event",date:"2026-01-14"}],j=s=>s.date?`${s.name} (${s.date})`:s.name;function w(){const[s,u]=i.useState({firstName:"",lastName:"",event:"",customEvent:"",feedback:"",eventSuggestion:"",subscribeNewsletter:!1,consentToPublish:!1,email:""}),[m,n]=i.useState(null),[a,h]=i.useState(!1),[b,x]=i.useState(!1),t=r=>{const{name:l,value:c,type:o,checked:d}=r.target;u(g=>({...g,[l]:o==="checkbox"?d:c}))},p=s.feedback.trim()||s.eventSuggestion.trim(),f=async r=>{if(r.preventDefault(),!p){n("validation");return}h(!0),n(null);try{const l=s.event==="other"?s.customEvent:s.event,c={firstName:s.firstName,lastName:s.lastName,event:l,feedback:s.feedback,eventSuggestion:s.eventSuggestion||void 0,consentToPublish:s.consentToPublish,subscribeNewsletter:s.subscribeNewsletter,email:s.subscribeNewsletter?s.email:void 0},o=await fetch("/api/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(c)});if(o.ok)n("success"),x(!0);else{const d=await o.json().catch(()=>({}));console.error("Error response:",d),n("error")}}catch(l){console.error("Error submitting feedback:",l),n("error")}finally{h(!1)}};return b?e.jsxs("div",{className:"feedback-success",children:[e.jsx("div",{className:"success-icon",children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"64",height:"64",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),e.jsx("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),e.jsx("h2",{children:"Vielen Dank für dein Feedback!"}),e.jsx("p",{children:"Deine Rückmeldung hilft uns, unsere Veranstaltungen noch besser zu machen."}),s.subscribeNewsletter&&e.jsx("p",{className:"newsletter-note",children:"Du erhältst in Kürze eine Bestätigungsmail für den Newsletter."}),e.jsx("a",{href:"/",className:"button color-secondary",children:"Zurück zur Startseite"}),e.jsx("style",{children:`
          .feedback-success {
            text-align: center;
            padding: 2rem;
          }
          .success-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #8C3974 0%, #a8457d 100%);
            border-radius: 50%;
            margin-bottom: 1.5rem;
            color: white;
          }
          .feedback-success h2 {
            color: #8C3974;
            margin-bottom: 1rem;
          }
          .feedback-success p {
            margin-bottom: 1rem;
            color: var(--font-color, #333);
          }
          .newsletter-note {
            font-size: 0.9rem;
            color: var(--neutral-400, #666);
            font-style: italic;
          }
        `})]}):e.jsxs("form",{onSubmit:f,className:"feedback-form",children:[e.jsxs("div",{className:"form-row",children:[e.jsxs("label",{className:"form-field",children:[e.jsxs("span",{className:"label-text",children:["Vorname",e.jsx("span",{className:"label-hint",children:"(optional)"})]}),e.jsx("input",{type:"text",name:"firstName",value:s.firstName,onChange:t,disabled:a,placeholder:"Max"})]}),e.jsxs("label",{className:"form-field",children:[e.jsxs("span",{className:"label-text",children:["Nachname",e.jsx("span",{className:"label-hint",children:"(optional, bleibt privat)"})]}),e.jsx("input",{type:"text",name:"lastName",value:s.lastName,onChange:t,disabled:a,placeholder:"Mustermann"})]})]}),e.jsxs("label",{className:"form-field",children:[e.jsxs("span",{className:"label-text",children:["Veranstaltung",e.jsx("span",{className:"label-hint",children:"(optional)"})]}),e.jsxs("select",{name:"event",value:s.event,onChange:t,disabled:a,children:[e.jsx("option",{value:"",children:"Bitte wählen..."}),k.map(r=>e.jsx("option",{value:r.name,children:j(r)},r.id)),e.jsx("option",{value:"other",children:"Andere Veranstaltung..."})]})]}),s.event==="other"&&e.jsxs("label",{className:"form-field",children:[e.jsx("span",{className:"label-text",children:"Name der Veranstaltung"}),e.jsx("input",{type:"text",name:"customEvent",value:s.customEvent,onChange:t,disabled:a,placeholder:"z.B. Startup Weekend 2024"})]}),e.jsxs("label",{className:"form-field",children:[e.jsxs("span",{className:"label-text",children:["Dein Feedback",e.jsx("span",{className:"label-hint",children:"(optional)"})]}),e.jsx("textarea",{name:"feedback",value:s.feedback,onChange:t,disabled:a,rows:5,placeholder:"Was hat dir gefallen? Was können wir verbessern?"})]}),e.jsxs("label",{className:"form-field",children:[e.jsxs("span",{className:"label-text",children:["Event-Vorschlag",e.jsx("span",{className:"label-hint",children:"(optional)"})]}),e.jsx("textarea",{name:"eventSuggestion",value:s.eventSuggestion,onChange:t,disabled:a,rows:3,placeholder:"Welche Events wünschst du dir? z.B. Workshop zu KI, Networking-Abend, Gründer-Stammtisch..."})]}),e.jsxs("div",{className:"checkbox-group",children:[e.jsxs("label",{className:"checkbox-field",children:[e.jsx("input",{type:"checkbox",name:"consentToPublish",checked:s.consentToPublish,onChange:t,disabled:a}),e.jsx("span",{className:"checkbox-text",children:"Ich bin damit einverstanden, dass mein Feedback (mit Vorname) auf der Website veröffentlicht werden darf."})]}),e.jsxs("label",{className:"checkbox-field",children:[e.jsx("input",{type:"checkbox",name:"subscribeNewsletter",checked:s.subscribeNewsletter,onChange:t,disabled:a}),e.jsx("span",{className:"checkbox-text",children:"Ich möchte den IGNITE Newsletter abonnieren und über Events informiert werden."})]})]}),s.subscribeNewsletter&&e.jsxs("label",{className:"form-field email-field",children:[e.jsx("span",{className:"label-text",children:"E-Mail Adresse *"}),e.jsx("input",{type:"email",name:"email",value:s.email,onChange:t,required:!0,disabled:a,placeholder:"deine@email.de"})]}),e.jsx("button",{type:"submit",className:"button color-secondary submit-button",disabled:a,children:a?"Wird gesendet...":"Feedback absenden"}),m==="error"&&e.jsx("p",{className:"error-message",children:"Da ist leider etwas schiefgelaufen. Bitte versuche es später erneut."}),m==="validation"&&e.jsx("p",{className:"error-message",children:"Bitte gib entweder Feedback oder einen Event-Vorschlag ein."}),e.jsx("p",{className:"privacy-note",children:"Bitte fülle mindestens das Feedback oder den Event-Vorschlag aus. Alle anderen Angaben sind optional."}),e.jsx("style",{children:`
        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
          margin: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .label-text {
          font-weight: 500;
          color: var(--font-color, #333);
        }

        .label-hint {
          font-weight: 400;
          font-size: 0.85rem;
          color: var(--neutral-400, #666);
          margin-left: 0.5rem;
        }

        input:not([type="checkbox"]), select, textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #8C3974;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.1);
        }

        textarea {
          resize: vertical;
          min-height: 120px;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(140, 57, 116, 0.05);
          border-radius: 8px;
        }

        .checkbox-field {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }

        .checkbox-field input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #8C3974;
        }

        .checkbox-text {
          font-size: 0.95rem;
          color: var(--font-color, #333);
          line-height: 1.4;
        }

        .email-field {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .submit-button {
          margin-top: 0.5rem;
          padding: 0.875rem 2rem;
          font-size: 1rem;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          color: #d32f2f;
          font-size: 0.9rem;
          padding: 0.75rem;
          background: #ffebee;
          border-radius: 6px;
        }

        .privacy-note {
          font-size: 0.85rem;
          color: var(--neutral-400, #666);
          text-align: center;
          margin-top: 0.5rem;
        }

        /* Light mode adjustments */
        @media (prefers-color-scheme: light) {
          input, select, textarea {
            background: white;
            color: #333;
          }
        }

        /* Dark mode adjustments */
        .darkmode input,
        .darkmode select,
        .darkmode textarea {
          background: var(--dark-100, #1a1a1a);
          border-color: var(--neutral-700, #444);
          color: var(--font-color, #fff);
        }

        .darkmode .checkbox-group {
          background: rgba(140, 57, 116, 0.1);
        }

        .darkmode .error-message {
          background: rgba(211, 47, 47, 0.2);
        }
      `})]})}export{w as default};
