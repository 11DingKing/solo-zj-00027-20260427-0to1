import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  LoginRequest,
  LoginResponse,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ExamPaper,
  AutoGeneratePaperRequest,
  ManualPaperRequest,
  ExamSession,
  ExamAnswer,
  ExamResult,
  ExamStats
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', credentials);
  }

  async register(data: { username: string; password: string; name: string; role: string }): Promise<User> {
    return this.post<User>('/auth/register', data);
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  async getQuestions(params?: { page?: number; size?: number; type?: string; difficulty?: string; tags?: string }): Promise<{
    content: Question[];
    totalElements: number;
    totalPages: number;
  }> {
    return this.get('/questions', { params });
  }

  async getQuestion(id: number): Promise<Question> {
    return this.get<Question>(`/questions/${id}`);
  }

  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    return this.post<Question>('/questions', data);
  }

  async updateQuestion(id: number, data: UpdateQuestionRequest): Promise<Question> {
    return this.put<Question>(`/questions/${id}`, data);
  }

  async deleteQuestion(id: number): Promise<void> {
    return this.delete(`/questions/${id}`);
  }

  async getExamPapers(): Promise<ExamPaper[]> {
    return this.get<ExamPaper[]>('/exam-papers');
  }

  async getExamPaper(id: number): Promise<ExamPaper> {
    return this.get<ExamPaper>(`/exam-papers/${id}`);
  }

  async autoGeneratePaper(data: AutoGeneratePaperRequest): Promise<ExamPaper> {
    return this.post<ExamPaper>('/exam-papers/auto-generate', data);
  }

  async createManualPaper(data: ManualPaperRequest): Promise<ExamPaper> {
    return this.post<ExamPaper>('/exam-papers/manual', data);
  }

  async deleteExamPaper(id: number): Promise<void> {
    return this.delete(`/exam-papers/${id}`);
  }

  async getStudentExamPapers(): Promise<ExamPaper[]> {
    return this.get<ExamPaper[]>('/exam/available');
  }

  async startExam(examPaperId: number): Promise<ExamSession> {
    return this.post<ExamSession>(`/exam/start/${examPaperId}`);
  }

  async getExamSession(sessionId: number): Promise<ExamSession> {
    return this.get<ExamSession>(`/exam/session/${sessionId}`);
  }

  async submitAnswer(sessionId: number, questionId: number, answer: string): Promise<ExamAnswer> {
    return this.post<ExamAnswer>(`/exam/session/${sessionId}/answer`, {
      questionId,
      studentAnswer: answer
    });
  }

  async getAnswers(sessionId: number): Promise<ExamAnswer[]> {
    return this.get<ExamAnswer[]>(`/exam/session/${sessionId}/answers`);
  }

  async submitExam(sessionId: number): Promise<ExamResult> {
    return this.post<ExamResult>(`/exam/session/${sessionId}/submit`);
  }

  async reportScreenSwitch(sessionId: number): Promise<void> {
    return this.post(`/exam/session/${sessionId}/screen-switch`);
  }

  async getExamResults(): Promise<ExamResult[]> {
    return this.get<ExamResult[]>('/exam-result/student');
  }

  async getExamResult(id: number): Promise<ExamResult> {
    return this.get<ExamResult>(`/exam-result/${id}`);
  }

  async getExamResultBySession(sessionId: number): Promise<ExamResult> {
    return this.get<ExamResult>(`/exam-result/session/${sessionId}`);
  }

  async getAnswersForGrading(sessionId: number): Promise<ExamAnswer[]> {
    return this.get<ExamAnswer[]>(`/exam-result/grading/${sessionId}`);
  }

  async gradeAnswer(answerId: number, score: number, comment?: string): Promise<ExamAnswer> {
    return this.put<ExamAnswer>(`/exam-result/grading/${answerId}`, {
      score,
      comment
    });
  }

  async getExamStats(examPaperId: number): Promise<ExamStats> {
    return this.get<ExamStats>(`/exam-result/stats/${examPaperId}`);
  }

  async getTags(): Promise<string[]> {
    return this.get<string[]>('/questions/tags');
  }
}

export const apiService = new ApiService();
