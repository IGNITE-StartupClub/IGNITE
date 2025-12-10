export const prerender = false

import type { APIRoute } from 'astro';
import { questionnaireConfig } from '../../data/questionnaireConfig';

export const GET: APIRoute = async () => {
  try {
    // Return static questionnaire config
    return new Response(JSON.stringify(questionnaireConfig), {
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
