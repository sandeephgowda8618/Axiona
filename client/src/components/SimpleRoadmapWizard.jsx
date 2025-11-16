import React, { useState, useEffect, useRef } from 'react';
import Stepper, { Step } from './Stepper';
import { apiService } from '../services/api';
import './SimpleRoadmapWizard.css';

const SimpleRoadmapWizard = ({ userId, onRoadmapGenerated, onSkip }) => {
  const [formData, setFormData] = useState({
    // Phase 1 - Domain & Interest Discovery
    domain: '',
    current_level: '',
    motivation: '',
    learning_approach: '',
    
    // Phase 2 - Skill Assessment
    core_strengths: [],
    struggle_areas: '',
    project_experience: '',
    project_description: '',
    self_learning_confidence: 5,
    
    // Phase 3 - Learning Preferences
    consistency_method: '',
    weekly_days: '',
    task_preference: '',
    
    // Phase 4 - Challenge Level & Engagement
    challenge_level: '',
    exam_preparation: '',
    exam_details: '',
    quiz_preference: false,
    motivation_factor: '',
    
    // Phase 5 - Goal & Commitment (Mandatory)
    ultimate_goal: '',
    daily_time_commitment: '',
    expected_outcome: '',
    include_assessments: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [completedPhases, setCompletedPhases] = useState([]);
  const [showAutoProgressMessage, setShowAutoProgressMessage] = useState(false);
  
  // Pipeline questions state
  const [pipelineQuestions, setPipelineQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);
  
  const autoProgressTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isProgressingRef = useRef(false);

  // Load pipeline questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        setQuestionsError(null);
        console.log('🔄 Loading questions from pipeline...');
        
        const questions = await apiService.getInterviewQuestions();
        console.log('✅ Pipeline questions loaded:', questions);
        
        setPipelineQuestions(questions);
        
        // Update form data with first question if available
        if (questions.length > 0) {
          const firstQuestion = questions[0];
          if (firstQuestion.options && firstQuestion.options.length > 0) {
            // Set default domain from first question options
            setFormData(prev => ({
              ...prev,
              domain: prev.domain || firstQuestion.options[0]
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error loading pipeline questions:', error);
        setQuestionsError('Failed to load questions');
        // Use default questions/form if pipeline fails
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user updates field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Disabled auto-progression - using manual buttons instead
    // Update last activity timestamp
    lastActivityRef.current = Date.now();
  };

  // Check if current phase is complete and auto-progress
  const checkAutoProgression = () => {
    // Prevent multiple simultaneous progressions
    if (isProgressingRef.current) {
      return;
    }
    
    // Check if user was recently active (within last 2 seconds)
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity < 2000) {
      // User was recently active, wait a bit more
      autoProgressTimerRef.current = setTimeout(() => {
        checkAutoProgression();
      }, 1000);
      return;
    }
    
    // Double-check phase completion to ensure reliability
    if (isPhaseComplete(currentStep) && currentStep < 5 && !completedPhases.includes(currentStep)) {
      isProgressingRef.current = true;
      
      // Show auto-progress message
      setShowAutoProgressMessage(true);
      
      // Mark current phase as completed
      setCompletedPhases(prev => {
        const newCompleted = [...new Set([...prev, currentStep])];
        return newCompleted;
      });
      
      // Auto-progress to next phase after showing message
      setTimeout(() => {
        // Double-check again before actually progressing
        if (isPhaseComplete(currentStep) && currentStep < 5) {
          setCurrentStep(prev => {
            const newStep = prev + 1;
            console.log(`Auto-progressing from phase ${prev} to phase ${newStep}`);
            return newStep;
          });
          setShowAutoProgressMessage(false);
        }
        isProgressingRef.current = false;
      }, 1500); // Show message for 1.5 seconds before progressing
    }
  };

  // Check if a specific phase has all required fields completed
  const isPhaseComplete = (phase) => {
    try {
      switch (phase) {
        case 1:
          return !!(
            formData.domain && 
            formData.current_level && 
            formData.motivation && 
            formData.learning_approach
          );
        case 2:
          return !!(
            formData.core_strengths && 
            formData.core_strengths.length > 0 && 
            formData.project_experience
          );
        case 3:
          return !!(
            formData.consistency_method && 
            formData.weekly_days && 
            formData.task_preference
          );
        case 4:
          return !!(
            formData.challenge_level && 
            formData.motivation_factor
          );
        case 5:
          return !!(
            formData.ultimate_goal && 
            formData.ultimate_goal.trim().length > 0 && 
            formData.daily_time_commitment
          );
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking phase completion:', error);
      return false;
    }
  };

  // Enhanced validation that also checks sequential completion
  const validatePhase = (phase) => {
    const newErrors = {};
    
    switch (phase) {
      case 1:
        if (!formData.domain) newErrors.domain = 'Please select a domain';
        if (!formData.current_level) newErrors.current_level = 'Please select your level';
        if (!formData.motivation) newErrors.motivation = 'Please select your motivation';
        if (!formData.learning_approach) newErrors.learning_approach = 'Please select learning approach';
        break;
        
      case 2:
        if (formData.core_strengths.length === 0) newErrors.core_strengths = 'Please select at least one skill';
        if (!formData.project_experience) newErrors.project_experience = 'Please answer about project experience';
        break;
        
      case 3:
        if (!formData.consistency_method) newErrors.consistency_method = 'Please select consistency method';
        if (!formData.weekly_days) newErrors.weekly_days = 'Please select weekly commitment';
        if (!formData.task_preference) newErrors.task_preference = 'Please select task preference';
        break;
        
      case 4:
        if (!formData.challenge_level) newErrors.challenge_level = 'Please select challenge level';
        if (!formData.motivation_factor) newErrors.motivation_factor = 'Please select motivation factor';
        break;
        
      case 5:
        if (!formData.ultimate_goal.trim()) newErrors.ultimate_goal = 'Please describe your ultimate goal';
        if (!formData.daily_time_commitment) newErrors.daily_time_commitment = 'Please select time commitment';
        break;
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      console.log('Validation failed for phase', phase, 'Errors:', newErrors);
    }
    
    return isValid;
  };

  // Custom step change handler for the Stepper
  const handleStepChange = (newStep) => {
    // Clear any pending auto-progression when user manually navigates
    if (autoProgressTimerRef.current) {
      clearTimeout(autoProgressTimerRef.current);
    }
    isProgressingRef.current = false;
    
    // Allow going back to any completed phase or current phase
    if (newStep <= currentStep || completedPhases.includes(newStep - 1)) {
      setCurrentStep(newStep);
      return true;
    }
    
    // For forward movement, validate all previous phases
    for (let i = 1; i < newStep; i++) {
      if (!isPhaseComplete(i)) {
        console.log(`Cannot proceed to phase ${newStep}: phase ${i} is incomplete`);
        return false; // Block navigation if previous phases aren't complete
      }
    }
    
    setCurrentStep(newStep);
    return true;
  };

  // Custom navigation handlers for arrow buttons
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    console.log('handleNext called, currentStep:', currentStep);
    console.log('formData:', formData);
    
    if (currentStep < 5) {
      // Validate current phase before proceeding
      const isValid = validatePhase(currentStep);
      console.log('Validation result for phase', currentStep, ':', isValid);
      
      if (isValid) {
        console.log('Moving to next step:', currentStep + 1);
        setCurrentStep(currentStep + 1);
      } else {
        console.log('Validation failed, staying on current step');
      }
    } else {
      // Last step - complete the wizard
      handleComplete();
    }
  };

  // Cleanup timer on unmount and add debugging
  useEffect(() => {
    return () => {
      if (autoProgressTimerRef.current) {
        clearTimeout(autoProgressTimerRef.current);
      }
    };
  }, []);

  // Add effect to track phase completion status for debugging
  useEffect(() => {
    console.log(`Current step: ${currentStep}, Phase complete: ${isPhaseComplete(currentStep)}, Completed phases:`, completedPhases);
  }, [currentStep, formData, completedPhases]);

  const handleComplete = async () => {
    if (!validatePhase(5)) return;
    
    setIsLoading(true);
    
    try {
      console.log('Starting roadmap generation with MCP RAG system...');
      
      // Map wizard data to MCP RAG API format
      const roadmapWizardData = {
        phase1: {
          goal: formData.domain,
          motivation: formData.motivation,
          learningApproach: formData.learning_approach
        },
        phase2: {
          currentLevel: formData.current_level,
          coreStrengths: formData.core_strengths.join(', '),
          projectExperience: formData.project_experience,
          projectDescription: formData.project_description || '',
          selfLearningConfidence: formData.self_learning_confidence.toString()
        },
        phase3: {
          timeCommitment: formData.daily_time_commitment,
          weeklyDays: formData.weekly_days,
          consistencyMethod: formData.consistency_method,
          taskPreference: formData.task_preference
        },
        phase4: {
          challengeLevel: formData.challenge_level,
          examPreparation: formData.exam_preparation || '',
          examDetails: formData.exam_details || '',
          quizPreference: formData.quiz_preference.toString(),
          motivationFactor: formData.motivation_factor
        },
        phase5: {
          ultimateGoal: formData.ultimate_goal,
          expectedOutcome: formData.expected_outcome,
          includeAssessments: formData.include_assessments.toString()
        }
      };

      console.log('Mapped wizard data for pipeline:', roadmapWizardData);

      // Check if pipeline system is healthy before proceeding
      const isHealthy = await apiService.checkPipelineHealth();
      if (!isHealthy) {
        throw new Error('Pipeline system is not available. Please try again later.');
      }

      // Convert wizard data to simple user answers format for pipeline
      const userAnswers = [
        { questionId: 1, answer: formData.domain },
        { questionId: 2, answer: formData.current_level },
        { questionId: 3, answer: formData.daily_time_commitment },
        { questionId: 4, answer: formData.learning_approach },
        { questionId: 5, answer: formData.motivation },
        { questionId: 6, answer: formData.core_strengths }
      ];

      // Generate roadmap using pipeline system
      const roadmapResponse = await apiService.generateRoadmap(userId, userAnswers);
      
      console.log('Roadmap generated successfully:', roadmapResponse);

      // Create enhanced payload with both wizard data and generated roadmap
      const enhancedPayload = {
        // Original wizard data
        user_id: userId,
        wizard_data: roadmapWizardData,
        
        // Generated roadmap from pipeline
        generated_roadmap: roadmapResponse,
        
        // Legacy format for backward compatibility
        domain: formData.domain,
        current_level: formData.current_level,
        time_commitment: formData.daily_time_commitment,
        learning_goals: [formData.motivation, formData.ultimate_goal],
        preferences: {
          learning_style: formData.learning_approach,
          challenge_level: formData.challenge_level,
          core_strengths: formData.core_strengths,
          struggle_areas: formData.struggle_areas,
          self_learning_confidence: formData.self_learning_confidence,
          consistency_method: formData.consistency_method,
          task_preference: formData.task_preference,
          motivation_factor: formData.motivation_factor,
          expected_outcome: formData.expected_outcome,
          include_assessments: formData.include_assessments
        }
      };

      console.log('Final enhanced payload:', enhancedPayload);
      onRoadmapGenerated(enhancedPayload);
      
    } catch (error) {
      console.error('Error generating roadmap:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to generate roadmap. ';
      if (error.message.includes('timeout')) {
        errorMessage += 'The generation is taking longer than expected. Please try again.';
      } else if (error.message.includes('not available')) {
        errorMessage += 'The roadmap service is temporarily unavailable.';
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      
      // You can add error state here if needed
      alert(errorMessage); // Temporary error handling - replace with proper UI
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="roadmap-modal-overlay">
      <div className="roadmap-container">
        <div className="roadmap-header">
          <h1>🧭 Create Your Learning Roadmap</h1>
          <p>Answer a few quick questions to get a personalized learning path</p>
        </div>

        {/* Loading Overlay for MCP RAG Generation */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <h3>🤖 Generating Your Personalized Roadmap</h3>
              <p>Our AI system is analyzing your preferences and searching through our knowledge base to create the perfect learning path for you...</p>
              <div className="loading-steps">
                <div className="loading-step">🔍 Searching relevant learning resources</div>
                <div className="loading-step">🧠 Processing with fine-tuned AI model</div>
                <div className="loading-step">🗺️ Creating your personalized roadmap</div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-progression feedback */}
        {showAutoProgressMessage && (
          <div className="auto-progress-message">
            ✅ Phase completed! Moving to next phase...
          </div>
        )}

        <Stepper
          initialStep={1}
          onFinalStepCompleted={handleComplete}
          backButtonText="Previous"
          nextButtonText="Next"
          validateStep={validatePhase}
          onStepChange={handleStepChange}
          currentStep={currentStep}
          hideDefaultButtons={true}
        >
          {/* Phase 1 - Domain & Interest Discovery */}
          <Step>
            <div className="step-content">
              <h2>🧩 Domain & Interest Discovery</h2>
              <p>Let's identify what you want to learn and your experience level</p>
              
              <div className="question">
                <label>Which area would you like to focus on right now?</label>
                <div className="option-grid">
                  {['DSA', 'Machine Learning', 'Web Development', 'Cybersecurity', 'Mobile Development', 'DevOps'].map(domain => (
                    <button
                      key={domain}
                      className={`option-btn ${formData.domain === domain ? 'selected' : ''}`}
                      onClick={() => updateFormData('domain', domain)}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
                {errors.domain && <div className="error-message">{errors.domain}</div>}
              </div>

              <div className="question">
                <label>Have you already studied or practiced this area before?</label>
                <div className="radio-group">
                  {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <label key={level} className="radio-option">
                      <input
                        type="radio"
                        name="current_level"
                        value={level.toLowerCase()}
                        checked={formData.current_level === level.toLowerCase()}
                        onChange={(e) => updateFormData('current_level', e.target.value)}
                      />
                      {level}
                    </label>
                  ))}
                </div>
                {errors.current_level && <div className="error-message">{errors.current_level}</div>}
              </div>

              <div className="question">
                <label>What motivates you to learn this domain?</label>
                <select 
                  value={formData.motivation} 
                  onChange={(e) => updateFormData('motivation', e.target.value)}
                  className="select-input"
                >
                  <option value="">Select motivation</option>
                  <option value="career_growth">Career Growth</option>
                  <option value="academic_interest">Academic Interest</option>
                  <option value="competitive_exams">Competitive Exams</option>
                  <option value="projects">Personal Projects</option>
                </select>
                {errors.motivation && <div className="error-message">{errors.motivation}</div>}
              </div>

              <div className="question">
                <label>Do you prefer practical hands-on learning or theoretical depth?</label>
                <div className="radio-group">
                  {[
                    { value: 'practical', label: 'Practical Hands-on' },
                    { value: 'theoretical', label: 'Theoretical Depth' },
                    { value: 'balanced', label: 'Balanced Mix' }
                  ].map(option => (
                    <label key={option.value} className="radio-option">
                      <input
                        type="radio"
                        name="learning_approach"
                        value={option.value}
                        checked={formData.learning_approach === option.value}
                        onChange={(e) => updateFormData('learning_approach', e.target.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {errors.learning_approach && <div className="error-message">{errors.learning_approach}</div>}
              </div>
            </div>
          </Step>

          {/* Phase 2 - Skill Assessment */}
          <Step>
            <div className="step-content">
              <h2>⚙️ Skill Assessment</h2>
              <p>Help us understand your current knowledge level</p>

              <div className="question">
                <label>Which of these core skills are you already comfortable with?</label>
                <div className="checkbox-grid">
                  {[
                    'Programming Fundamentals', 'Data Structures', 'Algorithms', 
                    'Databases', 'System Design', 'Web Technologies'
                  ].map(skill => (
                    <label key={skill} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={formData.core_strengths.includes(skill)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData('core_strengths', [...formData.core_strengths, skill]);
                          } else {
                            updateFormData('core_strengths', formData.core_strengths.filter(s => s !== skill));
                          }
                        }}
                      />
                      {skill}
                    </label>
                  ))}
                </div>
              </div>

              <div className="question">
                <label>Which areas do you struggle with the most?</label>
                <textarea
                  value={formData.struggle_areas}
                  onChange={(e) => updateFormData('struggle_areas', e.target.value)}
                  placeholder="e.g., Complex algorithms, System design..."
                  className="textarea-input"
                />
              </div>

              <div className="question">
                <label>Have you done any projects or solved problems related to this domain?</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="project_experience"
                      value="yes"
                      checked={formData.project_experience === 'yes'}
                      onChange={(e) => updateFormData('project_experience', e.target.value)}
                    />
                    Yes
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="project_experience"
                      value="no"
                      checked={formData.project_experience === 'no'}
                      onChange={(e) => updateFormData('project_experience', e.target.value)}
                    />
                    No
                  </label>
                </div>
                {formData.project_experience === 'yes' && (
                  <textarea
                    value={formData.project_description}
                    onChange={(e) => updateFormData('project_description', e.target.value)}
                    placeholder="Brief description of your projects..."
                    className="textarea-input mt-2"
                  />
                )}
              </div>

              <div className="question">
                <label>Rate your confidence in self-learning new topics (1-10)</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.self_learning_confidence}
                    onChange={(e) => updateFormData('self_learning_confidence', parseInt(e.target.value))}
                    className="slider"
                  />
                  <div className="slider-value">{formData.self_learning_confidence}/10</div>
                </div>
              </div>
            </div>
          </Step>

          {/* Phase 3 - Learning Preferences */}
          <Step>
            <div className="step-content">
              <h2>📚 Learning Preferences</h2>
              <p>Tell us how you prefer to learn</p>

              <div className={`question required ${errors.consistency_method ? 'has-error' : ''}`}>
                <label>How do you usually stay consistent in learning?</label>
                <select 
                  value={formData.consistency_method} 
                  onChange={(e) => updateFormData('consistency_method', e.target.value)}
                  className="select-input"
                >
                  <option value="">Select method</option>
                  <option value="structured_roadmap">Structured Roadmap</option>
                  <option value="random_exploration">Random Exploration</option>
                  <option value="group_study">Group Study</option>
                  <option value="mentor_guidance">Mentor Guidance</option>
                </select>
                {errors.consistency_method && <div className="error-message">{errors.consistency_method}</div>}
              </div>

              <div className={`question required ${errors.weekly_days ? 'has-error' : ''}`}>
                <label>How many days per week can you dedicate to learning this domain?</label>
                <div className="radio-group">
                  {['1-2', '3-5', '6-7'].map(days => (
                    <label key={days} className="radio-option">
                      <input
                        type="radio"
                        name="weekly_days"
                        value={days}
                        checked={formData.weekly_days === days}
                        onChange={(e) => updateFormData('weekly_days', e.target.value)}
                      />
                      {days} days
                    </label>
                  ))}
                </div>
                {errors.weekly_days && <div className="error-message">{errors.weekly_days}</div>}
              </div>

              <div className={`question required ${errors.task_preference ? 'has-error' : ''}`}>
                <label>Do you prefer short daily tasks or longer weekly milestones?</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="task_preference"
                      value="daily_tasks"
                      checked={formData.task_preference === 'daily_tasks'}
                      onChange={(e) => updateFormData('task_preference', e.target.value)}
                    />
                    Short Daily Tasks
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="task_preference"
                      value="weekly_milestones"
                      checked={formData.task_preference === 'weekly_milestones'}
                      onChange={(e) => updateFormData('task_preference', e.target.value)}
                    />
                    Longer Weekly Milestones
                  </label>
                </div>
                {errors.task_preference && <div className="error-message">{errors.task_preference}</div>}
              </div>
            </div>
          </Step>

          {/* Phase 4 - Challenge Level & Engagement */}
          <Step>
            <div className="step-content">
              <h2>💪 Challenge Level & Engagement</h2>
              <p>Let's set the right difficulty and engagement level</p>

              <div className={`question required ${errors.challenge_level ? 'has-error' : ''}`}>
                <label>How challenging should your learning path be?</label>
                <div className="option-grid">
                  {['Balanced', 'Challenging', 'Intense & Competitive'].map(level => (
                    <button
                      key={level}
                      className={`option-btn ${formData.challenge_level === level ? 'selected' : ''}`}
                      onClick={() => updateFormData('challenge_level', level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {errors.challenge_level && <div className="error-message">{errors.challenge_level}</div>}
              </div>

              <div className="question">
                <label>Are you preparing for a specific exam or interview?</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="exam_preparation"
                      value="yes"
                      checked={formData.exam_preparation === 'yes'}
                      onChange={(e) => updateFormData('exam_preparation', e.target.value)}
                    />
                    Yes
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="exam_preparation"
                      value="no"
                      checked={formData.exam_preparation === 'no'}
                      onChange={(e) => updateFormData('exam_preparation', e.target.value)}
                    />
                    No
                  </label>
                </div>
                {formData.exam_preparation === 'yes' && (
                  <input
                    type="text"
                    value={formData.exam_details}
                    onChange={(e) => updateFormData('exam_details', e.target.value)}
                    placeholder="e.g., FAANG interviews, Competitive programming..."
                    className="text-input mt-2"
                  />
                )}
              </div>

              <div className="question">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.quiz_preference}
                    onChange={(e) => updateFormData('quiz_preference', e.target.checked)}
                  />
                  Do you prefer frequent quizzes and progress tracking?
                </label>
              </div>

              <div className={`question required ${errors.motivation_factor ? 'has-error' : ''}`}>
                <label>What keeps you motivated to continue learning?</label>
                <select 
                  value={formData.motivation_factor} 
                  onChange={(e) => updateFormData('motivation_factor', e.target.value)}
                  className="select-input"
                >
                  <option value="">Select motivation factor</option>
                  <option value="results">Results & Progress</option>
                  <option value="curiosity">Curiosity & Discovery</option>
                  <option value="accountability">Accountability & Deadlines</option>
                  <option value="recognition">Recognition & Achievement</option>
                </select>
                {errors.motivation_factor && <div className="error-message">{errors.motivation_factor}</div>}
              </div>
            </div>
          </Step>

          {/* Phase 5 - Goal & Commitment (Mandatory) */}
          <Step>
            <div className="step-content">
              <h2>🎯 Goal & Commitment</h2>
              <p>Final step! Tell us your ultimate goals and time commitment</p>

              <div className={`question required ${errors.ultimate_goal ? 'has-error' : ''}`}>
                <label>What is your ultimate learning goal?</label>
                <textarea
                  value={formData.ultimate_goal}
                  onChange={(e) => updateFormData('ultimate_goal', e.target.value)}
                  placeholder="e.g., Crack FAANG interviews, Build full-stack projects, Master AI fundamentals..."
                  className="textarea-input"
                />
                {errors.ultimate_goal && <div className="error-message">{errors.ultimate_goal}</div>}
              </div>

              <div className={`question required ${errors.daily_time_commitment ? 'has-error' : ''}`}>
                <label>How much time can you realistically spend each day on learning?</label>
                <div className="radio-group">
                  {['1-2 hours', '3-5 hours', '5+ hours'].map(time => (
                    <label key={time} className="radio-option">
                      <input
                        type="radio"
                        name="daily_time_commitment"
                        value={time}
                        checked={formData.daily_time_commitment === time}
                        onChange={(e) => updateFormData('daily_time_commitment', e.target.value)}
                      />
                      {time}
                    </label>
                  ))}
                </div>
                {errors.daily_time_commitment && <div className="error-message">{errors.daily_time_commitment}</div>}
              </div>

              <div className="question">
                <label>What kind of outcome do you expect after completing this roadmap?</label>
                <select 
                  value={formData.expected_outcome} 
                  onChange={(e) => updateFormData('expected_outcome', e.target.value)}
                  className="select-input"
                >
                  <option value="">Select expected outcome</option>
                  <option value="job_ready">Job-ready Skills</option>
                  <option value="deep_understanding">Deep Understanding</option>
                  <option value="portfolio_projects">Portfolio Projects</option>
                  <option value="exam_success">Exam Success</option>
                </select>
              </div>

              <div className="question">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.include_assessments}
                    onChange={(e) => updateFormData('include_assessments', e.target.checked)}
                  />
                  Would you like to include optional assessments and mini-projects in your roadmap?
                </label>
              </div>

              {isLoading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>🤖 Analyzing your profile with AI...</p>
                  <p>🔍 Finding relevant learning resources...</p>
                  <p>🛠️ Generating your personalized roadmap...</p>
                  <small>This may take up to 30 seconds</small>
                </div>
              )}

              <div className="summary">
                <h3>🎉 Ready to create your roadmap!</h3>
                <div className="summary-items">
                  <div><strong>Domain:</strong> {formData.domain || 'Not selected'}</div>
                  <div><strong>Level:</strong> {formData.current_level || 'Not selected'}</div>
                  <div><strong>Time:</strong> {formData.daily_time_commitment || 'Not selected'}</div>
                </div>
              </div>

              {showAutoProgressMessage && (
                <div className="auto-progress-message">
                  <p>Auto-progressing to the next section...</p>
                </div>
              )}
            </div>
          </Step>
        </Stepper>

        <div className="roadmap-footer">
          <div className="navigation-buttons">
            <button 
              onClick={handlePrevious} 
              className={`nav-btn prev-btn ${currentStep === 1 ? 'disabled' : ''}`}
              disabled={currentStep === 1}
            >
              <span className="arrow">←</span>
              <span>Previous</span>
            </button>
            
            <button onClick={onSkip} className="skip-btn" disabled={isLoading}>
              Skip for now
            </button>
            
            <button 
              onClick={handleNext} 
              className="nav-btn next-btn"
              disabled={isLoading}
            >
              <span>{currentStep === 5 ? 'Complete' : 'Next'}</span>
              <span className="arrow">{currentStep === 5 ? '✓' : '→'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleRoadmapWizard;
