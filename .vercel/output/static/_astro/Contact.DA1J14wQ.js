import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as i}from"./index.WFquGv8Z.js";const s={formTopicLabel:"Anliegen",formTopicPlaceholder:"Bitte wählen",formFirstNameLabel:"Vorname",formLastNameLabel:"Nachname",formEmailLabel:"E-Mail",formMessageLabel:"Nachricht",formOrganizationLabel:"Organisation/Unternehmen",formExpertiseLabel:"Fachgebiet/Expertise",formExpertisePlaceholder:"Beschreiben Sie kurz Ihre Expertise und wie Sie das IGNITE Team unterstützen können...",submitButtonText:"Absenden",successMessage:"<h3>Danke für deine Nachricht!</h3><p>Wir werden uns bald bei dir melden.</p>",successMessageAdvisory:'<h3>Vielen Dank für Ihr Interesse!</h3><p>Wir haben Ihre Anfrage zum Advisory Board erhalten und freuen uns sehr über Ihr Interesse, den IGNITE Startup Club Lüneburg zu unterstützen. Unser Team wird sich zeitnah bei Ihnen melden, um die nächsten Schritte zu besprechen.</p><p class="contact-info">Bei dringenden Fragen erreichen Sie uns auch direkt unter <a href="mailto:info@ignite-startupclub.de">info@ignite-startupclub.de</a></p>',advisoryInfoMessage:"Vielen Dank für Ihr Interesse an unserem Advisory Board! Um Sie optimal unterstützen zu können, bitten wir Sie um einige zusätzliche Informationen zu Ihrer Person und Expertise.",errorMessage:"Fehler beim Absenden der Nachricht"},x=[{id:1,value:"advisory",label:"Advisory Board Interesse",requiresAdditionalFields:!0,order:1},{id:2,value:"partner",label:"Partner werden",requiresAdditionalFields:!1,order:2},{id:3,value:"mitglied",label:"Mitglied werden",requiresAdditionalFields:!1,order:3},{id:4,value:"workshop",label:"Workshop veranstalten",requiresAdditionalFields:!1,order:4},{id:5,value:"sonstiges",label:"Sonstiges",requiresAdditionalFields:!1,order:5}],v={formTopicLabel:s.formTopicLabel,formTopicPlaceholder:s.formTopicPlaceholder,formFirstNameLabel:s.formFirstNameLabel,formLastNameLabel:s.formLastNameLabel,formEmailLabel:s.formEmailLabel,formMessageLabel:s.formMessageLabel,formOrganizationLabel:s.formOrganizationLabel,formExpertiseLabel:s.formExpertiseLabel,formExpertisePlaceholder:s.formExpertisePlaceholder,submitButtonText:s.submitButtonText,successMessage:s.successMessage,successMessageAdvisory:s.successMessageAdvisory,advisoryInfoMessage:s.advisoryInfoMessage,errorMessage:s.errorMessage,topics:x};function j({initialIntent:l=""}){const[r]=i.useState(v),[f]=i.useState(!1),[o,m]=i.useState({name:"",lastname:"",email:"",message:"",topic:"",organization:"",position:"",linkedin:"",phone:"",expertise:""}),[g,p]=i.useState(!1),[u,c]=i.useState(null);i.useEffect(()=>{l&&m(a=>({...a,topic:l}))},[l]);const n=a=>{const{name:t,value:d}=a.target;m(b=>({...b,[t]:d}))},h=async a=>{a.preventDefault(),c(null);try{const t=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}),d=await t.json();t.ok?p(!0):c(d.message||r?.errorMessage||"Ein Fehler ist aufgetreten")}catch{c(r?.errorMessage||"Fehler beim Absenden der Nachricht")}};if(f||!r)return e.jsx("p",{children:"Lädt Kontaktformular..."});if(g){const a=o.topic==="advisory"?r.successMessageAdvisory:r.successMessage;return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"success-message",dangerouslySetInnerHTML:{__html:a}}),e.jsx("style",{children:`
          .success-message {
            padding: 2rem;
            background: linear-gradient(135deg, rgba(255, 159, 252, 0.1), rgba(101, 186, 255, 0.1));
            border: 2px solid var(--primary-300);
            border-radius: 1rem;
            text-align: center;
          }
          .success-message h3 {
            color: var(--primary-300);
            margin-bottom: 1rem;
          }
          .success-message p {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          .contact-info {
            font-size: 0.9rem;
            color: var(--neutral-400);
          }
          .contact-info a {
            color: var(--primary-300);
            text-decoration: none;
          }
          .contact-info a:hover {
            text-decoration: underline;
          }
        `})]})}return e.jsxs("form",{id:"contact-form",onSubmit:h,className:"contact-form",children:[e.jsxs("label",{children:[r.formTopicLabel,e.jsxs("select",{name:"topic",value:o.topic,onChange:n,required:!0,children:[e.jsx("option",{value:"",children:r.formTopicPlaceholder}),r.topics.map(a=>e.jsx("option",{value:a.value,children:a.label},a.value))]})]}),r.topics.find(a=>a.value===o.topic)?.requiresAdditionalFields&&e.jsx("div",{className:"advisory-info",children:e.jsx("p",{children:r.advisoryInfoMessage})}),e.jsxs("div",{className:"flex-row flex gap-4 width-full",children:[e.jsxs("label",{className:"flex-1",children:[r.formFirstNameLabel,e.jsx("input",{name:"name",value:o.name,onChange:n,required:!0,className:"w-full"})]}),e.jsxs("label",{className:"flex-1",children:[r.formLastNameLabel,e.jsx("input",{name:"lastname",value:o.lastname,onChange:n,required:!0,className:"w-full"})]})]}),e.jsxs("label",{children:[r.formEmailLabel,e.jsx("input",{type:"email",name:"email",value:o.email,onChange:n,required:!0})]}),r.topics.find(a=>a.value===o.topic)?.requiresAdditionalFields&&e.jsxs(e.Fragment,{children:[e.jsxs("label",{children:[r.formOrganizationLabel,e.jsx("input",{name:"organization",value:o.organization,onChange:n,required:!0,placeholder:r.formOrganizationLabel})]}),e.jsxs("label",{children:[r.formExpertiseLabel,e.jsx("textarea",{name:"expertise",value:o.expertise,onChange:n,required:!0,rows:"3",placeholder:r.formExpertisePlaceholder})]})]}),e.jsxs("label",{children:[r.formMessageLabel,e.jsx("textarea",{name:"message",value:o.message,onChange:n,required:!0})]}),u&&e.jsx("p",{className:"error-message",children:u}),e.jsx("button",{type:"submit",className:"button secondary",children:r.submitButtonText}),e.jsx("style",{children:`
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 1rem);
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 500;
        }
        input,
        textarea {
          margin-top: 0.25rem;
          padding: var(--spacing-sm, 0.5rem);
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-sm, 4px);
        }

        select {
        margin-top: 0.25rem;
        padding: var(--spacing-sm, 0.5rem) 2.5rem 0.5rem 0.75rem;
        border: 1px solid var(--neutral-400);
        border-radius: var(--radius-sm, 4px);
        background-color: white;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1rem;
        font-size: 1rem;
        color: #333;
        cursor: pointer;

        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }

      select:focus {
        border-color: var(--primary-400);
        outline: none;
        box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2); /* leichter pink/lila Fokus */
      }

        .error-message {
          color: red;
          font-size: 0.875rem;
        }

        /* Advisory Board Info Box */
        .advisory-info {
          background: linear-gradient(135deg, rgba(255, 159, 252, 0.08), rgba(101, 186, 255, 0.08));
          border-left: 4px solid var(--primary-300);
          padding: 1.25rem;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        .advisory-info p {
          margin: 0;
          line-height: 1.6;
          color: var(--neutral-100);
          font-size: 0.95rem;
        }

        /* Enhanced styling for advisory board fields */
        .contact-form input[placeholder],
        .contact-form textarea[placeholder] {
          font-style: italic;
        }

        .contact-form input:focus,
        .contact-form textarea:focus,
        .contact-form select:focus {
          border-color: var(--primary-400);
          outline: none;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
          transition: all 0.2s ease-in-out;
        }

        /* Professional styling for required fields */
        .contact-form label::after {
          content: ' *';
          color: var(--primary-300);
          font-weight: bold;
        }

        /* Light Mode Anpassungen */
        @media (prefers-color-scheme: light) {
          input, textarea {
            color: black; /* Schriftfarbe im Light Mode */
          }

          .advisory-info {
            background: linear-gradient(135deg, rgba(255, 159, 252, 0.15), rgba(101, 186, 255, 0.15));
          }

          .advisory-info p {
            color: #333;
          }
        }
      `})]})}export{j as default};
