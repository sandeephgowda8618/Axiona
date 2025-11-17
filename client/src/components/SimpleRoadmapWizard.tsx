import React, { useState } from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import {
  ComputerDesktopIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';

interface SimpleRoadmapWizardProps {
  onComplete: (roadmap: any) => void;
  onCancel: () => void;
}

// Define the question sections with their emojis and content
const questionSections = [
  {
    id: 'domain_discovery',
    title: '🧩 Domain & Interest Discovery',
    description: "Let's identify what you want to learn and your current experience level"
  },
  {
    id: 'skill_assessment',
    title: '📊 Skill Assessment',
    description: 'Help us understand your technical background and current knowledge'
  },
  {
    id: 'learning_preferences',
    title: '🎯 Learning Preferences',
    description: 'Tell us how you prefer to learn and absorb new information'
  },
  {
    id: 'goal_commitment',
    title: '🎪 Goal & Commitment',
    description: 'Share your objectives and how much time you can dedicate'
  },
  {
    id: 'additional_preferences',
    title: '⚡ Additional Preferences',
    description: 'Optional: Customize your learning experience further (you can skip this)'
  }
];

const SimpleRoadmapWizard: React.FC<SimpleRoadmapWizardProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1); // Start with 1 for domain discovery
  const [selectedDomain, setSelectedDomain] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showDynamicQuestions, setShowDynamicQuestions] = useState(false);

  const domains = [
    {
      id: 'Computer Science',
      name: 'DSA',
      description: 'Data Structures & Algorithms',
      icon: ComputerDesktopIcon,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'Machine Learning',
      name: 'Machine Learning',
      description: 'AI & ML Fundamentals',
      icon: CpuChipIcon,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'Web Development',
      name: 'Web Development',
      description: 'Frontend & Backend',
      icon: GlobeAltIcon,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'Cybersecurity',
      name: 'Cybersecurity',
      description: 'Security & Privacy',
      icon: ShieldCheckIcon,
      color: 'bg-red-100 text-red-600'
    },
    {
      id: 'Mobile Development',
      name: 'Mobile Development',
      description: 'iOS & Android Apps',
      icon: DevicePhoneMobileIcon,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      id: 'DevOps',
      name: 'DevOps',
      description: 'Cloud & Infrastructure',
      icon: CloudIcon,
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  const experienceLevels = [
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'Just getting started with the basics'
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      description: 'Have some knowledge and practice'
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Experienced and looking to deepen skills'
    }
  ];

  // Helper function to provide default options for questions
  const getDefaultOptions = (questionType: string, category: string): string[] => {
    if (questionType !== 'multiple_choice') return [];
    
    switch (category) {
      case 'prerequisites':
        return ['No prior experience', 'Some coursework', 'Self-taught basics', 'Professional experience'];
      case 'learning_preferences':
        return ['hands-on projects', 'video lectures', 'reading textbooks', 'interactive tutorials'];
      case 'time_availability':
        return ['1-5 hours', '5-10 hours', '10-15 hours', '15+ hours'];
      case 'difficulty_alignment':
        return ['beginner', 'intermediate', 'advanced'];
      default:
        return ['Yes', 'No', 'Not sure'];
    }
  };

  const loadQuestions = async () => {
    if (!selectedDomain || !experienceLevel) return;

    try {
      setIsGeneratingQuestions(true);

      const response = await fetch('http://localhost:5050/api/pipeline/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: selectedDomain,
          experience_level: experienceLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.questions && Array.isArray(data.questions)) {
        
        // Replace template variables in questions
        const processedQuestions = data.questions.map((q: any) => ({
          ...q,
          question_text: q.question_text
            .replace(/\[SUBJECT\]/g, selectedDomain)
            .replace(/\{\{subject\}\}/g, selectedDomain)
            .replace(/\{\{learning_goal\}\}/g, selectedDomain),
          // Add default options for questions that don't have them
          options: q.options || getDefaultOptions(q.question_type, q.category)
        }));
        
        setQuestions(processedQuestions);
      } else {
        console.error('Invalid questions format received:', data);
        // Fallback to generate sample domain-specific questions
        setQuestions(generateSampleQuestions(selectedDomain, experienceLevel));
      }
    } catch (error) {
      console.error('❌ Error loading pipeline questions:', error);
      // Fallback to sample questions
      setQuestions(generateSampleQuestions(selectedDomain, experienceLevel));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Move to questions step when both domain and experience are selected and next is clicked
  const handleProceedToQuestions = async () => {
    if (!selectedDomain || !experienceLevel) return;
    
    setCurrentStep(2);
    await loadQuestions();
  };

  const generateSampleQuestions = (domain: string, level: string) => {
    const baseQuestions = [
      {
        question_id: 'q1',
        question_text: `What is your current experience with ${domain}?`,
        question_type: 'multiple_choice',
        options: ['None', 'Basic', 'Intermediate', 'Advanced']
      },
      {
        question_id: 'q2',
        question_text: 'How many hours per week can you dedicate to studying?',
        question_type: 'multiple_choice',
        options: ['1-5 hours', '5-10 hours', '10-20 hours', '20+ hours']
      },
      {
        question_id: 'q3',
        question_text: 'What is your preferred learning style?',
        question_type: 'multiple_choice',
        options: ['Video tutorials', 'Reading documentation', 'Hands-on projects', 'Interactive courses']
      }
    ];
    return baseQuestions;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleGenerateRoadmap = async () => {
    try {
      setIsLoading(true);
      
      // Validate that we have answers
      if (Object.keys(answers).length === 0) {
        alert('Please answer at least one question before generating the roadmap.');
        return;
      }
      
      // Convert answers to the format expected by the backend
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: answer
      }));

      const roadmapData = {
        userId: user?.id || 'anonymous-user',
        userAnswers: formattedAnswers,
        domain: selectedDomain,
        experience_level: experienceLevel
      };

      
      const response = await fetch('http://localhost:5050/api/pipeline/roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roadmapData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        
        try {
          // Call the completion handler
          await onComplete(result.data);
        } catch (completionError) {
          console.error('❌ Error in onComplete handler:', completionError);
          throw new Error('Failed to process the generated roadmap');
        }
      } else {
        throw new Error(result.message || 'Backend did not return successful result');
      }
      
    } catch (error) {
      console.error('❌ Error generating roadmap:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Show user-friendly error message
      if (errorMessage.includes('Failed to fetch')) {
        alert('Network error: Please check your internet connection and try again.');
      } else if (errorMessage.includes('Backend returned')) {
        alert('Server error: The roadmap service is temporarily unavailable. Please try again later.');
      } else {
        alert(`Failed to generate roadmap: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderDomainStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          🧩 Domain & Interest Discovery
        </h3>
        <p className="text-gray-600">
          Let's identify what you want to learn and your experience level
        </p>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Which area would you like to focus on right now?
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {domains.map((domain) => {
            const Icon = domain.icon;
            return (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDomain === domain.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${domain.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{domain.name}</div>
                    <div className="text-sm text-gray-500">{domain.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Have you already studied or practiced this area before?
        </h4>
        <div className="space-y-3">
          {experienceLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => setExperienceLevel(level.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                experienceLevel === level.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{level.name}</div>
              <div className="text-sm text-gray-500">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleProceedToQuestions}
          disabled={!selectedDomain || !experienceLevel}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <span>Next: Assessment Questions</span>
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderQuestionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          📝 Assessment Questions
        </h3>
        <p className="text-gray-600">
          Help us understand your background and goals
        </p>
      </div>

      {isGeneratingQuestions ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating personalized questions...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.question_id} className="space-y-3">
              <h4 className="font-medium text-gray-900">
                {index + 1}. {question.question_text}
              </h4>
              
              {question.question_type === 'multiple_choice' && question.options && question.options.length > 0 && (
                <div className="space-y-2">
                  {question.options.map((option: string) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={question.question_id}
                        value={option}
                        checked={answers[question.question_id] === option}
                        onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.question_type === 'numeric_input' && (
                <div className="space-y-2">
                  <input
                    type="number"
                    min="1"
                    max="40"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={answers[question.question_id] || ''}
                    onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                    placeholder="Enter number of hours per week"
                  />
                </div>
              )}
              
              {question.question_type === 'rating_scale' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Not at all</span>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleAnswerChange(question.question_id, value)}
                      className={`w-10 h-10 rounded-full border-2 font-medium ${
                        answers[question.question_id] === value
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                  <span className="text-sm text-gray-500">Very comfortable</span>
                </div>
              )}
              
              {question.question_type === 'open_ended' && (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={3}
                  value={answers[question.question_id] || ''}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                  placeholder="Type your answer here..."
                />
              )}

              {!['multiple_choice', 'numeric_input', 'rating_scale', 'open_ended'].includes(question.question_type) && (
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={answers[question.question_id] || ''}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                  placeholder="Your answer"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
        
        <button
          onClick={handleGenerateRoadmap}
          disabled={isLoading || Object.keys(answers).length === 0}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <span>Generate My Roadmap</span>
              <ChevronRightIcon className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔮 Generating Your Personalized Roadmap</h3>
              <p className="text-gray-600 mb-4">Our AI system is analyzing your preferences and searching through our knowledge base...</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>🔍 Searching relevant learning resources</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>🧠 Processing with fine-tuned AI model</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>📚 Creating your personalized roadmap</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Learning Roadmap</h2>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <div className={`h-1 flex-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}>Domain & Experience</span>
              <span className={currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}>Assessment</span>
            </div>
          </div>

          {currentStep === 1 && renderDomainStep()}
          {currentStep === 2 && renderQuestionsStep()}
        </div>
      </div>
    </div>
  );
};

export default SimpleRoadmapWizard;
