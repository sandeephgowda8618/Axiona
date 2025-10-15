import React, { useState, useEffect } from 'react';
import { X, Play, FileText, Brain, CheckCircle } from 'lucide-react';

interface NodeData {
  _id: string;
  title: string;
  description: string;
  tutorialCompleted: boolean;
  slidesCompleted: boolean;
  quizzesCompleted: number;
  stars: number;
}

interface NodeDetailCardProps {
  nodeId: string;
  onClose: () => void;
}

// Hardcoded node details for Web Development roadmap
const nodeDetails: Record<string, NodeData> = {
  '1': {
    _id: '1',
    title: 'HTML Fundamentals',
    description: 'Learn the structure and semantics of web pages. Master HTML5 elements, forms, semantic markup, and accessibility best practices.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '2': {
    _id: '2',
    title: 'CSS Styling & Layout',
    description: 'Master styling, flexbox, grid, and responsive design. Learn to create beautiful, responsive layouts that work on all devices.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '3': {
    _id: '3',
    title: 'JavaScript Basics',
    description: 'Variables, functions, DOM manipulation, and events. Build interactive web pages with modern JavaScript.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '4': {
    _id: '4',
    title: 'JavaScript Advanced',
    description: 'Async/await, ES6+, modules, and error handling. Master advanced JavaScript concepts for modern web development.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '5': {
    _id: '5',
    title: 'React Fundamentals',
    description: 'Components, state, props, and hooks. Build dynamic user interfaces with React.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '6': {
    _id: '6',
    title: 'React State Management',
    description: 'Context API, Redux, and advanced patterns. Manage complex application state effectively.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '7': {
    _id: '7',
    title: 'Node.js & Express',
    description: 'Server-side JavaScript and REST APIs. Build scalable backend services.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '8': {
    _id: '8',
    title: 'Database Integration',
    description: 'MongoDB, PostgreSQL, and database design. Store and retrieve data efficiently.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '9': {
    _id: '9',
    title: 'Authentication & Security',
    description: 'JWT, OAuth, HTTPS, and security best practices. Secure your web applications.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  },
  '10': {
    _id: '10',
    title: 'Deployment & DevOps',
    description: 'CI/CD, Docker, AWS, and production deployment. Deploy and maintain applications in production.',
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0,
    stars: 0
  }
};

const NodeDetailCard: React.FC<NodeDetailCardProps> = ({ nodeId, onClose }) => {
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading from hardcoded data
    setTimeout(() => {
      const data = nodeDetails[nodeId];
      if (data) {
        setNodeData(data);
      }
      setLoading(false);
    }, 300);
  }, [nodeId]);

  const handleTutorialClick = () => {
    // Future: Navigate to tutorial page with nodeId parameter
    alert(`Opening Tutorial for ${nodeData?.title}\n\nThis will navigate to: /tutorial?nodeId=${nodeId}\n\nFeature coming soon!`);
    onClose();
  };

  const handleSlidesClick = () => {
    // Future: Navigate to slides page with nodeId parameter
    alert(`Opening Slides for ${nodeData?.title}\n\nThis will navigate to: /slides?nodeId=${nodeId}\n\nFeature coming soon!`);
    onClose();
  };

  const handleQuizzesClick = () => {
    // Future: Navigate to quiz page with nodeId parameter
    alert(`Opening Quizzes for ${nodeData?.title}\n\nThis will navigate to: /quiz?nodeId=${nodeId}\n\nFeature coming soon!`);
    onClose();
  };

  if (loading) {
    return (
      <div className="overlay">
        <div className="card">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!nodeData) {
    return (
      <div className="overlay">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-600">Error</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p>Chapter not found. Please try again.</p>
        </div>
      </div>
    );
  }

  const renderStars = () => {
    return Array.from({ length: 3 }, (_, index) => (
      <span
        key={index}
        className={`text-2xl ${index < nodeData.stars ? 'text-yellow-400' : 'text-gray-300'}`}
        aria-label={`${index < nodeData.stars ? 'filled' : 'empty'} star`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{nodeData.title}</h2>
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm text-gray-600">Progress:</span>
              <div className="flex" aria-label={`${nodeData.stars} of 3 stars earned`}>
                {renderStars()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 ml-4"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-8 leading-relaxed">{nodeData.description}</p>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Tutorial Button */}
          <button
            onClick={handleTutorialClick}
            className={`
              w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all
              ${nodeData.tutorialCompleted 
                ? 'bg-green-50 border-green-300 text-green-700' 
                : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
              }
            `}
            aria-label={`Tutorial for ${nodeData.title}, ${nodeData.tutorialCompleted ? 'completed' : 'not completed'}`}
          >
            <div className="flex items-center space-x-3">
              <Play className="w-6 h-6" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">Tutorial</h3>
                <p className="text-sm opacity-80">Interactive video lessons</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {nodeData.tutorialCompleted && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
              <span className="text-2xl">📺</span>
            </div>
          </button>

          {/* Slides Button */}
          <button
            onClick={handleSlidesClick}
            className={`
              w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all
              ${nodeData.slidesCompleted 
                ? 'bg-green-50 border-green-300 text-green-700' 
                : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
              }
            `}
            aria-label={`Slides for ${nodeData.title}, ${nodeData.slidesCompleted ? 'completed' : 'not completed'}`}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">Slides</h3>
                <p className="text-sm opacity-80">Study materials & references</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {nodeData.slidesCompleted && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
              <span className="text-2xl">📊</span>
            </div>
          </button>

          {/* Quizzes Button */}
          <button
            onClick={handleQuizzesClick}
            className={`
              w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all
              ${nodeData.quizzesCompleted === 3 
                ? 'bg-green-50 border-green-300 text-green-700' 
                : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
              }
            `}
            aria-label={`Quizzes for ${nodeData.title}, ${nodeData.quizzesCompleted} of 3 completed`}
          >
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">Quizzes</h3>
                <p className="text-sm opacity-80">Test your knowledge (3 quizzes)</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {nodeData.quizzesCompleted}/3
              </span>
              {nodeData.quizzesCompleted === 3 && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
              <span className="text-2xl">🧠</span>
            </div>
          </button>
        </div>

        {/* Progress Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Completion Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-2xl ${nodeData.tutorialCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                {nodeData.tutorialCompleted ? '✓' : '○'}
              </div>
              <p className="text-xs text-gray-600">Tutorial</p>
            </div>
            <div>
              <div className={`text-2xl ${nodeData.slidesCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                {nodeData.slidesCompleted ? '✓' : '○'}
              </div>
              <p className="text-xs text-gray-600">Slides</p>
            </div>
            <div>
              <div className={`text-2xl ${nodeData.quizzesCompleted === 3 ? 'text-green-500' : 'text-gray-400'}`}>
                {nodeData.quizzesCompleted === 3 ? '✓' : `${nodeData.quizzesCompleted}/3`}
              </div>
              <p className="text-xs text-gray-600">Quizzes</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Complete all sections to earn 3 stars and unlock the next chapter!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailCard;