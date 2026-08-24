
import { GoogleGenAI } from "@google/genai";
import { UnitFormInputs, GenerationResult, LearningProposal } from "../types";
import { PBL_PROMPT, GAMIFIED_PROMPT, EDIT_PROMPT } from "../constants";

// Gemini solicita migrar los modelos antiguos a esta versión disponible para usuarios nuevos.
const MODELS = ["gemini-3.6-flash"] as const;

const getApiKey = () => {
  const apiKey = process.env.API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Falta API_KEY. Configúrala en las variables de entorno del proyecto.");
  }
  return apiKey;
};

const describeApiError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|403|api key|permission|unauthenticated/i.test(message)) return 'La API Key es inválida o no tiene habilitada la Gemini API.';
  if (/404|not found|model/i.test(message)) return 'El modelo de Gemini no está disponible para esta API Key.';
  if (/429|quota|rate.?limit|overloaded/i.test(message)) return 'Se alcanzó la cuota o el límite temporal de la API.';
  return message;
};

const isRetryableError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /429|500|502|503|504|quota|rate.?limit|overloaded|timeout/i.test(message);
};

// Reintenta únicamente ante saturación/cuota/errores transitorios y cambia de modelo.
const generateWithFallback = async (ai: GoogleGenAI, prompt: string, config = {}) => {
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt, config });
      const text = response.text?.trim();
      if (!text) throw new Error(`El modelo ${model} devolvió una respuesta vacía.`);
      return { text, modelUsed: model };
    } catch (error) {
      lastError = error;
      console.warn(`[SHANUKI IA] Fallo con ${model}:`, error);
      if (!isRetryableError(error)) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No fue posible generar el recurso.");
};

const extractJson = <T,>(text: string): T => {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('La IA no devolvió una propuesta JSON válida.');
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
};

const processResponse = (text: string, modelUsed: string): GenerationResult => {
  let html = "";
  let distractors: string[] = [];

  const htmlMatch = text.match(/<html[\s\S]*<\/html>/i);
  if (htmlMatch) {
    html = htmlMatch[0];
  } else {
    const startIdx = text.toLowerCase().indexOf('<html');
    const endIdx = text.toLowerCase().lastIndexOf('</html>');
    if (startIdx !== -1 && endIdx !== -1) {
      html = text.substring(startIdx, endIdx + 7);
    }
  }

  const dataMatch = text.match(/<SHANUKI_DATA>([\s\S]*?)<\/SHANUKI_DATA>/i);
  if (dataMatch) {
    let jsonStr = dataMatch[1].trim();
    jsonStr = jsonStr.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    try {
      const data = JSON.parse(jsonStr);
      distractors = data.distractorWords || [];
    } catch (e) {
      console.error("Error parsing distractor words:", e);
    }
  }

  if (distractors.length === 0) {
    distractors = ["Error", "Bug", "Fallo", "Null", "Undefined", "False"];
  }

  if (!html) {
    throw new Error('La IA respondió, pero no devolvió un documento HTML válido. Intenta nuevamente.');
  }

  return {
    html,
    distractorWords: distractors,
    modelUsed
  };
};

const buildPrompt = (inputs: UnitFormInputs, production = false) => {
  const selectedPrompt = inputs.mode === 'gamified' ? GAMIFIED_PROMPT : PBL_PROMPT;
  const prompt = selectedPrompt
    .replaceAll('[NIVEL]', inputs.level).replaceAll('[LENGUAJE]', inputs.language)
    .replaceAll('[TEMA]', inputs.topic).replaceAll('[CS_THEORY_TEXT]', inputs.csTheoryText || 'No se adjuntó material teórico.')
    .replaceAll('[MATERIA]', inputs.interdisciplinarySubject).replaceAll('[CONTEXTO]', inputs.context)
    .replaceAll('[PROGRAM_TEXT]', inputs.programText || 'No se adjuntó programa interdisciplinario.')
    .replaceAll('[NARRATIVA]', inputs.narrativeTheme);
  const phase = production
    ? 'IGNORA la salida JSON de propuesta: la propuesta ya fue aprobada. Devuelve únicamente el HTML completo, sin markdown ni explicaciones.'
    : 'FASE DE PROPUESTA: devuelve solo JSON válido según el flujo SHANUKI y no generes HTML.';
  return `${prompt}\n\nFICHA DOCENTE:\n${JSON.stringify(inputs)}\n\n${phase}`;
};

export const generateLearningProposal = async (inputs: UnitFormInputs): Promise<LearningProposal> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const result = await generateWithFallback(ai, buildPrompt(inputs), {
    temperature: 0.4,
    responseMimeType: 'application/json'
  });
  try {
    return { ...extractJson<Omit<LearningProposal, 'modelUsed'>>(result.text), modelUsed: result.modelUsed };
  } catch {
    throw new Error('La propuesta recibida no tiene el formato esperado. Intenta nuevamente.');
  }
};

export const generateLearningUnit = async (inputs: UnitFormInputs): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const result = await generateWithFallback(ai, buildPrompt(inputs, true), { temperature: 0.7 });
  return processResponse(result.text, result.modelUsed);
};

export const updateLearningUnit = async (currentHtml: string, feedback: string): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const finalPrompt = EDIT_PROMPT
    .replace("[CURRENT_HTML]", currentHtml)
    .replace("[USER_FEEDBACK]", feedback);

  const result = await generateWithFallback(ai, finalPrompt);
  return processResponse(result.text, result.modelUsed);
};

export const suggestInterdisciplinarity = async (programText: string, level: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const prompt = `Analiza el siguiente fragmento de programa escolar de ${level} y sugiere una temática interdisciplinaria para un proyecto de informática basado en problemas (ABP). Devuelve solo el nombre de la materia y el tema en una frase corta (máximo 10 palabras).
  
  PROGRAMA: ${programText.substring(0, 5000)}`;

  // Para sugerencias simples, también usamos fallback para asegurar disponibilidad
  const result = await generateWithFallback(ai, prompt);
  return (result.text || "").trim();
};
