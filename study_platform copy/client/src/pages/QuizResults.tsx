import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { QuizResult, QuizAttempt, SecurityEvent } from '../types/quiz'

interface QuizResultsProps {
  results?: any
  answers?: Record<string, any>
  attempt?: QuizAttempt
  securityEvents?: SecurityEvent[]
  analytics?: {
    totalTimeSpent: number
    focusTime: number
    focusPercentage: number
    tabSwitchCount: number
    suspiciousActivityCount: number
    mouseMovements: number
    keystrokes: number
    questionTimeSpent: Record<string, number>
    idleTime: number
  }
}

const QuizResults: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { quizId } = useParams<{ quizId: string }>()
  
  const { results, answers, attempt, securityEvents = [], analytics } = (location.state || {}) as QuizResultsProps

  if (!results || !attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h1>
          <p className="text-gray-600 mb-6">Unable to load quiz results.</p>
          <button
            onClick={() => navigate('/quiz')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Back to Quiz Selection
          </button>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const getSecurityRiskLevel = () => {
    if (!analytics) return 'unknown'
    
    const riskFactors = [
      analytics.tabSwitchCount > 0,
      analytics.suspiciousActivityCount > 2,
      analytics.focusPercentage < 85,
      securityEvents.filter(e => e.severity === 'critical').length > 0,
      analytics.idleTime > 2
    ]

    const riskScore = riskFactors.filter(Boolean).length
    
    if (riskScore === 0) return 'low'
    if (riskScore <= 2) return 'medium'
    return 'high'
  }

  const riskLevel = getSecurityRiskLevel()
  const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="text-center">
            <div className={`text-8xl mb-4 ${results.passed ? '' : ''}`}>
              {results.passed ? '🎉' : '😔'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quiz {results.passed ? 'Completed Successfully!' : 'Not Passed'}
            </h1>
            <p className="text-gray-600 mb-6">
              Here are your detailed results and performance analytics
            </p>
            
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-indigo-600">{results.percentage}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600">{results.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600">{results.obtainedMarks}</div>
                <div className="text-sm text-gray-600">Marks Obtained</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className={`text-3xl font-bold ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {results.passed ? 'PASS' : 'FAIL'}
                </div>
                <div className="text-sm text-gray-600">Result Status</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Performance Breakdown</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Total Questions</span>
                  <span className="text-lg font-bold">{results.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-700">Correct Answers</span>
                  <span className="text-lg font-bold text-green-600">{results.correctAnswers}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-700">Incorrect Answers</span>
                  <span className="text-lg font-bold text-red-600">{results.totalQuestions - results.correctAnswers}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-700">Total Marks</span>
                  <span className="text-lg font-bold text-blue-600">{results.obtainedMarks}/{results.totalMarks}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Score Progress</span>
                  <span>{results.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${results.passed ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(results.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Time Analysis */}
            {analytics && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">⏱️ Time Analysis</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{formatTime(analytics.totalTimeSpent)}</div>
                    <div className="text-sm text-blue-700">Total Time Spent</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{formatTime(analytics.focusTime)}</div>
                    <div className="text-sm text-green-700">Active Focus Time</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analytics.focusPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-purple-700">Focus Percentage</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{analytics.idleTime}</div>
                    <div className="text-sm text-yellow-700">Idle Periods</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Focus Quality</span>
                    <span>{analytics.focusPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        analytics.focusPercentage >= 90 ? 'bg-green-500' :
                        analytics.focusPercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(analytics.focusPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Analysis */}
            {analytics && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Activity Analysis</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{analytics.mouseMovements}</div>
                    <div className="text-xs text-gray-500">Mouse Movements</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{analytics.keystrokes}</div>
                    <div className="text-xs text-gray-500">Keystrokes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{analytics.tabSwitchCount}</div>
                    <div className="text-xs text-gray-500">Tab Switches</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{analytics.suspiciousActivityCount}</div>
                    <div className="text-xs text-gray-500">Security Events</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Security Report */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">🔐 Security Report</h2>
              
              {/* Risk Level */}
              <div className={`p-4 rounded-lg border-2 mb-6 ${riskColors[riskLevel]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Security Risk Level</span>
                  <span className="uppercase font-bold text-sm">
                    {riskLevel === 'low' && '🟢 LOW'}
                    {riskLevel === 'medium' && '🟡 MEDIUM'}
                    {riskLevel === 'high' && '🔴 HIGH'}
                    {riskLevel === 'unknown' && '⚪ UNKNOWN'}
                  </span>
                </div>
              </div>

              {/* Security Events */}
              {securityEvents.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-3">Security Events ({securityEvents.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {securityEvents.slice(-10).map((event, index) => (
                      <div key={index} className={`p-3 rounded text-xs ${
                        event.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                        event.severity === 'high' ? 'bg-orange-50 border border-orange-200' :
                        event.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium capitalize">{event.type.replace('_', ' ')}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="text-gray-600">{event.description}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 text-4xl mb-2">✅</div>
                  <p className="text-green-700 font-medium">No security violations detected</p>
                  <p className="text-green-600 text-sm">Excellent exam conduct!</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {analytics && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">📋 Quick Stats</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-bold">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Time per Question</span>
                    <span className="font-bold">
                      {formatTime(Math.round(analytics.totalTimeSpent / results.totalQuestions))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions Answered</span>
                    <span className="font-bold">{Object.keys(answers || {}).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Score</span>
                    <span className={`font-bold ${
                      riskLevel === 'low' ? 'text-green-600' :
                      riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {riskLevel === 'low' ? 'Excellent' :
                       riskLevel === 'medium' ? 'Good' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">🎯 Next Steps</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/quiz')}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Take Another Quiz
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                  View Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
                >
                  Print Results
                </button>
              </div>
              
              {!results.passed && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">💡 Improvement Tips</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Review the topics you missed</li>
                    <li>• Practice with similar questions</li>
                    <li>• Focus on time management</li>
                    <li>• Consider retaking the quiz</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizResults
