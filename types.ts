
export type HandwritingStyle = 'cursive' | 'block' | 'calligraphy';
export type PageFormat = 'four-rule' | 'lined' | 'unruled';

export interface FeedbackMetric {
  label: string;
  score: number; // 0-100
  feedback: string;
}

export interface AnalysisResult {
  overallScore: number;
  styleDetected: HandwritingStyle;
  metrics: FeedbackMetric[];
  suggestedExercises: string[];
  transcription: string;
  wpm?: number;
  timeTakenSeconds?: number;
}

export interface PracticeSession {
  id: string;
  date: string;
  photoUrl: string;
  analysis: AnalysisResult;
  isSpeedMode?: boolean;
}

export interface UserStats {
  streak: number;
  totalSessions: number;
  averageScore: number;
  history: PracticeSession[];
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  PRACTICE = 'PRACTICE',
  ANALYSIS = 'ANALYSIS',
  HISTORY = 'HISTORY',
  TEMPLATES = 'TEMPLATES'
}
