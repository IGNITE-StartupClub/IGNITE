import React, { useState, useEffect } from 'react';
import { teams } from '../data/jobs.js';
import { questionnaireConfig } from '../data/questionnaireParser.js';

export default function Questionnaire({ initialPosition = '' }) {
  const startStep = 1;
  const [step, setStep] = useState(startStep);

  // Initialize state dynamically based on config
  const initialData = {
    teams: [],
    startupInterest: '',
    name: '',
    lastname: '',
    email: '',
  };

  // Add all questions from config dynamically
  questionnaireConfig.allQuestions.forEach(qId => {
    initialData[qId] = '';
  });

  const [data, setData] = useState(initialData);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleTeamChange = (teamId) => {
    setData(d => {
      const currentTeams = d.teams || [];
      if (currentTeams.includes(teamId)) {
        return { ...d, teams: currentTeams.filter(t => t !== teamId) };
      } else {
        if (currentTeams.length >= 3) {
          return d; // max 3 teams
        }
        return { ...d, teams: [...currentTeams, teamId] };
      }
    });
  };

  // Function to check if a step has questions
  const stepHasQuestions = (stepNum) => {
    if (stepNum === 3) return true; // Always has startup interest
    if (stepNum === 4) return Object.keys(questionnaireConfig.step4.questions).length > 0;
    if (stepNum === 5) return Object.keys(questionnaireConfig.step5.questions).length > 0;
    if (stepNum === 6) return true; // Always has personal data
    return true;
  };

  // Smart next function that skips empty steps
  const next = () => {
    setStep(s => {
      let nextStep = s + 1;
      // Skip steps that have no questions
      while (nextStep <= 6 && !stepHasQuestions(nextStep)) {
        nextStep++;
      }
      return nextStep;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return <p>Danke für deine Bewerbung! Wir melden uns bald bei dir.</p>;
  }


  return (
    <form
      id="application-form"
      onSubmit={handleSubmit}
      className="questionnaire"
    >
      {/* Schritt 1: Intro-Button */}
      {step === 1 && (
        <button type="button" className="button secondary" onClick={next}>
          {questionnaireConfig.step1.buttonText}
        </button>
      )}

      {/* Schritt 2: Team-Auswahl (2-3 Teams) */}
      {step === 2 && (
        <>
          <div>
            <label style={{ marginBottom: '1rem' }}>
              {questionnaireConfig.step2.label}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {teams.map(team => (
                <label key={team.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexDirection: 'row' }}>
                  <input
                    type="checkbox"
                    checked={data.teams.includes(team.id)}
                    onChange={() => handleTeamChange(team.id)}
                    style={{ flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ paddingLeft: '0.75rem', fontSize: '1.2rem', fontWeight: '600', lineHeight: '1.3' }}>{team.team}</span>
                </label>
              ))}
            </div>
            {data.teams.length < questionnaireConfig.step2.minTeams && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)', textAlign: 'left' }}>
                {questionnaireConfig.step2.hintTooFew}
              </p>
            )}
            {data.teams.length === questionnaireConfig.step2.maxTeams && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)', textAlign: 'left' }}>
                {questionnaireConfig.step2.hintMaximum}
              </p>
            )}
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={data.teams.length < questionnaireConfig.step2.minTeams}
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 3: Startup-Interesse */}
      {step === 3 && (
        <>
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend style={{ fontWeight: 500, marginBottom: '0.75rem', textAlign: 'left' }}>
              {questionnaireConfig.step3.legend}
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
              {questionnaireConfig.step3.options.map(option => (
                <label key={option.value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexDirection: 'row' }}>
                  <input
                    type="radio"
                    name="startupInterest"
                    value={option.value}
                    checked={data.startupInterest === option.value}
                    onChange={handleChange}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ paddingLeft: '0.75rem' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Render questions dynamically */}
          {Object.keys(questionnaireConfig.step3.questions).map(qId => {
            const question = questionnaireConfig.step3.questions[qId];
            return (
              <label key={qId}>
                {question.label}
                <textarea
                  name={qId}
                  value={data[qId] || ''}
                  onChange={handleChange}
                  required={question.required}
                  rows={question.rows}
                  placeholder={question.placeholder || ''}
                />
              </label>
            );
          })}

          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={
              !data.startupInterest ||
              Object.keys(questionnaireConfig.step3.questions).some(qId =>
                questionnaireConfig.step3.questions[qId].required && !data[qId]?.trim()
              )
            }
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 4: Dynamisch rendern basierend auf Config */}
      {step === 4 && Object.keys(questionnaireConfig.step4.questions).length > 0 && (
        <>
          {Object.keys(questionnaireConfig.step4.questions).map(qId => {
            const question = questionnaireConfig.step4.questions[qId];
            return (
              <label key={qId}>
                {question.label}
                <textarea
                  name={qId}
                  value={data[qId] || ''}
                  onChange={handleChange}
                  required={question.required}
                  rows={question.rows}
                  placeholder={question.placeholder || ''}
                />
              </label>
            );
          })}
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={
              Object.keys(questionnaireConfig.step4.questions).some(qId =>
                questionnaireConfig.step4.questions[qId].required && !data[qId]?.trim()
              )
            }
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 5: Dynamisch rendern basierend auf Config */}
      {step === 5 && Object.keys(questionnaireConfig.step5.questions).length > 0 && (
        <>
          {Object.keys(questionnaireConfig.step5.questions).map(qId => {
            const question = questionnaireConfig.step5.questions[qId];
            return (
              <label key={qId}>
                {question.label}
                <textarea
                  name={qId}
                  value={data[qId] || ''}
                  onChange={handleChange}
                  required={question.required}
                  rows={question.rows}
                  placeholder={question.placeholder || ''}
                />
              </label>
            );
          })}
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={
              Object.keys(questionnaireConfig.step5.questions).some(qId =>
                questionnaireConfig.step5.questions[qId].required && !data[qId]?.trim()
              )
            }
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 6: Persönliche Daten */}
      {step === 6 && (
        <>
          <label>
            {questionnaireConfig.step6.fields.name.label}
            <input
              type={questionnaireConfig.step6.fields.name.type}
              name="name"
              value={data.name}
              onChange={handleChange}
              required={questionnaireConfig.step6.fields.name.required}
            />
          </label>
          <label>
            {questionnaireConfig.step6.fields.lastname.label}
            <input
              type={questionnaireConfig.step6.fields.lastname.type}
              name="lastname"
              value={data.lastname}
              onChange={handleChange}
              required={questionnaireConfig.step6.fields.lastname.required}
            />
          </label>
          <label>
            {questionnaireConfig.step6.fields.email.label}
            <input
              type={questionnaireConfig.step6.fields.email.type}
              name="email"
              value={data.email}
              onChange={handleChange}
              required={questionnaireConfig.step6.fields.email.required}
            />
          </label>
          <button
            type="submit"
            className="button secondary"
            disabled={loading}
          >
            {loading ? questionnaireConfig.step6.submitButton.loadingText : questionnaireConfig.step6.submitButton.text}
          </button>

        </>
      )}

      <style>{`
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
      `}</style>
    </form>
  );
}
