import React, { useState, useEffect } from 'react';
import { positions } from '../data/jobs.js';

export default function Questionnaire({ initialPosition = '' }) {
  // Wenn initialPosition gesetzt, ab Schritt 3 starten (Intro + Position werden übersprungen)
  const startStep = initialPosition ? 3 : 1;
  const [step, setStep] = useState(startStep);
  const [data, setData] = useState({
    position: initialPosition,
    q1: '', // Was reizt dich…
    q2: '', // Welche Erfahrungen…
    q3: '', // Welche konkreten Stärken…
    q4: '', // Wie viel Zeit…
    q5: '', // Wie gehst du mit Struktur-Unsicherheit um?
    name: '',
    lastname: '',
    email: '',
  });
  const [done, setDone] = useState(false);

  // Hydrate initialPosition nach Client-Load
  useEffect(() => {
    if (initialPosition) {
      setData(d => ({ ...d, position: initialPosition }));
    }
  }, [initialPosition]);

  const handleChange = e => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };
  const next = () => setStep(s => s + 1);

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
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

      {/* Schritt 2: Positions-Auswahl */}
      {step === 2 && (
        <>
          <label>
            Gewünschte Position
            <select
              name="position"
              value={data.position}
              onChange={handleChange}
              required
            >
              <option value="">Bitte wählen</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={!data.position}
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 3: Q1 + Q2 */}
      {step === 3 && (
        <>
          <label>
            1. Was reizt dich persönlich an unserer noch jungen Initiative – und warum gerade jetzt?
            <textarea
              name="q1"
              value={data.q1}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            2. Welche Erfahrungen hast du bisher bei der Planung oder Durchführung von Veranstaltungen gesammelt?
            <textarea
              name="q2"
              value={data.q2}
              onChange={handleChange}
              required
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={!data.q1.trim() || !data.q2.trim()}
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 4: Q3 + Q4 */}
      {step === 4 && (
        <>
          <label>
            3. Welche konkreten Stärken (z. B. Design, Marketing, Finanzen, Technik) könntest du sofort einbringen?
            <textarea
              name="q3"
              value={data.q3}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            4. Wie viel Zeit kannst du in den nächsten drei Monaten realistisch pro Woche investieren?
            <textarea
              name="q4"
              value={data.q4}
              onChange={handleChange}
              required
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={!data.q3.trim() || !data.q4.trim()}
          >
            Weiter
          </button>
        </>
      )}

      {/* Schritt 5: Q5 */}
      {step === 5 && (
        <>
          <label>
            5. Wie gehst du damit um, wenn ein Projekt noch wenig Struktur hat und vieles parallel entsteht?
            <textarea
              name="q5"
              value={data.q5}
              onChange={handleChange}
              required
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={!data.q5.trim()}
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
          <button type="submit" className="button secondary">
            Absenden
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
        input {
          margin-top: 0.25rem;
          padding: var(--spacing-sm, 0.5rem);
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-sm, 4px);
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
      `}</style>
    </form>
  );
}