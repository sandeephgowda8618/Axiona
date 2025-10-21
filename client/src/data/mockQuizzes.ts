import { Quiz } from '../types/quiz';

// Mock quiz data
const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of JavaScript basics',
    subject: 'Programming',
    category: 'Programming',
    difficulty: 'Beginner',
    totalQuestions: 10,
    maxMarks: 100,
    duration: 30,
    passingMarks: 70,
    instructions: ['Read all questions carefully', 'Select the best answer'],
    questions: [],
    isTimeLimited: true,
    allowReview: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResults: true,
    retakeAllowed: true,
    maxAttempts: 3,
    createdBy: 'system',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tags: ['javascript', 'programming', 'web-development'],
    proctoring: {
      enabled: false,
      fullscreenRequired: false,
      tabSwitchLimit: 3,
      timeWarningAt: 300,
      criticalTimeWarningAt: 60,
      preventCopyPaste: false,
      preventRightClick: false,
      preventBrowserBack: false,
      detectTabSwitch: false,
      detectFullscreenExit: false,
      autoSubmitOnTimeExpiry: true,
      maxIdleTime: 300,
      suspiciousActivityThreshold: 5,
      blockDeveloperTools: false,
      preventTextSelection: false,
      disableZoom: false,
      monitorMouseActivity: false
    }
  }
];

export const getQuizById = (id: string): Quiz | undefined => {
  return mockQuizzes.find(quiz => quiz.id === id);
};

export const getAllQuizzes = (): Quiz[] => {
  return mockQuizzes;
};

export default mockQuizzes;
