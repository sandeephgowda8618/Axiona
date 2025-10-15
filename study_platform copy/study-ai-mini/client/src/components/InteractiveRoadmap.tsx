import React, { useState } from 'react';
import NodeDetailCard from './NodeDetailCard';

interface RoadmapNode {
  _id: string;
  title: string;
  description: string;
  order: number;
  isLocked: boolean;
  stars: number;
  maxStars: number;
  tutorialCompleted: boolean;
  slidesCompleted: boolean;
  quizzesCompleted: number; // out of 3
}

// Hardcoded Web Development roadmap
const webDevRoadmap: RoadmapNode[] = [
  {
    _id: '1',
    title: 'HTML Fundamentals',
    description: 'Learn the structure and semantics of web pages',
    order: 1,
    isLocked: false,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '2',
    title: 'CSS Styling & Layout',
    description: 'Master styling, flexbox, grid, and responsive design',
    order: 2,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '3',
    title: 'JavaScript Basics',
    description: 'Variables, functions, DOM manipulation, and events',
    order: 3,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '4',
    title: 'JavaScript Advanced',
    description: 'Async/await, ES6+, modules, and error handling',
    order: 4,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '5',
    title: 'React Fundamentals',
    description: 'Components, state, props, and hooks',
    order: 5,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '6',
    title: 'React State Management',
    description: 'Context API, Redux, and advanced patterns',
    order: 6,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '7',
    title: 'Node.js & Express',
    description: 'Server-side JavaScript and REST APIs',
    order: 7,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '8',
    title: 'Database Integration',
    description: 'MongoDB, PostgreSQL, and database design',
    order: 8,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '9',
    title: 'Authentication & Security',
    description: 'JWT, OAuth, HTTPS, and security best practices',
    order: 9,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  },
  {
    _id: '10',
    title: 'Deployment & DevOps',
    description: 'CI/CD, Docker, AWS, and production deployment',
    order: 10,
    isLocked: true,
    stars: 0,
    maxStars: 3,
    tutorialCompleted: false,
    slidesCompleted: false,
    quizzesCompleted: 0
  }
];

const InteractiveRoadmap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[]>(webDevRoadmap);
  const [showToast, setShowToast] = useState<string | null>(null);

  const handleNodeClick = (nodeId: string, isLocked: boolean) => {
    if (!isLocked) {
      setSelectedNode(nodeId);
    }
  };

  // Simulate completing activities (for demo purposes)
  const simulateCompletion = (nodeId: string, type: 'tutorial' | 'slides' | 'quiz') => {
    setRoadmapNodes(prev => prev.map(node => {
      if (node._id === nodeId) {
        const updated = { ...node };
        
        if (type === 'tutorial') {
          updated.tutorialCompleted = true;
          updated.stars = Math.max(updated.stars, 1);
        } else if (type === 'slides') {
          updated.slidesCompleted = true;
          if (updated.tutorialCompleted) {
            updated.stars = Math.max(updated.stars, 2);
          }
        } else if (type === 'quiz') {
          updated.quizzesCompleted = Math.min(updated.quizzesCompleted + 1, 3);
          if (updated.tutorialCompleted && updated.slidesCompleted && updated.quizzesCompleted === 3) {
            updated.stars = 3;
            // Unlock next node
            const nextNodeIndex = webDevRoadmap.findIndex(n => n._id === nodeId) + 1;
            if (nextNodeIndex < webDevRoadmap.length) {
              setShowToast(`${webDevRoadmap[nextNodeIndex].title} unlocked!`);
              setTimeout(() => setShowToast(null), 3000);
            }
          }
        }
        
        return updated;
      }
      return node;
    }));

    // Unlock next node if current is completed
    const currentIndex = roadmapNodes.findIndex(n => n._id === nodeId);
    const currentNode = roadmapNodes[currentIndex];
    
    if (currentNode && currentNode.stars === 3 && currentIndex + 1 < roadmapNodes.length) {
      setRoadmapNodes(prev => prev.map((node, index) => {
        if (index === currentIndex + 1) {
          return { ...node, isLocked: false };
        }
        return node;
      }));
    }
  };

  const renderStars = (stars: number, maxStars: number) => {
    return Array.from({ length: maxStars }, (_, index) => (
      <span
        key={index}
        className={`text-2xl ${index < stars ? 'text-yellow-400' : 'text-gray-300'}`}
        aria-label={`${index < stars ? 'filled' : 'empty'} star`}
      >
        ★
      </span>
    ));
  };

  const getNodeStatusIcon = (node: RoadmapNode) => {
    if (node.isLocked) {
      return <span className="text-2xl text-gray-400">🔒</span>;
    } else if (node.stars === node.maxStars) {
      return <span className="text-2xl">✅</span>;
    } else if (node.stars > 0) {
      return <span className="text-2xl">📚</span>;
    } else {
      return <span className="text-2xl animate-pulse">⭕</span>; // Pulsing current node
    }
  };

  const getCurrentNode = () => {
    return roadmapNodes.find(node => !node.isLocked && node.stars < 3);
  };

  const currentNode = getCurrentNode();

  return (
    <div className="relative">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {showToast}
        </div>
      )}

      {/* Roadmap Path */}
      <div className="space-y-4">
        {roadmapNodes.map((node, index) => (
          <div
            key={node._id}
            className={`
              relative flex items-center justify-between p-6 border-2 rounded-xl transition-all duration-300 cursor-pointer
              ${node.isLocked 
                ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                : node.stars === node.maxStars
                  ? 'bg-green-50 border-green-300 shadow-md'
                  : node.stars > 0
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : currentNode?._id === node._id
                      ? 'bg-yellow-50 border-yellow-300 shadow-lg animate-pulse'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
              }
            `}
            onClick={() => handleNodeClick(node._id, node.isLocked)}
            role="button"
            tabIndex={node.isLocked ? -1 : 0}
            aria-label={`Chapter ${node.order}: ${node.title}, ${node.stars} of ${node.maxStars} stars earned`}
          >
            {/* Progress line to next node */}
            {index < roadmapNodes.length - 1 && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className={`w-1 h-4 ${node.stars === 3 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold border-2
                ${node.isLocked 
                  ? 'bg-gray-200 text-gray-500 border-gray-300' 
                  : node.stars === node.maxStars 
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : node.stars > 0
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : currentNode?._id === node._id
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                }
              `}>
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${node.isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                  {node.title}
                </h3>
                <p className={`text-sm ${node.isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                  {node.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">Progress:</span>
                  <span className={`text-xs px-2 py-1 rounded ${node.tutorialCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    Tutorial {node.tutorialCompleted ? '✓' : '○'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${node.slidesCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    Slides {node.slidesCompleted ? '✓' : '○'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${node.quizzesCompleted === 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    Quizzes ({node.quizzesCompleted}/3)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex" aria-label={`${node.stars} of ${node.maxStars} stars earned`}>
                {renderStars(node.stars, node.maxStars)}
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
                {getNodeStatusIcon(node)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Demo buttons for testing (remove in production) */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Demo Controls (Remove in Production)</h4>
        <div className="flex flex-wrap gap-2">
          {roadmapNodes.slice(0, 3).map(node => (
            <div key={node._id} className="space-x-1">
              <button
                onClick={() => simulateCompletion(node._id, 'tutorial')}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                disabled={node.tutorialCompleted}
              >
                Complete {node.title} Tutorial
              </button>
              <button
                onClick={() => simulateCompletion(node._id, 'slides')}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                disabled={node.slidesCompleted}
              >
                Complete Slides
              </button>
              <button
                onClick={() => simulateCompletion(node._id, 'quiz')}
                className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
                disabled={node.quizzesCompleted >= 3}
              >
                Complete Quiz
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Render NodeDetailCard when a node is selected */}
      {selectedNode && (
        <NodeDetailCard
          nodeId={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default InteractiveRoadmap;