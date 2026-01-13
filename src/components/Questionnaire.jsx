import React, { useState, useEffect } from 'react';
import { teams } from '../data/teams.js';
import { questionnaireConfig } from '../data/questionnaireConfig';

export default function Questionnaire({ initialPosition = '' }) {
  const startStep = 1;
  const [step, setStep] = useState(startStep);
  const [config] = useState(questionnaireConfig);
  const [loading] = useState(false);

  // Initialize state dynamically based on config
  const [data, setData] = useState(() => {
    const initialData = {
      teams: [],
      startupInterest: '',
      name: '',
      lastname: '',
      email: '',
      subscribeNewsletter: false,
    };
    // We'll add question IDs dynamically once config loads
    return initialData;
  });

  // Update data state when config loads
  useEffect(() => {
    if (config && config.allQuestions) {
      setData(d => {
        const newData = { ...d };
        config.allQuestions.forEach(qId => {
          if (!(qId in newData)) {
            newData[qId] = '';
          }
        });
        return newData;
      });
    }
  }, [config]);

  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleTeamChange = (teamId) => {
    setData(d => {
      const currentTeams = d.teams || [];
      const maxTeams = config?.step2?.maxTeams || 3;
      if (currentTeams.includes(teamId)) {
        return { ...d, teams: currentTeams.filter(t => t !== teamId) };
      } else {
        if (currentTeams.length >= maxTeams) {
          return d;
        }
        return { ...d, teams: [...currentTeams, teamId] };
      }
    });
  };

  // Function to check if a step has questions
  const stepHasQuestions = (stepNum) => {
    if (!config) return true;
    if (stepNum === 3) return true; // Always has startup interest
    if (stepNum === 4) return Object.keys(config.step4?.questions || {}).length > 0;
    if (stepNum === 5) return Object.keys(config.step5?.questions || {}).length > 0;
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
    setSubmitting(true);

    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setDone(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Es gab einen Fehler beim Absenden. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading || !config) {
    return <p>Lädt Fragebogen...</p>;
  }

  if (done) {
    return <p>Danke für deine Anfrage! Wir freuen uns über dein Interesse und melden uns bald bei dir.</p>;
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
          {config.step1?.buttonText || 'Jetzt mitmachen'}
        </button>
      )}

      {/* Schritt 2: Team-Auswahl (2-3 Teams) */}
      {step === 2 && (
        <>
          <div>
            <label style={{ marginBottom: '1rem' }}>
              {config.step2?.label || 'Wähle 2-3 Teams:'}
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
            {data.teams.length < (config.step2?.minTeams || 2) && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)', textAlign: 'left' }}>
                {config.step2?.hintTooFew || 'Bitte wähle mindestens 2 Teams aus.'}
              </p>
            )}
            {data.teams.length === (config.step2?.maxTeams || 3) && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)', textAlign: 'left' }}>
                {config.step2?.hintMaximum || 'Du hast die maximale Anzahl erreicht.'}
              </p>
            )}
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={data.teams.length < (config.step2?.minTeams || 2)}
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
              {config.step3?.legend || 'Was beschreibt deine Situation am besten?'}
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
              {(config.step3?.options || []).map(option => (
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
          {Object.keys(config.step3?.questions || {}).map(qId => {
            const question = config.step3.questions[qId];
            return (
              <label key={qId}>
                {question.label}
                {question.fieldType === 'select' ? (
                  <select
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                  >
                    <option value="">{question.placeholder || 'Bitte wählen...'}</option>
                    {(question.options || []).map((opt, idx) => (
                      <option key={idx} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : question.fieldType === 'text' || question.fieldType === 'email' ? (
                  <input
                    type={question.fieldType}
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                    placeholder={question.placeholder || ''}
                  />
                ) : (
                  <textarea
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                    rows={question.rows}
                    placeholder={question.placeholder || ''}
                  />
                )}
              </label>
            );
          })}

          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={
              !data.startupInterest ||
              Object.keys(config.step3?.questions || {}).some(qId =>
                config.step3.questions[qId].required && !data[qId]?.trim()
              )
            }
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 4: Dynamisch rendern basierend auf Config */}
      {step === 4 && Object.keys(config.step4?.questions || {}).length > 0 && (
        <>
          {Object.keys(config.step4.questions).map(qId => {
            const question = config.step4.questions[qId];
            return (
              <label key={qId}>
                {question.label}
                {question.fieldType === 'select' ? (
                  <select
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                  >
                    <option value="">{question.placeholder || 'Bitte wählen...'}</option>
                    {(question.options || []).map((opt, idx) => (
                      <option key={idx} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : question.fieldType === 'text' || question.fieldType === 'email' ? (
                  <input
                    type={question.fieldType}
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                    placeholder={question.placeholder || ''}
                  />
                ) : (
                  <textarea
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                    rows={question.rows}
                    placeholder={question.placeholder || ''}
                  />
                )}
              </label>
            );
          })}
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={
              Object.keys(config.step4.questions).some(qId =>
                config.step4.questions[qId].required && !data[qId]?.trim()
              )
            }
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 5: Dynamisch rendern basierend auf Config */}
      {step === 5 && Object.keys(config.step5?.questions || {}).length > 0 && (
        <>
          {Object.keys(config.step5.questions).map(qId => {
            const question = config.step5.questions[qId];
            return (
              <label key={qId}>
                {question.label}
                {question.fieldType === 'select' ? (
                  <select
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                  >
                    <option value="">{question.placeholder || 'Bitte wählen...'}</option>
                    {(question.options || []).map((opt, idx) => (
                      <option key={idx} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : question.fieldType === 'text' || question.fieldType === 'email' ? (
                  <input
                    type={question.fieldType}
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                    placeholder={question.placeholder || ''}
                  />
                ) : (
                  <textarea
                    name={qId}
                    value={data[qId] || ''}
                    onChange={handleChange}
                    required={question.required}
                    rows={question.rows}
                    placeholder={question.placeholder || ''}
                  />
                )}
              </label>
            );
          })}
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={
              Object.keys(config.step5.questions).some(qId =>
                config.step5.questions[qId].required && !data[qId]?.trim()
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
            {config.step6?.fields?.name?.label || 'Vorname'}
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              required={config.step6?.fields?.name?.required !== false}
            />
          </label>
          <label>
            {config.step6?.fields?.lastname?.label || 'Nachname'}
            <input
              type="text"
              name="lastname"
              value={data.lastname}
              onChange={handleChange}
              required={config.step6?.fields?.lastname?.required !== false}
            />
          </label>
          <label>
            {config.step6?.fields?.email?.label || 'E-Mail'}
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              required={config.step6?.fields?.email?.required !== false}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexDirection: 'row', marginTop: '1rem' }}>
            <input
              type="checkbox"
              name="subscribeNewsletter"
              checked={data.subscribeNewsletter}
              onChange={(e) => setData(d => ({ ...d, subscribeNewsletter: e.target.checked }))}
              style={{ flexShrink: 0, cursor: 'pointer' }}
            />
            <span style={{ paddingLeft: '0.75rem', fontSize: '1rem', fontWeight: '400' }}>
              Ich möchte den IGNITE Newsletter abonnieren und über Events & Workshops informiert werden
            </span>
          </label>

          <button
            type="submit"
            className="button secondary"
            disabled={submitting}
          >
            {submitting ? 'Wird gesendet...' : 'Anfrage absenden'}
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
