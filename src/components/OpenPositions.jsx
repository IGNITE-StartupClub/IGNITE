import React from 'react';
import { Modal } from 'accessible-astro-components'
import { positions } from '../data/jobs.js'; // Importiere die Liste der offenen Stellen
// Exportiere die Liste, damit sie auch im Questionnaire genutzt werden kann
const date = new Date();

export default function OpenPositions() {
  return (
    <div className="positions-grid">
      {positions.map((job) => (
        <article key={job.id} className="job-card enhanced-card">
          <div className="image-wrapper">
            {job.image ? (
              <img src={job.image} alt={job.title} />
            ) : (
              <div className="fallback-image flex justify-center items-center absolute inset-0 w-full h-full transition-all duration-400 ease-out">
                <img src={`/team-logos/${job.team.toLowerCase()}.png`} alt={`${job.team} logo`} className="team-logo block max-w-20 max-h-20 object-contain transition-all duration-400 ease-out drop-shadow-lg" />
              </div>
            )}
          </div>
          <div className="job-info">
            <span className="category-pill">{job.category}</span>
            <h3 className="job-title">{job.title}</h3>
            <p className="job-desc">{job.description}</p>
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
          position: relative;
          width: calc(100% - 0.5rem);
          cursor: pointer;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }

        .job-card > * {
          position: relative;
          z-index: 2;
        }

        @media (min-width: 1024px) {
          .job-card {
            width: 100%;
          }
        }

        .job-card::before,
        .job-card::after {
          content: '';
          position: absolute;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .job-card::before {
          inset: 0;
          background-color: var(--dark-100);
          border: 3px solid var(--gradient-100);
          border-radius: 1rem;
          box-shadow: rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px;
          z-index: 1;
        }

        .job-card::after {
          inset: 1rem -0.85rem -0.85rem 1rem;
          border-radius: 1rem;
          z-index: 0;
          background: linear-gradient(135deg, var(--primary-400), var(--secondary-300));
          opacity: 0;
        }

        /* Enhanced hover effects */
        .job-card:hover {
          transform: translateY(-8px) scale(1.02);
        }
        
        .job-card:hover::before {
          border-color: var(--primary-300);
          background: linear-gradient(135deg, 
            rgba(255, 159, 252, 0.08) 0%,
            rgba(101, 186, 255, 0.08) 50%,
            rgba(255, 159, 252, 0.08) 100%
          ), var(--dark-100);
          box-shadow: 
            rgba(0, 0, 0, 0.4) 0px 30px 60px, 
            rgba(0, 0, 0, 0.3) 0px 20px 30px,
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 40px rgba(255, 159, 252, 0.2);
        }

        .job-card:hover::after {
          opacity: 0.1;
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 */
          overflow: hidden;
          border-radius: 1rem 1rem 0 0;
        }

        .image-wrapper > img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%; 
          height: 100%;
          object-fit: cover;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .job-card:hover .image-wrapper > img {
          transform: scale(1.1);
          filter: brightness(1.1) contrast(1.05);
        }

        .fallback-image {
          background: linear-gradient(45deg, var(--primary-400), var(--secondary-200));
        }

        .job-card:hover .fallback-image {
          background: linear-gradient(45deg, var(--primary-300), var(--secondary-100));
          transform: scale(1.05);
        }

        /* .team-logo styles are now handled by Tailwind classes */

        .job-card:hover .team-logo {
          transform: scale(1.15) rotate(5deg);
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
        }

        .job-info {
          padding: var(--spacing-md, 1.5rem);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 0.75rem);
          background-color: transparent;
        }

        .category-pill {
          display: inline-block;
          background: var(--neutral-100);
          color: var(--dark-100);
          padding: var(--spacing-xs, 0.5rem) var(--spacing-sm, 1rem);
          border-radius: var(--radius-pill, 20px);
          font-size: var(--text-xs, 0.75rem);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
          width: max-content;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .category-pill::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .job-card:hover .category-pill {
          background: var(--primary-300);
          color: var(--neutral-100);
          transform: translateX(8px) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .job-card:hover .category-pill::before {
          left: 100%;
        }

        .job-title {
          margin: 0;
          font-size: var(--text-lg, 1.25rem);
          font-weight: 600;
          color: var(--neutral-200);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          line-height: 1.4;
        }

        .job-card:hover .job-title {
          color: var(--primary-300);
          transform: translateX(4px);
        }

        .job-desc {
          margin: 0;
          font-size: var(--text-sm, 0.9rem);
          color: var(--neutral-400);
          line-height: 1.6;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .job-card:hover .job-desc {
          color: var(--neutral-300);
          transform: translateX(2px);
        }

        /* Add a pulsing effect */
        @keyframes pulse {
          0%, 100% {
            box-shadow: 
              rgba(0, 0, 0, 0.3) 0px 19px 38px, 
              rgba(0, 0, 0, 0.22) 0px 15px 12px;
          }
          50% {
            box-shadow: 
              rgba(0, 0, 0, 0.4) 0px 30px 60px, 
              rgba(0, 0, 0, 0.3) 0px 20px 30px,
              0 0 40px rgba(255, 159, 252, 0.15);
          }
        }

        .job-card:hover::before {
          animation: pulse 2s ease-in-out infinite;
        }

        /* Focus styles for accessibility */
        .job-card:focus {
          outline: 2px solid var(--primary-300);
          outline-offset: 4px;
        }

        .job-card:focus:not(:hover) {
          transform: translateY(-2px);
        }

        /* Smooth entrance animation */
        .job-card {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(30px);
        }

        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Stagger the animation for each card */
        .job-card:nth-child(1) { animation-delay: 0.1s; }
        .job-card:nth-child(2) { animation-delay: 0.2s; }
        .job-card:nth-child(3) { animation-delay: 0.3s; }
        .job-card:nth-child(4) { animation-delay: 0.4s; }
        .job-card:nth-child(5) { animation-delay: 0.5s; }
        .job-card:nth-child(6) { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}

export function JobStructuredData() {
  const jobsAsLD = positions.map((job) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: new Date().toISOString().split('T')[0], // heute
    validThrough: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    employmentType: "VOLUNTEER", 
    hiringOrganization: {
      "@type": "Organization",
      name: "IGNITE Startup Club Lüneburg",
      sameAs: "https://ignite-startupclub.de",
      logo: "https://ignite-startupclub.de/favicon.svg"
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Lüneburg",
        addressCountry: "DE"
      }
    },
    identifier: {
      "@type": "PropertyValue",
      name: "IGNITE",
      value: job.id
    }
  }));

  return (
    <script type="application/ld+json" suppressHydrationWarning>
      {JSON.stringify(jobsAsLD.length === 1 ? jobsAsLD[0] : jobsAsLD)}
    </script>
  );
}