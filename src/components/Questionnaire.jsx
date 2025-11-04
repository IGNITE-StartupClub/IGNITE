import React, { useState, useEffect } from 'react';
import { teams } from '../data/jobs.js';

export default function Questionnaire({ initialPosition = '' }) {
  const startStep = 1;
  const [step, setStep] = useState(startStep);
  const [data, setData] = useState({
    teams: [],
    startupInterest: '',
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
    q6: '',
    name: '',
    lastname: '',
    email: '',
  });
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

  const next = () => setStep(s => s + 1);

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
          Bewerbung ausfüllen
        </button>
      )}

      {/* Schritt 2: Team-Auswahl (2-3 Teams) */}
      {step === 2 && (
        <>
          <div>
            <label style={{ marginBottom: '1rem' }}>
              Wähle 2-3 Teams, in denen du mitarbeiten möchtest:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {teams.map(team => (
                <label key={team.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={data.teams.includes(team.id)}
                    onChange={() => handleTeamChange(team.id)}
                    style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <strong>{team.team}</strong>
                </label>
              ))}
            </div>
            {data.teams.length < 2 && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)', textAlign: 'left' }}>
                Bitte wähle mindestens 2 Teams aus.
              </p>
            )}
            {data.teams.length === 3 && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)', textAlign: 'left' }}>
                Du hast die maximale Anzahl von 3 Teams ausgewählt.
              </p>
            )}
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={data.teams.length < 2}
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
              Was beschreibt deine Situation am besten?
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="startupInterest"
                  value="interested"
                  checked={data.startupInterest === 'interested'}
                  onChange={handleChange}
                  style={{ marginRight: '0.75rem' }}
                />
                Ich finde Startups/Gründen spannend
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="startupInterest"
                  value="want-to-work"
                  checked={data.startupInterest === 'want-to-work'}
                  onChange={handleChange}
                  style={{ marginRight: '0.75rem' }}
                />
                Ich möchte in einem Startup arbeiten (angestellt)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="startupInterest"
                  value="want-to-found-no-idea"
                  checked={data.startupInterest === 'want-to-found-no-idea'}
                  onChange={handleChange}
                  style={{ marginRight: '0.75rem' }}
                />
                Ich möchte gründen, habe aber noch keine Idee
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="startupInterest"
                  value="want-to-found-with-idea"
                  checked={data.startupInterest === 'want-to-found-with-idea'}
                  onChange={handleChange}
                  style={{ marginRight: '0.75rem' }}
                />
                Ich möchte gründen und habe eine Idee
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="startupInterest"
                  value="already-founded"
                  checked={data.startupInterest === 'already-founded'}
                  onChange={handleChange}
                  style={{ marginRight: '0.75rem' }}
                />
                Ich habe bereits gegründet
              </label>
            </div>
          </fieldset>
          <label>
            Was reizt dich persönlich an unserer noch jungen Initiative – und warum gerade jetzt?
            <textarea
              name="q1"
              value={data.q1}
              onChange={handleChange}
              required
              rows="4"
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={!data.startupInterest || !data.q1.trim()}
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 4: Proaktivität & Eigeninitiative */}
      {step === 4 && (
        <>
          <label>
            Beschreibe eine Situation, in der du ein Projekt oder eine Idee selbstständig vorangetrieben hast, ohne dass jemand dich dazu aufgefordert hat.
            <textarea
              name="q2"
              value={data.q2}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Beschreibe die Situation, deine Motivation und was du konkret getan hast..."
            />
          </label>
          <label>
            Wie gehst du damit um, wenn ein Projekt noch wenig Struktur hat und vieles parallel entsteht?
            <textarea
              name="q3"
              value={data.q3}
              onChange={handleChange}
              required
              rows="4"
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={!data.q2.trim() || !data.q3.trim()}
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 5: Fähigkeiten & Commitment */}
      {step === 5 && (
        <>
          <label>
            Welche konkreten Stärken oder Fähigkeiten könntest du sofort in die Teams einbringen? (z. B. Design, Marketing, Finanzen, Technik, Organisation, Netzwerken)
            <textarea
              name="q4"
              value={data.q4}
              onChange={handleChange}
              required
              rows="4"
            />
          </label>
          <label>
            Wie viel Zeit kannst du realistisch pro Woche für IGNITE investieren?
            <textarea
              name="q5"
              value={data.q5}
              onChange={handleChange}
              required
              rows="3"
              placeholder="z. B. 5-10 Stunden pro Woche..."
            />
          </label>
          <label>
            Was bedeutet für dich "erfolgreiches Teamwork" in einer studentischen Initiative?
            <textarea
              name="q6"
              value={data.q6}
              onChange={handleChange}
              required
              rows="4"
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={!data.q4.trim() || !data.q5.trim() || !data.q6.trim()}
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 6: Persönliche Daten */}
      {step === 6 && (
        <>
          <label>
            Vorname
            <input
              name="name"
              value={data.name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Nachname
            <input
              name="lastname"
              value={data.lastname}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            E-Mail
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              required
            />
          </label>
          <button
            type="submit"
            className="button secondary"
            disabled={loading}
          >
            {loading ? 'Wird gesendet...' : 'Absenden'}
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
          color: var(--neutral-500);
          opacity: 0.8;
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
          color: var(--neutral-500);
          opacity: 0.8;
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
