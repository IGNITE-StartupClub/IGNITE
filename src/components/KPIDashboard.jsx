import React, { useState, useEffect, useRef } from 'react';
import { kpiData, kpiHeading, kpiSubheading } from '../data/kpiData';

// Icon components
const Icons = {
  calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  heart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  book: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  ),
  building: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <path d="M9 22v-4h6v4"></path>
      <path d="M8 6h.01"></path>
      <path d="M16 6h.01"></path>
      <path d="M12 6h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M16 10h.01"></path>
      <path d="M16 14h.01"></path>
      <path d="M8 10h.01"></path>
      <path d="M8 14h.01"></path>
    </svg>
  ),
  star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
};

// Animated counter hook
function useCountUp(target, duration = 2000, shouldStart = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime = null;
    let animationFrame = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration, shouldStart]);

  return count;
}

// Single KPI card component
function KPICard({ item, isVisible }) {
  const count = useCountUp(item.value, 2000, isVisible);
  const IconComponent = Icons[item.icon] || Icons.star;

  return (
    <div className="kpi-card">
      <div className="kpi-icon">
        <IconComponent />
      </div>
      <div className="kpi-value">
        {count}{item.suffix || ''}
      </div>
      <div className="kpi-label">
        {item.label}
      </div>
    </div>
  );
}

// Main KPI Dashboard component
export default function KPIDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="kpi-section" ref={containerRef}>
      <div className="kpi-container">
        <div className="kpi-header">
          <h2 className="kpi-heading">{kpiHeading}</h2>
          <p className="kpi-subheading">{kpiSubheading}</p>
        </div>

        <div className="kpi-grid">
          {kpiData.map((item, index) => (
            <KPICard
              key={index}
              item={item}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>

      <style>{`
        .kpi-section {
          z-index: 40;
        }

        .kpi-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .kpi-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .kpi-heading {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--font-color, #333);
        }

        .kpi-subheading {
          font-size: 1.25rem;
          color: var(--neutral-400, #666);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }

        .kpi-card {
          background: var(--background, #fff);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(140, 57, 116, 0.15);
        }

        .kpi-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #8C3974 0%, #a8457d 100%);
          border-radius: 50%;
          margin-bottom: 1rem;
          color: white;
        }

        .kpi-value {
          font-size: 3rem;
          font-weight: 800;
          color: #8C3974;
          line-height: 1.2;
        }

        .kpi-label {
          font-size: 1rem;
          color: var(--neutral-400, #666);
          margin-top: 0.5rem;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .kpi-section {
            padding: 3rem 0;
          }

          .kpi-heading {
            font-size: 2rem;
          }

          .kpi-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .kpi-card {
            padding: 1.5rem;
          }

          .kpi-value {
            font-size: 2.5rem;
          }
        }

        /* Dark mode support */
        .darkmode .kpi-section {
          background: linear-gradient(135deg, rgba(140, 57, 116, 0.1) 0%, rgba(140, 57, 116, 0.15) 100%);
        }

        .darkmode .kpi-card {
          background: var(--dark-100, #1a1a1a);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .darkmode .kpi-card:hover {
          box-shadow: 0 8px 30px rgba(140, 57, 116, 0.25);
        }
      `}</style>
    </section>
  );
}
