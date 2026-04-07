import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as n}from"./index.WFquGv8Z.js";function E(){const[o,u]=n.useState(""),[m,c]=n.useState(""),[h,d]=n.useState(""),[p,i]=n.useState(null),[a,f]=n.useState(!1),[l,x]=n.useState(!1),[g,j]=n.useState(!1),[N,w]=n.useState(!1);n.useEffect(()=>{if(typeof window<"u"){const r=new URLSearchParams(window.location.search),t=r.get("token"),b=r.get("cancel");t&&(x(!0),fetch(`/api/confirm?token=${t}`).then(s=>{if(!s.ok)throw new Error(`HTTP error! status: ${s.status}`);return s.json()}).then(s=>{s.email&&u(s.email),s.firstName&&c(s.firstName),s.lastName&&d(s.lastName)}).catch(s=>{console.error("Error fetching confirmation data:",s),i("error")})),b&&(j(!0),y(b))}},[]);const y=async r=>{try{if((await fetch("/api/unsubscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:r})})).ok)i("unsubscribed");else throw new Error("Failed to unsubscribe")}catch(t){console.error("Error unsubscribing user:",t),i("error")}},v=async r=>{r.preventDefault(),f(!0),i(null);try{const t={email:o,firstName:m,lastName:h};l&&(t.isConfirming=!0),(await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).ok?(i("success"),l?w(!0):(u(""),c(""),d(""))):(console.error("Error response from API"),i("error"))}catch(t){console.error("Error in handleSubmit:",t),i("error")}finally{f(!1)}};return e.jsx("div",{children:N?e.jsxs("div",{className:"end-screen",children:[e.jsxs("div",{className:"end-screen-content",children:[e.jsx("div",{className:"end-screen-icon",children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"64",height:"64",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),e.jsx("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),e.jsx("h2",{className:"end-screen-title",children:"Willkommen im IGNITE Newsletter!"}),e.jsx("p",{className:"end-screen-message",children:"Deine Anmeldung ist jetzt bestätigt. Du erhältst ab sofort Updates zu Events, Workshops und Neuigkeiten aus der Startup-Szene."}),e.jsxs("p",{className:"end-screen-email",children:["Wir haben dir eine Willkommens-E-Mail an ",e.jsx("strong",{children:o})," geschickt."]}),e.jsx("a",{href:"/",className:"button color-secondary end-screen-button",children:"Zurück zur Startseite"})]}),e.jsx("style",{children:`
            .end-screen {
              text-align: center;
              padding: 2rem 0;
            }
            .end-screen-content {
              max-width: 400px;
              margin: 0 auto;
            }
            .end-screen-icon {
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
            .end-screen-title {
              font-size: 1.75rem;
              font-weight: 700;
              color: #8C3974;
              margin-bottom: 1rem;
            }
            .end-screen-message {
              font-size: 1.1rem;
              color: var(--font-color, #333);
              margin-bottom: 1rem;
              line-height: 1.6;
            }
            .end-screen-email {
              font-size: 0.95rem;
              color: var(--neutral-400, #666);
              margin-bottom: 2rem;
            }
            .end-screen-button {
              display: inline-block;
              text-decoration: none;
            }
          `})]}):g?e.jsxs("div",{className:"text-center",children:[e.jsx("h2",{className:"text-2xl font-bold",children:"Du hast dich erfolgreich abgemeldet"}),e.jsx("p",{children:"Schade, dass du dich vom Newsletter abgemeldet hast!"}),p==="error"&&e.jsx("p",{className:"error",children:"Fehler beim Abmelden. Bitte versuche es später erneut."})]}):e.jsxs("form",{onSubmit:v,className:"newsletter-form width-full",children:[e.jsx("h3",{children:l?"Bestätige deinen Newsletter-Abonnement":"Werde Teil der Community"}),l?e.jsxs(e.Fragment,{children:[e.jsxs("label",{children:["E-Mail",e.jsx("input",{type:"email",value:o,readOnly:!0,className:"w-full my-4 border-radius-4px border-1px-solid-#ccc"})]}),e.jsxs("label",{children:["Vorname",e.jsx("input",{type:"text",name:"firstName",value:m,onChange:r=>c(r.target.value),required:!0,disabled:a,className:"w-full my-4 border-radius-4px border-1px-solid-#ccc"})]}),e.jsxs("label",{children:["Nachname",e.jsx("input",{type:"text",name:"lastName",value:h,onChange:r=>d(r.target.value),required:!0,disabled:a,className:"w-full my-4 border-radius-4px border-1px-solid-#ccc"})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("label",{children:["Vorname",e.jsx("input",{type:"text",name:"firstName",value:m,onChange:r=>c(r.target.value),required:!0,disabled:a,className:"w-full my-4 border-radius-4px border-1px-solid-#ccc"})]}),e.jsxs("label",{children:["Nachname",e.jsx("input",{type:"text",name:"lastName",value:h,onChange:r=>d(r.target.value),required:!0,disabled:a,className:"w-full my-4 border-radius-4px border-1px-solid-#ccc"})]}),e.jsxs("label",{children:["E-Mail",e.jsx("input",{type:"email",value:o,onChange:r=>u(r.target.value),required:!0,placeholder:"dein@email.de",className:"w-full my-4 border-radius-4px border-1px-solid-#ccc",disabled:a})]})]}),e.jsx("button",{type:"submit",className:"button color-secondary",disabled:a,children:a?"Wird gesendet...":l?"Bestätigen":"Jetzt beitreten"}),e.jsx("p",{className:"text-neutral-500",children:l?"Mit dem Absenden stimmst du unserer Datenschutzvereinbarung zu und bestätigst deine E-Mail Adresse für unseren Newsletter!":"Mit dem Absenden deiner Email-Adresse stimmst du unserer Datenschutzvereinbarung zu."}),p==="success"&&e.jsx("p",{className:"success",children:"Danke für deine Anmeldung!"}),p==="error"&&e.jsx("p",{className:"error",children:"Da ging etwas schief. Bitte versuch's später erneut."}),e.jsx("style",{children:`
            .newsletter-form {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            label {
              font-weight: 500;
            }
            input {
              padding: 0.5rem;
              border-radius: 4px;
              border: 1px solid #ccc;
            }
            button[disabled] {
              opacity: 0.6;
              cursor: not-allowed;
            }
            .success {
              color: green;
              font-size: 0.9rem;
            }
            .error {
              color: red;
              font-size: 0.9rem;
            }
            /* Light Mode Anpassungen */
            @media (prefers-color-scheme: light) {
              input, textarea {
                color: black; /* Schriftfarbe im Light Mode */
              }
            }
          `})]})})}export{E as default};
