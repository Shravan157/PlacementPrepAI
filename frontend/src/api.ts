/**
 * api.ts — Axios client wired to the FastAPI backend.
 *
 * Base URL: http://localhost:8000
 * Auth:     JWT stored in localStorage under "access_token".
 *           Attached automatically via request interceptor.
 *
 * All types mirror the backend Pydantic schemas exactly.
 */

import axios from "axios";

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token helpers ──────────────────────────────────────────────────────────────
export function saveToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export function hasToken(): boolean {
  return !!localStorage.getItem("access_token");
}

// ── Types ──────────────────────────────────────────────────────────────────────

// Auth
export interface UserOut {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Practice
export interface QuestionGenerateRequest {
  subject: string;        // e.g. "dbms"
  topic: string;          // e.g. "normalization"
  company_type?: string;  // e.g. "product_based"
  difficulty_tag: string; // "easy" | "medium" | "hard"
  generation_method?: "rag_generated" | "static_behavioral";
}

export interface QuestionOut {
  id: string;
  subject: string;
  topic: string;
  company_type?: string;
  question_text: string;
  source_chunk_ids: string[];
  difficulty_tag: string;
  generation_method: string;
  created_at: string;
}

export interface AnswerOut {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  submitted_at: string;
}

export interface TopicCoverageOut {
  id: string;
  subject: string;
  topic: string;
  attempts: number;
  avg_score: number;
  last_attempted_at?: string;
}

// Evaluation
export interface EvaluationOut {
  id: string;
  answer_id: string;
  correctness_score: number;
  completeness_score: number;
  clarity_score: number;
  overall_score: number;
  feedback_text: string;
  cited_chunk_ids: string[];
  weakest_subtopic?: string;
  created_at: string;
}

// History
export interface SubjectScoreSummary {
  subject: string;
  total_attempts: number;
  avg_correctness: number;
  avg_completeness: number;
  avg_clarity: number;
  avg_overall: number;
}

export interface DailyActivityPoint {
  date: string;
  answer_count: number;
}

export interface WeakTopicEntry {
  subject: string;
  topic: string;
  attempts: number;
  avg_score: number;
  last_attempted_at?: string;
}

export interface DashboardSummary {
  total_questions_attempted: number;
  total_answers_submitted: number;
  total_evaluations: number;
  subject_scores: SubjectScoreSummary[];
  weak_topics: WeakTopicEntry[];
  recent_activity: DailyActivityPoint[];
}

export interface AnswerHistoryEntry {
  answer_id: string;
  question_text: string;
  subject: string;
  topic: string;
  difficulty_tag: string;
  submitted_at: string;
  correctness_score?: number;
  completeness_score?: number;
  clarity_score?: number;
  overall_score?: number;
  feedback_text?: string;
  weakest_subtopic?: string;
}

// ── Auth API ───────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /auth/register */
  register: async (data: { email: string; password: string; name: string }): Promise<UserOut> => {
    const res = await api.post<UserOut>("/auth/register", data);
    return res.data;
  },

  /** POST /auth/login → saves token to localStorage */
  login: async (data: { email: string; password: string }): Promise<UserOut> => {
    const tokenRes = await api.post<Token>("/auth/login", data);
    saveToken(tokenRes.data.access_token);
    const meRes = await api.get<UserOut>("/auth/me");
    return meRes.data;
  },

  /** GET /auth/me */
  me: async (): Promise<UserOut> => {
    const res = await api.get<UserOut>("/auth/me");
    return res.data;
  },

  /** PUT /auth/me */
  updateMe: async (data: { name?: string; password?: string }): Promise<UserOut> => {
    const res = await api.put<UserOut>("/auth/me", data);
    return res.data;
  },

  /** Clear token and log out client-side */
  logout: () => clearToken(),
};

// ── Practice API ───────────────────────────────────────────────────────────────

export const practiceApi = {
  /** POST /practice/questions — generate a new question */
  generateQuestion: async (req: QuestionGenerateRequest): Promise<QuestionOut> => {
    const res = await api.post<QuestionOut>("/practice/questions", req);
    return res.data;
  },

  /** POST /practice/answers — submit an answer */
  submitAnswer: async (question_id: string, answer_text: string): Promise<AnswerOut> => {
    const res = await api.post<AnswerOut>("/practice/answers", { question_id, answer_text });
    return res.data;
  },

  /** GET /practice/coverage — topic mastery for the current user */
  getCoverage: async (subject?: string): Promise<TopicCoverageOut[]> => {
    const res = await api.get<TopicCoverageOut[]>("/practice/coverage", {
      params: subject ? { subject } : undefined,
    });
    return res.data;
  },
};

// ── Evaluation API ─────────────────────────────────────────────────────────────

export const evaluationApi = {
  /** POST /evaluation/evaluate — trigger rubric evaluation for an answer */
  evaluate: async (answer_id: string): Promise<EvaluationOut> => {
    const res = await api.post<EvaluationOut>("/evaluation/evaluate", { answer_id });
    return res.data;
  },

  /** GET /evaluation/{answer_id} — fetch existing evaluation */
  getByAnswerId: async (answer_id: string): Promise<EvaluationOut> => {
    const res = await api.get<EvaluationOut>(`/evaluation/${answer_id}`);
    return res.data;
  },
};

// ── History API ────────────────────────────────────────────────────────────────

export const historyApi = {
  /** GET /history/dashboard — aggregate stats */
  getDashboard: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>("/history/dashboard");
    return res.data;
  },

  /** GET /history/answers — chronological session list */
  getAnswers: async (subject?: string, limit = 50): Promise<AnswerHistoryEntry[]> => {
    const res = await api.get<AnswerHistoryEntry[]>("/history/answers", {
      params: { ...(subject ? { subject } : {}), limit },
    });
    return res.data;
  },
};

export default api;
