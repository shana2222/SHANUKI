
import { GoogleGenAI } from "@google/genai";
import { UnitFormInputs, GenerationResult } from "../types";
import { PBL_PROMPT, GAMIFIED_PROMPT, EDIT_PROMPT } from "../constants";

const processResponse = (text: string): GenerationResult => {
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

  return {
    html: html || "Error al generar el HTML.",
    distractorWords: distractors
  };
};

export const generateLearningUnit = async (inputs: UnitFormInputs): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let selectedPrompt = inputs.mode === 'gamified' ? GAMIFIED_PROMPT : PBL_PROMPT;
  
  // Common replacements
  let finalPrompt = selectedPrompt
    .replace("[NIVEL]", inputs.level)
    .replace("[LENGUAJE]", inputs.language)
    .replace("[TEMA]", inputs.topic)
    .replace("[CS_THEORY_TEXT]", inputs.csTheoryText || "Usa tu conocimiento general, no se adjuntó teórico específico.");

  if (inputs.mode === 'pbl') {
    finalPrompt = finalPrompt
      .replace("[MATERIA]", inputs.interdisciplinarySubject)
      .replace("[CONTEXTO]", inputs.context)
      .replace("[PROGRAM_TEXT]", inputs.programText || "No se cargó archivo de programa interdisciplinario.");
  } else {
    finalPrompt = finalPrompt
      .replace("[NARRATIVA]", inputs.narrativeTheme);
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: finalPrompt,
    config: {
      temperature: 0.9, // Higher creativity for gamified/PBL scenarios
    },
  });

  return processResponse(response.text || "");
};

export const updateLearningUnit = async (currentHtml: string, feedback: string): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const finalPrompt = EDIT_PROMPT
    .replace("[CURRENT_HTML]", currentHtml)
    .replace("[USER_FEEDBACK]", feedback);

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: finalPrompt,
  });

  return processResponse(response.text || "");
};

export const suggestInterdisciplinarity = async (programText: string, level: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analiza el siguiente fragmento de programa escolar de ${level} y sugiere una temática interdisciplinaria para un proyecto de informática basado en problemas (ABP). Devuelve solo el nombre de la materia y el tema en una frase corta (máximo 10 palabras).
  
  PROGRAMA: ${programText.substring(0, 5000)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return (response.text || "").trim();
};
