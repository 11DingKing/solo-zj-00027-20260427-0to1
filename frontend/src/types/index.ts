export enum UserRole {
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  FILL_BLANK = "FILL_BLANK",
}

export enum DifficultyLevel {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  classId?: number;
  className?: string;
}

export interface QuestionOption {
  id: number;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: number;
  type: QuestionType;
  content: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctAnswer: string;
  score: number;
  difficulty: DifficultyLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: number;
  examPaperId: number;
  questionId: number;
  questionOrder: number;
  score: number;
  question: Question;
}

export interface ExamPaper {
  id: number;
  name: string;
  description?: string;
  totalScore: number;
  passingScore: number;
  duration: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  startTime: string;
  endTime: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  examQuestions: ExamQuestion[];
}

export interface ExamSession {
  id: number;
  examPaperId: number;
  studentId: number;
  startTime: string;
  endTime?: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
  screenSwitchCount: number;
  examPaper: ExamPaper;
}

export interface ExamAnswer {
  id: number;
  examSessionId: number;
  questionId: number;
  studentAnswer: string;
  isCorrect?: boolean;
  teacherScore?: number;
  teacherComment?: string;
  answeredAt: string;
}

export interface ExamResult {
  id: number;
  examSessionId: number;
  studentId: number;
  examPaperId: number;
  totalScore: number;
  autoScore: number;
  teacherScore?: number;
  isPassed: boolean;
  submittedAt: string;
  gradedAt?: string;
  examPaper: ExamPaper;
  student: User;
}

export interface QuestionStat {
  questionId: number;
  questionContent: string;
  totalAttempts: number;
  correctCount: number;
  correctRate: number;
  discrimination: number;
}

export interface TagStat {
  tag: string;
  totalQuestions: number;
  correctRate: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface ExamStats {
  avgScore: number;
  maxScore: number;
  minScore: number;
  totalStudents: number;
  scoreDistribution: ScoreDistribution[];
  questionStats: QuestionStat[];
  tagStats: TagStat[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateQuestionRequest {
  type: QuestionType;
  content: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctAnswer: string;
  score: number;
  difficulty: DifficultyLevel;
  tags: string[];
}

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {}

export interface AutoGeneratePaperRequest {
  name: string;
  description?: string;
  duration: number;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  startTime: string;
  endTime: string;
  questionRequirements: QuestionRequirement[];
  totalScore: number;
}

export interface QuestionRequirement {
  type: QuestionType;
  difficulty: DifficultyLevel;
  count: number;
  scorePerQuestion: number;
}

export interface ManualPaperRequest {
  name: string;
  description?: string;
  duration: number;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  startTime: string;
  endTime: string;
  questionIds: number[];
}
