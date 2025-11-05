/**
 * Parser für die Fragebogen-Konfiguration aus der Markdown-Datei
 */

import questionnaireContent from './questionnaire.md?raw';

function parseQuestionnaireConfig(content) {
  const config = {
    step1: {},
    step2: {},
    step3: { options: [], questions: {} },
    step4: { questions: {} },
    step5: { questions: {} },
    step6: { fields: {}, submitButton: {} }
  };

  const lines = content.split('\n');
  let currentStep = null;
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Schritt-Überschriften erkennen
    if (line.startsWith('## Schritt 1:')) {
      currentStep = 'step1';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 2:')) {
      currentStep = 'step2';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 3:')) {
      currentStep = 'step3';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 4:')) {
      currentStep = 'step4';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 5:')) {
      currentStep = 'step5';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 6:')) {
      currentStep = 'step6';
      currentQuestion = null;
    }

    // Fragen-Überschriften erkennen (### Frage Q1, Q2, etc.)
    if (line.startsWith('### Frage Q')) {
      const questionId = line.match(/Q(\d+)/);
      if (questionId) {
        currentQuestion = 'q' + questionId[1];
        if (currentStep === 'step3' || currentStep === 'step4' || currentStep === 'step5') {
          config[currentStep].questions[currentQuestion] = {};
        }
      }
    } else if (line.startsWith('### Vorname')) {
      currentQuestion = 'name';
      config.step6.fields[currentQuestion] = {};
    } else if (line.startsWith('### Nachname')) {
      currentQuestion = 'lastname';
      config.step6.fields[currentQuestion] = {};
    } else if (line.startsWith('### E-Mail')) {
      currentQuestion = 'email';
      config.step6.fields[currentQuestion] = {};
    }

    // Eigenschaften parsen
    if (line.startsWith('**') && line.includes(':**')) {
      const match = line.match(/\*\*(.+?):\*\*\s*(.+)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        // Werte basierend auf dem Schlüssel zuordnen
        if (currentStep === 'step1' && key === 'Button Text') {
          config.step1.buttonText = value;
        } else if (currentStep === 'step2') {
          if (key === 'Label') config.step2.label = value;
          else if (key === 'Minimum Teams') config.step2.minTeams = parseInt(value);
          else if (key === 'Maximum Teams') config.step2.maxTeams = parseInt(value);
          else if (key === 'Hinweis (zu wenig)') config.step2.hintTooFew = value;
          else if (key === 'Hinweis (maximum)') config.step2.hintMaximum = value;
        } else if (currentStep === 'step3') {
          if (key === 'Frage' && !currentQuestion) {
            config.step3.legend = value;
          } else if (currentQuestion && config.step3.questions[currentQuestion]) {
            if (key === 'Label') config.step3.questions[currentQuestion].label = value;
            else if (key === 'Typ') config.step3.questions[currentQuestion].type = value;
            else if (key === 'Zeilen') config.step3.questions[currentQuestion].rows = parseInt(value);
            else if (key === 'Pflichtfeld') config.step3.questions[currentQuestion].required = value === 'Ja';
          }
        } else if (currentStep === 'step4' && currentQuestion) {
          if (key === 'Label') config.step4.questions[currentQuestion].label = value;
          else if (key === 'Typ') config.step4.questions[currentQuestion].type = value;
          else if (key === 'Zeilen') config.step4.questions[currentQuestion].rows = parseInt(value);
          else if (key === 'Platzhalter') config.step4.questions[currentQuestion].placeholder = value;
          else if (key === 'Pflichtfeld') config.step4.questions[currentQuestion].required = value === 'Ja';
        } else if (currentStep === 'step5' && currentQuestion) {
          if (key === 'Label') config.step5.questions[currentQuestion].label = value;
          else if (key === 'Typ') config.step5.questions[currentQuestion].type = value;
          else if (key === 'Zeilen') config.step5.questions[currentQuestion].rows = parseInt(value);
          else if (key === 'Platzhalter') config.step5.questions[currentQuestion].placeholder = value;
          else if (key === 'Pflichtfeld') config.step5.questions[currentQuestion].required = value === 'Ja';
        } else if (currentStep === 'step6') {
          if (currentQuestion && config.step6.fields[currentQuestion]) {
            if (key === 'Label') config.step6.fields[currentQuestion].label = value;
            else if (key === 'Typ') config.step6.fields[currentQuestion].type = value;
            else if (key === 'Pflichtfeld') config.step6.fields[currentQuestion].required = value === 'Ja';
          } else if (key === 'Submit Button Text') {
            config.step6.submitButton.text = value;
          } else if (key === 'Submit Button Loading Text') {
            config.step6.submitButton.loadingText = value;
          }
        }
      }
    }

    // Optionen für Step 3 (Startup-Interesse) parsen
    if (currentStep === 'step3' && line.startsWith('- **') && line.includes(':**')) {
      const match = line.match(/- \*\*(.+?):\*\*\s*(.+)/);
      if (match) {
        const value = match[1].trim();
        const label = match[2].trim();
        config.step3.options.push({ value, label });
      }
    }
  }

  return config;
}

export const questionnaireConfig = parseQuestionnaireConfig(questionnaireContent);
