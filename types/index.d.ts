interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
  interviewInsights?: {
    mainTopicsDiscussed: string[];
    skillLevel: string;
    recommendedNext: string;
  };
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  extractedTechStack?: string[]; // Technologies actually discussed in the interview
  interviewName?: string; // Descriptive name based on interview content
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  completed?: boolean;
  completedAt?: string;
  score?: number;
  transcript?: { role: string; content: string }[];
  duration?: number; // in minutes
  status?: 'pending' | 'completed' | 'in-progress';
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserPreferences {
  // Notification preferences
  emailNotifications: boolean;
  interviewReminders: boolean;
  weeklyReports: boolean;
  achievementNotifications: boolean;

  // Interview preferences
  difficulty: 'easy' | 'medium' | 'hard';
  interviewDuration: number; // in minutes
  voiceEnabled: boolean;
  autoSave: boolean;
  showHints: boolean;
  feedbackDetail: 'basic' | 'detailed' | 'comprehensive';
  pauseEnabled: boolean;

  // Appearance preferences
  darkMode: boolean;
  language: string;
  timezone: string;

  // Privacy preferences
  profileVisibility: 'public' | 'private';
  shareStats: boolean;
  dataCollection: boolean;
}

interface UserStats {
  totalInterviews: number;
  averageScore: number;
  totalHours: number;
  recentInterviews?: Interview[];
}

interface UpdateProfileParams {
  name: string;
  email: string;
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview" | "template";
  questions?: string[];
  templateId?: string;
  role?: string;
  level?: string;
  techstack?: string[];
  interviewType?: string;
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}

interface CreateAssistantDTO {
  name: string;
  firstMessage: string;
  transcriber: {
    provider: string;
    model: string;
    language: string;
  };
  voice: {
    provider: string;
    voiceId: string;
    stability: number;
    similarityBoost: number;
    speed: number;
    style: number;
    useSpeakerBoost: boolean;
  };
  model: {
    provider: string;
    model: string;
    messages: Array<{
      role: string;
      content: string;
    }>;
  };
}

// Interview Template Interfaces
interface InterviewTemplate {
  id: string;
  name: string;
  description?: string;
  role: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  type: string[]; // Can have multiple types: Technical, Leadership, Sales, Behavioral, Product
  techstack: string[];
  duration?: number; // in minutes - optional for templates since they end when questions are completed
  questionCount: number;
  questions: string[];
  isPublic: boolean;
  createdBy: string; // userId
  createdAt: string;
  updatedAt: string;
  shareableLink: string;
  completionCount: number;
  averageScore?: number;
}

interface TemplateQuestion {
  id: string;
  content: string;
  category: string;
  order: number;
  isCustom: boolean; // true if written by user, false if AI-generated
}

interface CreateTemplateRequest {
  name: string;
  description?: string;
  role: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  type: string[];
  techstack: string[];
  questionCount: number;
  questions?: string[]; // Optional custom questions
  isPublic?: boolean;
  generateQuestions?: boolean; // If true, AI will generate questions
}

interface TemplateResponse {
  id: string;
  templateId: string;
  candidateName?: string;
  candidateEmail?: string;
  completedAt: string;
  duration: number;
  score?: number;
  transcript: { role: string; content: string }[];
  feedback?: {
    totalScore: number;
    categoryScores: Array<{
      name: string;
      score: number;
      comment: string;
    }>;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
  };
}

interface TemplateStats {
  totalResponses: number;
  averageScore: number;
  averageDuration: number;
  completionRate: number;
  lastCompleted?: string;
}

interface TemplateCardProps {
  template: InterviewTemplate;
  showStats?: boolean;
  isOwner?: boolean;
}

interface TemplateBuilderProps {
  template?: InterviewTemplate; // For editing existing templates
  onSave?: (template: InterviewTemplate) => void;
}

interface CandidateSessionProps {
  templateId: string;
  candidateName?: string;
  candidateEmail?: string;
}
