
export interface UnitFormInputs {
  language: string;
  topic: string;
  interdisciplinarySubject: string;
  context: string;
  level: string;
  programText?: string;
}

export interface GenerationResult {
  html: string;
  distractorWords: string[];
}
