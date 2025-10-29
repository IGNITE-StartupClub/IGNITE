import { useState } from 'react';

export default function AIPromptCard({ className = '' }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    
    // TODO: Replace with actual LLM API call
    setTimeout(() => {
      console.log('Frage gestellt:', input);
      setInput('');
      setIsLoading(false);
    }, 1000);
  };

  const examplePrompts = [
    "Welche Events finden diese Woche statt?",
    "Empfiehl mir ein Networking Event",
    "Wann ist der nächste Workshop?"
  ];

  return (
    <div className={`ai-prompt-card ${className}`}>
      {/* Header */}
      <div>
        <h3>Das passiert im Startup Ökosystem...</h3>
        <p class="py-4">Nutze unsere KI für die perfekten Empfehlungen</p>
      </div>

      {/* Example Prompts */}
      <div className="example-prompts">
        {examplePrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => setInput(prompt)}
            className="example-button"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frage nach Events, Workshops, oder Networking-Gelegenheiten..."
            className="prompt-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? (
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .ai-prompt-card {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(15, 15, 23, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          padding: 2rem;
        }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .card-header h3 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #5227FF, #FF9FFC, #B19EEF);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 20px rgba(82, 39, 255, 0.3);
        }

        .card-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .example-prompts {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .example-button {
          padding: 0.75rem 1rem;
          font-weight: bold;
          text-decoration: none;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 100vw;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out;
          text-align: left;
          font-size: 0.9rem;
        }

        .example-button:hover {
          background-color: rgba(82, 39, 255, 0.15);
          border-color: rgba(82, 39, 255, 0.3);
          color: white;
        }

        .prompt-form {
          position: relative;
        }

        .input-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .prompt-input {
          flex: 1;
          padding: 0.75rem 1rem;
          font-weight: bold;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-radius: 100vw;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          outline: none;
          transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
          font-size: 0.9rem;
        }

        .prompt-input:focus {
          border-color: #5227FF;
          background-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 1px rgba(82, 39, 255, 0.2);
        }

        .prompt-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .prompt-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-weight: normal;
        }

        .send-button {
          padding: 0.75rem;
          font-weight: bold;
          border: 3px solid transparent;
          border-radius: 100vw;
          background: linear-gradient(135deg, #5227FF, #FF9FFC);
          color: white;
          cursor: pointer;
          transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          height: 48px;
          box-shadow: 0 4px 15px rgba(82, 39, 255, 0.3);
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(82, 39, 255, 0.4);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 15px rgba(82, 39, 255, 0.2);
        }

        .loading-dots {
          display: flex;
          gap: 3px;
        }

        .loading-dots span {
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: loading 1.2s infinite ease-in-out;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes loading {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ai-prompt-card {
            padding: 1.5rem;
            margin: 0 1rem;
          }
          
          .input-container {
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}