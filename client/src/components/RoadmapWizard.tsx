import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { generateRoadmap } from '../services/api';
import { 
  FiCpu, 
  FiMonitor, 
  FiCode, 
  FiDatabase,
  FiTrendingUp,
  FiSettings,
  FiTarget,
  FiLayers,
  FiActivity,
  FiZap
} from 'react-icons/fi';
import {
  SiPython,
  SiJavascript,
  SiReact,
  SiElectron
} from 'react-icons/si';

interface Question {
  question_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'open_ended' | 'rating_scale';
  options?: string[];
  scale?: { min: number; max: number; labels: string[] };
}

interface RoadmapWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (roadmap: any) => void;
}

// Subject configuration with icons and descriptions
const subjectConfig = [
  {
    name: 'Computer Science',
    icon: FiCode,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    description: 'Programming, Data Structures, Algorithms, Software Development'
  },
  {
    name: 'Mathematics',
    icon: FiTrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    description: 'Calculus, Linear Algebra, Statistics, Applied Mathematics'
  },
  {
    name: 'Physics',
    icon: FiZap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    description: 'Mechanics, Electromagnetism, Quantum Physics'
  },
  {
    name: 'Electronics',
    icon: FiCpu,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    description: 'Circuits, Digital Systems, Communication'
  },
  {
    name: 'Mechanical',
    icon: FiSettings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-500',
    description: 'Thermodynamics, Fluid Mechanics, Machine Design'
  },
  {
    name: 'Civil',
    icon: FiLayers,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    description: 'Structures, Materials, Transportation'
  },
  {
    name: 'Chemistry',
    icon: FiActivity,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-500',
    description: 'Organic, Inorganic, Physical Chemistry'
  },
  {
    name: 'Electrical',
    icon: FiZap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    description: 'Power Systems, Control Systems, Electrical Machines'
  }
];

const RoadmapWizard: React.FC<RoadmapWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const steps = ['Domain', 'Experience', 'Assessment', 'Generate'];

  const experienceLevels = [
    { id: 'beginner', label: 'Beginner', description: 'Just starting out' },
    { id: 'intermediate', label: 'Intermediate', description: 'Some experience' },
    { id: 'advanced', label: 'Advanced', description: 'Experienced learner' }
  ];

  useEffect(() => {
    if (currentStep === 2 && selectedDomain && experienceLevel && questions.length === 0) {
      fetchQuestions();
    }
  }, [currentStep, selectedDomain, experienceLevel]);

  const fetchQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      const response = await fetch('/api/pipeline/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: selectedDomain, 
          experience_level: experienceLevel 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched questions:', data);
      
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        console.error('Invalid questions format received:', data);
        // Fallback to generate sample domain-specific questions
        setQuestions(generateSampleQuestions(selectedDomain, experienceLevel));
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback to sample questions
      setQuestions(generateSampleQuestions(selectedDomain, experienceLevel));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const generateSampleQuestions = (domain: string, level: string): Question[] => {
    const baseQuestions: Question[] = [];
    
    // Domain-specific questions
    if (domain === 'Computer Science') {
      baseQuestions.push(
        {
          question_id: 'cs-001',
          question_text: 'What programming languages are you familiar with?',
          question_type: 'multiple_choice',
          options: ['Python', 'JavaScript', 'Java', 'C++', 'None yet']
        },
        {
          question_id: 'cs-002',
          question_text: 'Which area interests you most?',
          question_type: 'multiple_choice',
          options: ['Web Development', 'Data Science', 'Mobile Apps', 'AI/ML', 'Cybersecurity']
        },
        {
          question_id: 'cs-003',
          question_text: 'How comfortable are you with debugging code?',
          question_type: 'rating_scale',
          scale: { min: 1, max: 5, labels: ['Not at all', 'Very comfortable'] }
        }
      );
    } else if (domain === 'Mathematics') {
      baseQuestions.push(
        {
          question_id: 'math-001',
          question_text: 'Which math areas do you want to focus on?',
          question_type: 'multiple_choice',
          options: ['Calculus', 'Linear Algebra', 'Statistics', 'Discrete Math', 'Applied Math']
        },
        {
          question_id: 'math-002',
          question_text: 'Do you prefer theoretical proofs or practical applications?',
          question_type: 'multiple_choice',
          options: ['Theoretical proofs', 'Practical applications', 'Both equally']
        }
      );
    } else if (domain === 'Physics') {
      baseQuestions.push(
        {
          question_id: 'phy-001',
          question_text: 'Which physics area interests you most?',
          question_type: 'multiple_choice',
          options: ['Classical Mechanics', 'Electromagnetism', 'Quantum Physics', 'Thermodynamics']
        },
        {
          question_id: 'phy-002',
          question_text: 'How comfortable are you with mathematical equations in physics?',
          question_type: 'rating_scale',
          scale: { min: 1, max: 5, labels: ['Not comfortable', 'Very comfortable'] }
        }
      );
    }
    
    // Add common questions
    baseQuestions.push(
      {
        question_id: 'common-001',
        question_text: 'How many hours per week can you dedicate to studying?',
        question_type: 'multiple_choice',
        options: ['1-3 hours', '4-6 hours', '7-10 hours', 'More than 10 hours']
      },
      {
        question_id: 'common-002',
        question_text: 'What is your preferred learning style?',
        question_type: 'multiple_choice',
        options: ['Videos and tutorials', 'Reading and research', 'Hands-on practice', 'Group discussions']
      }
    );

    return baseQuestions;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    // Reset questions when domain changes
    setQuestions([]);
    setAnswers({});
  };

  const handleExperienceSelect = (level: string) => {
    setExperienceLevel(level);
    // Reset questions when experience level changes
    setQuestions([]);
    setAnswers({});
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
      
      const roadmapData = {
        domain: selectedDomain,
        experience_level: experienceLevel,
        interview_responses: answers
      };

      console.log('Generating roadmap with data:', roadmapData);
      
      const roadmap = await generateRoadmap(roadmapData);
      console.log('Generated roadmap:', roadmap);
      
      onComplete(roadmap);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      alert('Failed to generate roadmap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDomainStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Your Domain</h3>
        <p className="text-sm text-gray-600">Select the subject you want to focus on</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectConfig.map((subject) => {
          const IconComponent = subject.icon;
          const isSelected = selectedDomain === subject.name;
          
          return (
            <button
              key={subject.name}
              onClick={() => handleDomainSelect(subject.name)}
              className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? `${subject.borderColor} ${subject.bgColor} ring-2 ring-offset-2 ring-offset-white ring-blue-500`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${isSelected ? subject.bgColor : 'bg-gray-100'}`}>
                  <IconComponent 
                    className={`w-6 h-6 ${isSelected ? subject.color : 'text-gray-600'}`} 
                  />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium mb-1 ${isSelected ? subject.color : 'text-gray-900'}`}>
                    {subject.name}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {subject.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderExperienceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your Experience Level</h3>
        <p className="text-sm text-gray-600">This helps us customize your learning path</p>
      </div>
      
      <div className="space-y-3">
        {experienceLevels.map((level) => (
          <button
            key={level.id}
            onClick={() => handleExperienceSelect(level.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
              experienceLevel === level.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">{level.label}</div>
            <div className="text-sm text-gray-600">{level.description}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderQuestionInput = (question: Question) => {
    const questionId = question.question_id;
    
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={questionId}
                  value={option}
                  checked={answers[questionId] === option}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'rating_scale':
        const scale = question.scale || { min: 1, max: 5, labels: ['Very Low', 'Low', 'Medium', 'High', 'Very High'] };
        return (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{scale.labels[0]}</span>
              <span>{scale.labels[scale.labels.length - 1]}</span>
            </div>
            <div className="flex space-x-2">
              {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i).map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswerChange(questionId, value)}
                  className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                    answers[questionId] === value
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'open_ended':
      default:
        return (
          <textarea
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your answer here..."
          />
        );
    }
  };

  const renderAssessmentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment Questions</h3>
        <p className="text-sm text-gray-600">Help us understand your current knowledge and goals</p>
      </div>
      
      {isGeneratingQuestions ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Generating personalized questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">No questions available. Please try again.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.question_id} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                {index + 1}. {question.question_text}
              </h4>
              {renderQuestionInput(question)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGenerateStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Your Roadmap</h3>
        <p className="text-sm text-gray-600">
          Based on your selections, we'll create a personalized learning roadmap for {selectedDomain}
        </p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg text-left">
        <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><span className="font-medium">Domain:</span> {selectedDomain}</li>
          <li><span className="font-medium">Experience:</span> {experienceLevel}</li>
          <li><span className="font-medium">Questions answered:</span> {Object.keys(answers).length}</li>
        </ul>
      </div>
      
      <button
        onClick={handleGenerateRoadmap}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Generating Roadmap...
          </div>
        ) : (
          'Generate My Learning Roadmap'
        )}
      </button>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedDomain !== '';
      case 1: return experienceLevel !== '';
      case 2: return questions.length > 0 && Object.keys(answers).length >= Math.floor(questions.length / 2);
      default: return true;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Your Learning Roadmap</h2>
            <div className="flex items-center mt-2">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 0 && renderDomainStep()}
          {currentStep === 1 && renderExperienceStep()}
          {currentStep === 2 && renderAssessmentStep()}
          {currentStep === 3 && renderGenerateStep()}
        </div>

        {/* Footer */}
        {currentStep < 3 && (
          <div className="flex items-center justify-between p-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapWizard;
