import React, { useState, useEffect } from 'react';
import { contactPage, contactTopics } from '../data/staticContent';

// Static contact config
const staticConfig = {
  formTopicLabel: contactPage.formTopicLabel,
  formTopicPlaceholder: contactPage.formTopicPlaceholder,
  formFirstNameLabel: contactPage.formFirstNameLabel,
  formLastNameLabel: contactPage.formLastNameLabel,
  formEmailLabel: contactPage.formEmailLabel,
  formMessageLabel: contactPage.formMessageLabel,
  formOrganizationLabel: contactPage.formOrganizationLabel,
  formExpertiseLabel: contactPage.formExpertiseLabel,
  formExpertisePlaceholder: contactPage.formExpertisePlaceholder,
  submitButtonText: contactPage.submitButtonText,
  successMessage: contactPage.successMessage,
  successMessageAdvisory: contactPage.successMessageAdvisory,
  advisoryInfoMessage: contactPage.advisoryInfoMessage,
  errorMessage: contactPage.errorMessage,
  topics: contactTopics,
};

export default function ContactForm({ initialIntent = '' }) {
  const [config] = useState(staticConfig);
  const [loading] = useState(false);
  const [data, setData] = useState({
    name: '',
    lastname: '',
    email: '',
    message: '',
    topic: '', // hinzugefügt für das Anliegen
    // Additional fields for Advisory Board
    organization: '',
    position: '',
    linkedin: '',
    phone: '',
    expertise: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Map URL intent parameter to topic value
  useEffect(() => {
    if (initialIntent) {
      setData(d => ({ ...d, topic: initialIntent }));
    }
  }, [initialIntent]);

  const handleChange = e => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setDone(true);
      } else {
        setError(result.message || (config?.errorMessage || 'Ein Fehler ist aufgetreten'));
      }
    } catch (err) {
      setError(config?.errorMessage || 'Fehler beim Absenden der Nachricht');
    }
  };

  // Loading state
  if (loading || !config) {
    return <p>Lädt Kontaktformular...</p>;
  }

  if (done) {
    const successHTML = data.topic === 'advisory'
      ? config.successMessageAdvisory
      : config.successMessage;

    return (
      <>
        <div
          className="success-message"
          dangerouslySetInnerHTML={{ __html: successHTML }}
        />
        <style>{`
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
        `}</style>
      </>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit}
      className="contact-form"
    >
      {/* Anliegen Dropdown */}
      <label>
        {config.formTopicLabel}
        <select
          name="topic"
          value={data.topic}
          onChange={handleChange}
          required
        >
          <option value="">{config.formTopicPlaceholder}</option>
          {config.topics.map((topic) => (
            <option key={topic.value} value={topic.value}>{topic.label}</option>
          ))}
        </select>
      </label>

      {/* Advisory Board specific info message */}
      {config.topics.find(t => t.value === data.topic)?.requiresAdditionalFields && (
        <div className="advisory-info">
          <p>{config.advisoryInfoMessage}</p>
        </div>
      )}

      {/* Name and Email */}
      <div className="flex-row flex gap-4 width-full">
        <label className="flex-1">
          {config.formFirstNameLabel}
          <input
            name="name"
            value={data.name}
            onChange={handleChange}
            required
            className="w-full"
          />
        </label>
        <label className="flex-1">
          {config.formLastNameLabel}
          <input
            name="lastname"
            value={data.lastname}
            onChange={handleChange}
            required
            className="w-full"
          />
        </label>
      </div>

      <label>
        {config.formEmailLabel}
        <input
          type="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          required
        />
      </label>

      {/* Advisory Board specific fields */}
      {config.topics.find(t => t.value === data.topic)?.requiresAdditionalFields && (
        <>
          <label>
            {config.formOrganizationLabel}
            <input
              name="organization"
              value={data.organization}
              onChange={handleChange}
              required
              placeholder={config.formOrganizationLabel}
            />
          </label>

          <label>
            {config.formExpertiseLabel}
            <textarea
              name="expertise"
              value={data.expertise}
              onChange={handleChange}
              required
              rows="3"
              placeholder={config.formExpertisePlaceholder}
            />
          </label>
        </>
      )}

      {/* Message */}
      <label>
        {config.formMessageLabel}
        <textarea
          name="message"
          value={data.message}
          onChange={handleChange}
          required
        />
      </label>

      {/* Error message */}
      {error && <p className="error-message">{error}</p>}

      <button type="submit" className="button secondary">
        {config.submitButtonText}
      </button>

      <style>{`
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
      `}</style>
    </form>
  );
}