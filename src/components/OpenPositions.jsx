import React from 'react';
import { Modal } from 'accessible-astro-components'
import { positions } from '../data/jobs.js'; // Importiere die Liste der offenen Stellen
// Exportiere die Liste, damit sie auch im Questionnaire genutzt werden kann


export default function OpenPositions() {
  return (
    <div className="positions-grid">
      {positions.map((job) => (
        <article key={job.id} className="job-card">
          <div className="image-wrapper">
            {job.image ? (
              <img src={job.image} alt={job.title} />
            ) : (
              <div className="fallback-image">
                <img src={`/team-logos/${job.team.toLowerCase()}.png`} alt={`${job.team} logo`} className="team-logo" />
              </div>
            )}
          </div>
          <div className="job-info">
            <span className="category-pill">{job.category}</span>
            <h3 className="job-title">{job.title}</h3>
            <p className="job-desc">{job.description}</p>

            {/* Führe zum Formular mit vorausgewählter Position und scroll zum Formular */}
            {/* <a
              href={`/mitmachen?position=${job.id}#application-form`}
              className="button color-secondary"
            >
              Jetzt bewerben
            </a> */}

          </div>
        </article>
      ))}

<style>{`
        .positions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-md, 1.5rem);
        }
        .job-card {
          background-color: var(--dark-100);
          border: 3px solid var(--gradient-100);
          border-radius: 1rem;
          box-shadow: rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 */
        }
        .image-wrapper img {
          position: absolute;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .fallback-image {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(45deg, var(--primary-400), var(--secondary-200));
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .team-logo {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }
        .job-info {
          padding: var(--spacing-md, 1rem);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 0.5rem);
        }
        .category-pill {
          display: inline-block;
          background: var(--neutral-100);
          color: var(--primary-400);
          padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.75rem);
          border-radius: var(--radius-pill, 12px);
          font-size: var(--text-xs, 0.75rem);
          text-transform: uppercase;
          font-weight: 600;
          width: max-content;
        }
        .job-title {
          margin: 0;
          font-size: var(--text-lg, 1.125rem);
          color: var(--neutral-200);
        }
        .job-desc {
          margin: 0;
          font-size: var(--text-sm, 0.875rem);
          color: var(--neutral-400);
        }
      `}</style>
    </div>
  );
}