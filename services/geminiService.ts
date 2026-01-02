
import { GoogleGenAI } from "@google/genai";
import { UnitFormInputs, GenerationResult } from "../types";
import { MASTER_PROMPT } from "../constants";

export const generateLearningUnit = async (inputs: UnitFormInputs): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const finalPrompt = MASTER_PROMPT
    .replace("[NIVEL]", inputs.level)
    .replace("[LENGUAJE]", inputs.language)
    .replace("[TEMA]", inputs.topic)
    .replace("[MATERIA]", inputs.interdisciplinarySubject)
    .replace("[CONTEXTO]", inputs.context)
    .replace("[PROGRAMA_TEXTO]", inputs.programText || "No se cargó archivo de programa.");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: finalPrompt,
    config: {
      temperature: 0.8,
      topP: 0.95,
      topK: 64,
    },
  });

  const text = response.text || "";
  
  let html = "";
  let distractors: string[] = [];

  // Robust HTML extraction
  const htmlMatch = text.match(/<html[\s\S]*<\/html>/i);
  if (htmlMatch) {
    html = htmlMatch[0];
  } else {
    // Fallback: try to find anything between <html> and </html> if the first match failed
    const startIdx = text.toLowerCase().indexOf('<html');
    const endIdx = text.toLowerCase().lastIndexOf('</html>');
    if (startIdx !== -1 && endIdx !== -1) {
      html = text.substring(startIdx, endIdx + 7);
    }
  }

  // Tag-based extraction for the JSON data to avoid parsing messy AI output
  const dataMatch = text.match(/<SHANUKI_DATA>([\s\S]*?)<\/SHANUKI_DATA>/i);
  if (dataMatch) {
    let jsonStr = dataMatch[1].trim();
    // Remove potential markdown code blocks inside the tags
    jsonStr = jsonStr.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    try {
      const data = JSON.parse(jsonStr);
      distractors = data.distractorWords || [];
    } catch (e) {
      console.error("Error parsing distractor words from tag:", e, "String content:", jsonStr);
    }
  }

  // Secondary fallback if tag extraction failed
  if (distractors.length === 0) {
    const jsonMatch = text.match(/\{[\s\t\n]*"distractorWords"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        distractors = data.distractorWords || [];
      } catch (e) {
        console.error("Secondary JSON parse failed:", e);
      }
    }
  }

  return {
    html: html || "Error al generar el HTML. Por favor, intenta de nuevo con un prompt más específico.",
    distractorWords: distractors.length > 0 ? distractors : ["Sintaxis", "Lógica", "Entrada", "Salida", "Tipo", "Estructura"]
  };
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
