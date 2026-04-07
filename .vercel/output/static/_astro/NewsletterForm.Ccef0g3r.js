import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as a}from"./index.WFquGv8Z.js";function h(){const[i,l]=a.useState(""),[o,s]=a.useState(null),[t,c]=a.useState(!1),d=async n=>{n.preventDefault(),c(!0),s(null);try{const r=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:i})});if(r.ok)s("success"),l("");else{const u=await r.json();console.error(u.message),s("error")}}catch(r){console.error(r),s("error")}finally{c(!1)}};return e.jsxs("form",{onSubmit:d,className:"newsletter-form width-full",children:[e.jsxs("label",{children:[e.jsx("h3",{children:"Werde Teil der Community"}),e.jsx("p",{children:"Du erhältst eine E-Mail mit einem Einladungslink"}),e.jsx("input",{type:"email",value:i,onChange:n=>l(n.target.value),required:!0,placeholder:"dein@email.de",className:"w-full my-4 border-radius-4px border-1px-solid-#ccc",disabled:t})]}),e.jsx("button",{type:"submit",className:"button color-secondary",disabled:t,children:t?"Wird gesendet...":"Jetzt beitreten"}),e.jsx("p",{className:"text-neutral-500",children:"Mit dem Absenden deiner Email-Adresse stimmst du unserer Datenschutzvereinbarung zu."}),o==="success"&&e.jsx("p",{className:"success",children:"Danke für deine Anmeldung! Schau' in dein Postfach um deine E-Mail Adresse zu bestätigen."}),o==="error"&&e.jsx("p",{className:"error",children:"Da ging etwas schief. Bitte versuch’s später erneut."}),e.jsx("style",{children:`
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
      `})]})}export{h as default};
