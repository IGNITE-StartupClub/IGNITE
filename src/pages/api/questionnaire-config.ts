import type { APIRoute } from 'astro';
import { getQuestionnaire } from '../../lib/strapi/client';

export const GET: APIRoute = async () => {
  try {
    const strapiData = await getQuestionnaire();

    if (!strapiData) {
      return new Response(JSON.stringify({ error: 'Questionnaire not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform Strapi data to match the format expected by the Questionnaire component
    const config = {
      step1: {
        buttonText: strapiData.step1ButtonText,
      },
      step2: {
        label: strapiData.step2Label,
        minTeams: strapiData.step2MinTeams,
        maxTeams: strapiData.step2MaxTeams,
        hintTooFew: strapiData.step2HintTooFew,
        hintMaximum: strapiData.step2HintMaximum,
      },
      step3: {
        legend: strapiData.step3QuestionLabel,
        options: (strapiData.step3Options || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((opt) => ({
            value: opt.value,
            label: opt.label,
          })),
        questions: {},
      },
      step4: {
        questions: {},
      },
      step5: {
        questions: {},
      },
      step6: {
        fields: {
          name: {
            label: strapiData.step6FirstNameLabel,
            type: 'text',
            required: true,
          },
          lastname: {
            label: strapiData.step6LastNameLabel,
            type: 'text',
            required: true,
          },
          email: {
            label: strapiData.step6EmailLabel,
            type: 'email',
            required: true,
          },
        },
      },
      allQuestions: [] as string[],
    };

    // Process questions and group them by step
    const questions = strapiData.questions || [];
    const sortedQuestions = questions.sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const q of sortedQuestions) {
      const questionData = {
        label: q.label,
        type: q.fieldType,
        rows: q.rows,
        placeholder: q.placeholder || '',
        required: q.required,
      };

      const stepKey = `step${q.step}` as 'step3' | 'step4' | 'step5';
      if (stepKey === 'step3' || stepKey === 'step4' || stepKey === 'step5') {
        config[stepKey].questions[q.questionId] = questionData;
        config.allQuestions.push(q.questionId);
      }
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error loading questionnaire config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load questionnaire configuration' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
