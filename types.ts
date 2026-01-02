
export type GenerationMode = 'pbl' | 'gamified';

export interface UnitFormInputs {
  language: string;
  topic: string;
  level: string;
  // New: CS Theory Text
  csTheoryText?: string;
  
  // Mode Selection
  mode: GenerationMode;

  // PBL Specifics
  interdisciplinarySubject: string;
  context: string;
  programText?: string; // Interdisciplinary PDF text

  // Gamified Specifics
  narrativeTheme: string;
}

export interface GenerationResult {
  html: string;
  distractorWords: string[];
}
