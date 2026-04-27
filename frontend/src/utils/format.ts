import { QuestionType, DifficultyLevel } from '@/types';
import dayjs from 'dayjs';

export const formatQuestionType = (type: QuestionType): string => {
  const typeMap: Record<QuestionType, string> = {
    [QuestionType.SINGLE_CHOICE]: '单选题',
    [QuestionType.MULTIPLE_CHOICE]: '多选题',
    [QuestionType.TRUE_FALSE]: '判断题',
    [QuestionType.FILL_BLANK]: '填空题'
  };
  return typeMap[type] || type;
};

export const formatDifficulty = (difficulty: DifficultyLevel): string => {
  const difficultyMap: Record<DifficultyLevel, string> = {
    [DifficultyLevel.EASY]: '简单',
    [DifficultyLevel.MEDIUM]: '中等',
    [DifficultyLevel.HARD]: '困难'
  };
  return difficultyMap[difficulty] || difficulty;
};

export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  const colorMap: Record<DifficultyLevel, string> = {
    [DifficultyLevel.EASY]: 'green',
    [DifficultyLevel.MEDIUM]: 'orange',
    [DifficultyLevel.HARD]: 'red'
  };
  return colorMap[difficulty] || 'default';
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
};

export const formatCountdown = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const parseCorrectAnswer = (type: QuestionType, correctAnswer: string): string[] => {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      try {
        const parsed = JSON.parse(correctAnswer);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [correctAnswer];
      } catch {
        return [correctAnswer];
      }
    case QuestionType.FILL_BLANK:
      try {
        const parsed = JSON.parse(correctAnswer);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [correctAnswer];
      } catch {
        return [correctAnswer];
      }
    default:
      return [correctAnswer];
  }
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
