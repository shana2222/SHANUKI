
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
  resourceName: string;
  subjectArea: string;
  objectives: string;
  contents: string;
  duration: string;
  audience: string;
  approach: string;
  activityCount: string;
  accessibility: string;
  evaluation: string;
}

export interface GenerationResult {
  html: string;
  distractorWords: string[];
  modelUsed?: string;
}

export interface LearningProposal {
  summary: string;
  objectives: string[];
  structure: string[];
  activities: string[];
  feedback: string;
  accessibility: string[];
  visualStyle: string;
  dynamicData: string[];
  dependencies: string[];
  validationDecisions: Array<{ element: string; proposal: string; approval: string }>;
  modelUsed?: string;
}
