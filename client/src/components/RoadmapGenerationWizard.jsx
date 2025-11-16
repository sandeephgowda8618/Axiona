import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Stepper, { Step } from './Stepper';
import { roadmapAPI } from '../services/roadmapAPI';
import './RoadmapGenerationWizard.css';

const RoadmapGenerationWizard = ({ 
  userId, 
  onRoadmapGenerated, 
  onSkip,
  isVisible = true 
}) => {
  // State for all questionnaire data
  const [formData, setFormData] = useState({
    // Phase 1 - Domain & Interest Discovery
    domain: '',
    current_level: '',
    motivation: '',
    learning_style: '',
    timeline_preference: '',
    
    // Phase 2 - Skill Assessment
    core_strengths: [],
    struggle_areas: [],
    project_experience: '',
    self_learning_confidence: 5,
    problem_solving_style: '',
    
    // Phase 3 - Learning Preferences
    material_preference: '',
    consistency_method: '',
    weekly_days: '',
    task_preference: '',
    practice_preference: '',
    
    // Phase 4 - Challenge Level & Engagement
    challenge_level: '',
    exam_preparation: '',
    quiz_preference: false,
    motivation_factor: '',
    setback_handling: '',
    
    // Phase 5 - Goal & Commitment (Mandatory)
    ultimate_goal: '',
    time_commitment: '',
    expected_outcome: '',
    target_timeline: '',
    include_assessments: false,
    prefer_community: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Domain options
  const domains = [
    { value: 'DSA', label: '🧮 Data Structures & Algorithms', icon: '🧮' },
    { value: 'ML', label: '🤖 Machine Learning', icon: '🤖' },
    { value: 'Web Development', label: '🌐 Web Development', icon: '🌐' },
    { value: 'Cybersecurity', label: '🔐 Cybersecurity', icon: '🔐' },
    { value: 'Mobile Development', label: '📱 Mobile Development', icon: '📱' },
    { value: 'DevOps', label: '⚙️ DevOps & Cloud', icon: '⚙️' },
    { value: 'AI', label: '🧠 Artificial Intelligence', icon: '🧠' },
    { value: 'Database', label: '🗄️ Database Systems', icon: '🗄️' }
  ];

  // Core skills for assessment
  const coreSkills = [
    'Programming Fundamentals',
    'Data Structures',
    'Algorithms',
    'Databases',
    'System Design',
    'Web Technologies',
    'Version Control (Git)',
    'Testing & Debugging',
    'API Development',
    'Problem Solving'
  ];

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validate step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.domain) newErrors.domain = 'Please select a domain';
        if (!formData.current_level) newErrors.current_level = 'Please select your level';
        if (!formData.motivation) newErrors.motivation = 'Please select your motivation';
        break;
        
      case 2:
        if (formData.core_strengths.length === 0) {
          newErrors.core_strengths = 'Please select at least one strength';
        }
        break;
        
      case 3:
        if (!formData.material_preference) newErrors.material_preference = 'Please select material preference';
        if (!formData.weekly_days) newErrors.weekly_days = 'Please select weekly commitment';
        break;
        
      case 4:
        if (!formData.challenge_level) newErrors.challenge_level = 'Please select challenge level';
        break;
        
      case 5:
        if (!formData.ultimate_goal) newErrors.ultimate_goal = 'Please describe your ultimate goal';
        if (!formData.time_commitment) newErrors.time_commitment = 'Please select time commitment';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step change
  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  // Helper function to calculate response completeness
  const calculateResponseCompleteness = () => {
    const requiredFields = [
      'domain', 'current_level', 'motivation', 'ultimate_goal', 'time_commitment'
    ];
    const optionalFields = [
      'learning_style', 'timeline_preference', 'problem_solving_style', 
      'material_preference', 'consistency_method', 'weekly_days', 'task_preference',
      'practice_preference', 'challenge_level', 'motivation_factor', 'setback_handling',
      'expected_outcome', 'target_timeline'
    ];
    
    const requiredScore = requiredFields.reduce((score, field) => {
      return score + (formData[field] ? 20 : 0); // 20% each for required fields
    }, 0);
    
    const optionalScore = optionalFields.reduce((score, field) => {
      return score + (formData[field] ? 1 : 0);
    }, 0);
    
    // Bonus points for arrays and detailed responses
    const bonusScore = (formData.core_strengths?.length || 0) * 2 + 
                     (formData.struggle_areas?.length || 0) * 2 +
                     (formData.project_experience?.length > 10 ? 5 : 0);
    
    return Math.min(100, requiredScore + Math.min(15, optionalScore) + Math.min(10, bonusScore));
  };

  // Generate roadmap using MCP RAG system
  const generateRoadmap = async () => {
    if (!validateStep(5)) return;
    
    setIsLoading(true);
    
    try {
      console.log('🚀 Starting MCP RAG roadmap generation...');
      
      // Comprehensive data mapping for MCP RAG system
      const roadmapWizardData = {
        user_id: userId,
        domain: formData.domain,
        timestamp: new Date().toISOString(),
        
        // Phase 1 - Domain & Interest Discovery  
        phase1: {
          domain: formData.domain,
          current_level: formData.current_level,
          motivation: formData.motivation,
          learning_style: formData.learning_style,
          timeline_preference: formData.timeline_preference || 'flexible'
        },
        
        // Phase 2 - Skill Assessment
        phase2: {
          core_strengths: formData.core_strengths,
          struggle_areas: formData.struggle_areas,
          project_experience: formData.project_experience || 'No experience mentioned',
          self_learning_confidence: formData.self_learning_confidence,
          problem_solving_style: formData.problem_solving_style || 'not_specified'
        },
        
        // Phase 3 - Learning Preferences
        phase3: {
          material_preference: formData.material_preference,
          consistency_method: formData.consistency_method,
          weekly_days: formData.weekly_days,
          task_preference: formData.task_preference,
          practice_preference: formData.practice_preference || 'varied'
        },
        
        // Phase 4 - Challenge Level & Engagement
        phase4: {
          challenge_level: formData.challenge_level,
          exam_preparation: formData.exam_preparation || 'No specific preparation',
          quiz_preference: formData.quiz_preference,
          motivation_factor: formData.motivation_factor,
          setback_handling: formData.setback_handling || 'not_specified'
        },
        
        // Phase 5 - Goal & Commitment
        phase5: {
          ultimate_goal: formData.ultimate_goal,
          time_commitment: formData.time_commitment,
          expected_outcome: formData.expected_outcome,
          target_timeline: formData.target_timeline || 'flexible',
          include_assessments: formData.include_assessments,
          prefer_community: formData.prefer_community || false
        },
        
        // Additional context for RAG optimization
        metadata: {
          wizard_version: '2.0',
          completion_timestamp: new Date().toISOString(),
          total_phases: 5,
          response_completeness: this.calculateResponseCompleteness()
        }
      };

      console.log('📊 Mapped wizard data for MCP RAG:', roadmapWizardData);

      // Check if RAG system is healthy before proceeding
      const isHealthy = await roadmapAPI.checkHealth();
      if (!isHealthy) {
        throw new Error('🔧 MCP RAG system is not available. Please try again later.');
      }

      console.log('✅ MCP RAG system is healthy, generating roadmap...');

      // Generate roadmap using MCP RAG system
      const roadmapResponse = await roadmapAPI.generateRoadmap(roadmapWizardData, userId);
      
      console.log('🎯 Roadmap generated successfully:', roadmapResponse);

      // Create enhanced payload with both wizard data and generated roadmap
      const enhancedPayload = {
        // User identification
        user_id: userId,
        
        // Original wizard data for reference
        wizard_data: roadmapWizardData,
        
        // Generated roadmap from MCP RAG
        generated_roadmap: roadmapResponse,
        
        // Legacy format for backward compatibility (if needed)
        domain: formData.domain,
        current_level: formData.current_level,
        time_commitment: formData.time_commitment,
        learning_goals: [formData.motivation, formData.ultimate_goal],
        preferences: {
          learning_style: formData.learning_style,
          material_preference: formData.material_preference,
          challenge_level: formData.challenge_level,
          quiz_preference: formData.quiz_preference,
          include_assessments: formData.include_assessments,
          core_strengths: formData.core_strengths,
          struggle_areas: formData.struggle_areas,
          self_learning_confidence: formData.self_learning_confidence,
          consistency_method: formData.consistency_method,
          task_preference: formData.task_preference,
          motivation_factor: formData.motivation_factor,
          expected_outcome: formData.expected_outcome
        }
      };

      console.log('📈 Final enhanced payload:', enhancedPayload);
      
      // Update user's roadmap completion status (if backend supports it)
      try {
        await fetch(`/api/users/${userId}/roadmap-complete`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ hasCompletedRoadmap: true })
        });
      } catch (statusError) {
        console.warn('⚠️ Could not update roadmap completion status:', statusError);
        // Continue anyway, this is not critical
      }

      // Call the parent callback with the generated roadmap
      onRoadmapGenerated(enhancedPayload);
      
    } catch (error) {
      console.error('❌ Error generating roadmap:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to generate roadmap. ';
      if (error.message.includes('timeout')) {
        errorMessage += 'The AI is taking longer than expected to generate your roadmap. Please try again.';
      } else if (error.message.includes('not available')) {
        errorMessage += 'The roadmap generation service is temporarily unavailable. Please try again later.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.';
      }
      
      setErrors({ submit: errorMessage });
      
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="roadmap-wizard-overlay">
      <div className="roadmap-wizard-container">
        <div className="wizard-header">
          <h1>🧭 Personalized Learning Roadmap</h1>
          <p>Let's create a roadmap tailored just for you!</p>
        </div>

        <Stepper
          initialStep={1}
          onStepChange={handleStepChange}
          onFinalStepCompleted={generateRoadmap}
          backButtonText="Previous"
          nextButtonText="Continue"
          stepCircleContainerClassName="custom-stepper"
        >
          {/* Phase 1 - Domain & Interest Discovery */}
          <Step>
            <div className="step-content">
              <h2>🎯 Phase 1: Domain & Interest Discovery</h2>
              <p>Let's start by understanding what you want to learn and your current background.</p>
              
              <div className="question-group">
                <label>Which domain are you most interested in learning? *</label>
                <div className="domain-grid">
                  {domains.map(domain => (
                    <motion.div
                      key={domain.value}
                      className={`domain-card ${formData.domain === domain.value ? 'selected' : ''}`}
                      onClick={() => updateFormData('domain', domain.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="domain-icon">{domain.icon}</span>
                      <span className="domain-label">{domain.label}</span>
                    </motion.div>
                  ))}
                </div>
                {errors.domain && <span className="error">{errors.domain}</span>}
              </div>

              <div className="question-group">
                <label>What is your current level in this domain? *</label>
                <div className="radio-group">
                  {[
                    { value: 'beginner', label: '🌱 Complete Beginner', desc: 'No prior experience' },
                    { value: 'some_basics', label: '📚 Some Basics', desc: 'Know fundamental concepts' },
                    { value: 'intermediate', label: '⚡ Intermediate', desc: 'Can work on projects independently' },
                    { value: 'advanced', label: '🚀 Advanced', desc: 'Looking to master specialized areas' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="current_level"
                        value={option.value}
                        checked={formData.current_level === option.value}
                        onChange={(e) => updateFormData('current_level', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.current_level && <span className="error">{errors.current_level}</span>}
              </div>

              <div className="question-group">
                <label>What's driving your interest in this domain? *</label>
                <div className="radio-group">
                  {[
                    { value: 'career_change', label: '💼 Career Change' },
                    { value: 'skill_upgrade', label: '📈 Skill Upgrade' },
                    { value: 'personal_interest', label: '❤️ Personal Interest' },
                    { value: 'academic_requirement', label: '🎓 Academic Requirement' },
                    { value: 'business_need', label: '🏢 Business Need' },
                    { value: 'competitive_exams', label: '🏆 Competitive Exams' }
                  ].map(option => (
                    <label key={option.value} className="radio-option">
                      <input
                        type="radio"
                        name="motivation"
                        value={option.value}
                        checked={formData.motivation === option.value}
                        onChange={(e) => updateFormData('motivation', e.target.value)}
                      />
                      <span className="radio-label">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.motivation && <span className="error">{errors.motivation}</span>}
              </div>

              <div className="question-group">
                <label>How do you usually learn best?</label>
                <div className="radio-group">
                  {[
                    { value: 'visual', label: '👁️ Visual Learning (diagrams, videos)' },
                    { value: 'hands_on', label: '🛠️ Hands-on Practice' },
                    { value: 'theoretical', label: '📖 Reading & Theory' },
                    { value: 'interactive', label: '💬 Interactive & Discussion' },
                    { value: 'balanced', label: '🔄 Balanced Mix' }
                  ].map(option => (
                    <label key={option.value} className="radio-option">
                      <input
                        type="radio"
                        name="learning_style"
                        value={option.value}
                        checked={formData.learning_style === option.value}
                        onChange={(e) => updateFormData('learning_style', e.target.value)}
                      />
                      <span className="radio-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="question-group">
                <label>Any specific timeline or deadline you're working with?</label>
                <input
                  type="text"
                  value={formData.timeline_preference || ''}
                  onChange={(e) => updateFormData('timeline_preference', e.target.value)}
                  placeholder="e.g., 3 months for job interviews, 6 months for career change, no rush..."
                  className="text-input"
                />
              </div>
            </div>
          </Step>

          {/* Phase 2 - Skill Assessment */}
          <Step>
            <div className="step-content">
              <h2>⚙️ Phase 2: Skill Assessment</h2>
              <p>Help us understand your current skills and experience to customize your roadmap perfectly.</p>

              <div className="question-group">
                <label>Which of these core skills are you already comfortable with? *</label>
                <div className="checkbox-grid">
                  {coreSkills.map(skill => (
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
                      <span className="checkbox-label">{skill}</span>
                    </label>
                  ))}
                </div>
                {errors.core_strengths && <span className="error">{errors.core_strengths}</span>}
              </div>

              <div className="question-group">
                <label>Which areas do you struggle with the most?</label>
                <textarea
                  value={formData.struggle_areas.join(', ')}
                  onChange={(e) => updateFormData('struggle_areas', e.target.value.split(', ').filter(Boolean))}
                  placeholder="e.g., Complex algorithms, System design, Database optimization, Time management..."
                  className="textarea-input"
                />
              </div>

              <div className="question-group">
                <label>Describe any relevant projects or practical experience you have</label>
                <textarea
                  value={formData.project_experience}
                  onChange={(e) => updateFormData('project_experience', e.target.value)}
                  placeholder="Briefly describe your project experience, internships, work, or write 'None' if you haven't done any..."
                  className="textarea-input"
                />
              </div>

              <div className="question-group">
                <label>Rate your confidence in self-learning new topics (1-10)</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.self_learning_confidence}
                    onChange={(e) => updateFormData('self_learning_confidence', parseInt(e.target.value))}
                    className="slider-input"
                  />
                  <span className="slider-value">{formData.self_learning_confidence}/10</span>
                </div>
              </div>

              <div className="question-group">
                <label>How would you rate your problem-solving approach?</label>
                <div className="radio-group">
                  {[
                    { value: 'systematic', label: '📋 Systematic & Methodical', desc: 'I break down problems step by step' },
                    { value: 'intuitive', label: '💡 Intuitive & Creative', desc: 'I rely on insights and creative thinking' },
                    { value: 'research_first', label: '🔍 Research-Driven', desc: 'I research extensively before starting' },
                    { value: 'trial_error', label: '🧪 Trial & Error', desc: 'I learn by experimenting and iterating' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="problem_solving_style"
                        value={option.value}
                        checked={formData.problem_solving_style === option.value}
                        onChange={(e) => updateFormData('problem_solving_style', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Step>

          {/* Phase 3 - Learning Preferences */}
          <Step>
            <div className="step-content">
              <h2>📚 Phase 3: Learning Preferences</h2>
              <p>Tell us how you prefer to learn so we can match the right content style and structure.</p>

              <div className="question-group">
                <label>What kind of learning materials do you prefer most? *</label>
                <div className="radio-group">
                  {[
                    { value: 'videos', label: '🎥 Video Tutorials', desc: 'Visual demonstrations and explanations' },
                    { value: 'books', label: '📖 Books & Articles', desc: 'In-depth written content and documentation' },
                    { value: 'tutorials', label: '🛠️ Hands-on Tutorials', desc: 'Step-by-step practical exercises' },
                    { value: 'interactive', label: '💻 Interactive Platforms', desc: 'Coding challenges and interactive lessons' },
                    { value: 'mixed', label: '🔄 Mixed Content', desc: 'Combination of different formats' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="material_preference"
                        value={option.value}
                        checked={formData.material_preference === option.value}
                        onChange={(e) => updateFormData('material_preference', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.material_preference && <span className="error">{errors.material_preference}</span>}
              </div>

              <div className="question-group">
                <label>How do you usually stay consistent in learning?</label>
                <div className="radio-group">
                  {[
                    { value: 'structured_roadmap', label: '🗺️ Structured Roadmap', desc: 'Clear step-by-step progression' },
                    { value: 'flexible_exploration', label: '🔍 Flexible Exploration', desc: 'Freedom to explore different topics' },
                    { value: 'group_study', label: '👥 Group Study', desc: 'Learning with peers and community' },
                    { value: 'mentor_guidance', label: '👨‍🏫 Mentor Guidance', desc: 'Direct mentorship and feedback' },
                    { value: 'self_paced', label: '⏰ Self-Paced Learning', desc: 'Complete control over timing and pace' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="consistency_method"
                        value={option.value}
                        checked={formData.consistency_method === option.value}
                        onChange={(e) => updateFormData('consistency_method', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="question-group">
                <label>How many days per week can you dedicate to learning this domain? *</label>
                <div className="radio-group">
                  {[
                    { value: '1-2', label: '1-2 days', desc: 'Weekend warrior approach' },
                    { value: '3-5', label: '3-5 days', desc: 'Balanced regular learning' },
                    { value: '6-7', label: '6-7 days', desc: 'Intensive daily commitment' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="weekly_days"
                        value={option.value}
                        checked={formData.weekly_days === option.value}
                        onChange={(e) => updateFormData('weekly_days', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.weekly_days && <span className="error">{errors.weekly_days}</span>}
              </div>

              <div className="question-group">
                <label>Do you prefer short daily tasks or longer weekly milestones?</label>
                <div className="radio-group">
                  {[
                    { value: 'daily_tasks', label: '📅 Short Daily Tasks', desc: '15-30 minute focused sessions' },
                    { value: 'weekly_milestones', label: '🎯 Weekly Milestones', desc: 'Longer sessions with weekly goals' },
                    { value: 'flexible_blocks', label: '🔄 Flexible Time Blocks', desc: 'Adapt based on availability' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="task_preference"
                        value={option.value}
                        checked={formData.task_preference === option.value}
                        onChange={(e) => updateFormData('task_preference', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="question-group">
                <label>What type of practice exercises do you find most helpful?</label>
                <div className="radio-group">
                  {[
                    { value: 'guided_exercises', label: '🎯 Guided Exercises' },
                    { value: 'open_projects', label: '🚀 Open-ended Projects' },
                    { value: 'competitive_coding', label: '🏆 Competitive Coding' },
                    { value: 'real_world_scenarios', label: '🌍 Real-world Scenarios' }
                  ].map(option => (
                    <label key={option.value} className="radio-option">
                      <input
                        type="radio"
                        name="practice_preference"
                        value={option.value}
                        checked={formData.practice_preference === option.value}
                        onChange={(e) => updateFormData('practice_preference', e.target.value)}
                      />
                      <span className="radio-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Step>

          {/* Phase 4 - Challenge Level & Engagement */}
          <Step>
            <div className="step-content">
              <h2>💪 Phase 4: Challenge Level & Engagement</h2>
              <p>Let's determine the right difficulty level and engagement style for optimal learning.</p>

              <div className="question-group">
                <label>How challenging should your learning path be? *</label>
                <div className="radio-group">
                  {[
                    { value: 'gentle', label: '🐢 Gentle & Gradual', desc: 'Slow and steady with lots of practice' },
                    { value: 'balanced', label: '⚖️ Balanced & Steady', desc: 'Moderate pace with consistent progress' },
                    { value: 'challenging', label: '🔥 Challenging & Fast', desc: 'Push boundaries with quick advancement' },
                    { value: 'intense', label: '🚀 Intense & Competitive', desc: 'Maximum challenge for rapid growth' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="challenge_level"
                        value={option.value}
                        checked={formData.challenge_level === option.value}
                        onChange={(e) => updateFormData('challenge_level', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.challenge_level && <span className="error">{errors.challenge_level}</span>}
              </div>

              <div className="question-group">
                <label>Are you preparing for a specific exam, interview, or certification?</label>
                <input
                  type="text"
                  value={formData.exam_preparation}
                  onChange={(e) => updateFormData('exam_preparation', e.target.value)}
                  placeholder="e.g., FAANG interviews, AWS certification, University exam, or 'No specific preparation'"
                  className="text-input"
                />
              </div>

              <div className="question-group">
                <label>What keeps you motivated to continue learning when things get difficult?</label>
                <div className="radio-group">
                  {[
                    { value: 'progress_tracking', label: '📊 Seeing Progress & Results', desc: 'Visual progress and achievements' },
                    { value: 'curiosity', label: '🤔 Curiosity & Discovery', desc: 'Learning new and interesting concepts' },
                    { value: 'accountability', label: '⏰ Deadlines & Accountability', desc: 'External pressure and commitments' },
                    { value: 'recognition', label: '🏆 Recognition & Achievement', desc: 'Certificates, badges, and validation' },
                    { value: 'community', label: '👥 Community & Peer Learning', desc: 'Learning with others and sharing' },
                    { value: 'practical_application', label: '🛠️ Practical Application', desc: 'Building real projects and solving problems' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="motivation_factor"
                        value={option.value}
                        checked={formData.motivation_factor === option.value}
                        onChange={(e) => updateFormData('motivation_factor', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="question-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.quiz_preference}
                    onChange={(e) => updateFormData('quiz_preference', e.target.checked)}
                  />
                  <span className="checkbox-label">Do you prefer frequent quizzes and progress tracking?</span>
                </label>
              </div>

              <div className="question-group">
                <label>How do you handle learning setbacks or difficult concepts?</label>
                <div className="radio-group">
                  {[
                    { value: 'persistent', label: '💪 Keep trying until I get it' },
                    { value: 'seek_help', label: '🤝 Seek help from others' },
                    { value: 'break_it_down', label: '🧩 Break it into smaller parts' },
                    { value: 'take_breaks', label: '☕ Take breaks and come back later' },
                    { value: 'find_alternatives', label: '🔄 Find alternative explanations' }
                  ].map(option => (
                    <label key={option.value} className="radio-option">
                      <input
                        type="radio"
                        name="setback_handling"
                        value={option.value}
                        checked={formData.setback_handling === option.value}
                        onChange={(e) => updateFormData('setback_handling', e.target.value)}
                      />
                      <span className="radio-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Step>

          {/* Phase 5 - Goal & Commitment */}
          <Step>
            <div className="step-content">
              <h2>🎯 Phase 5: Goal & Commitment</h2>
              <p>Final step! Tell us your ultimate goals and commitment level to create the perfect roadmap.</p>

              <div className="question-group">
                <label>What is your ultimate learning goal? *</label>
                <textarea
                  value={formData.ultimate_goal}
                  onChange={(e) => updateFormData('ultimate_goal', e.target.value)}
                  placeholder="Be specific about what you want to achieve. e.g., 'Get hired as a software engineer at a tech company', 'Build and deploy my own web application', 'Master machine learning fundamentals for career transition'..."
                  className="textarea-input"
                  required
                />
                {errors.ultimate_goal && <span className="error">{errors.ultimate_goal}</span>}
              </div>

              <div className="question-group">
                <label>How much time can you realistically spend each day on learning? *</label>
                <div className="radio-group">
                  {[
                    { value: '30min-1hour', label: '⏰ 30 minutes - 1 hour', desc: 'Perfect for busy schedules' },
                    { value: '1-2 hours', label: '📚 1-2 hours', desc: 'Good for consistent progress' },
                    { value: '2-4 hours', label: '🎓 2-4 hours', desc: 'Serious commitment level' },
                    { value: '4+ hours', label: '🚀 4+ hours', desc: 'Intensive learning mode' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="time_commitment"
                        value={option.value}
                        checked={formData.time_commitment === option.value}
                        onChange={(e) => updateFormData('time_commitment', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.time_commitment && <span className="error">{errors.time_commitment}</span>}
              </div>

              <div className="question-group">
                <label>What kind of outcome do you expect after completing this roadmap?</label>
                <div className="radio-group">
                  {[
                    { value: 'job_ready', label: '💼 Job-ready Skills', desc: 'Ready to apply for positions' },
                    { value: 'deep_understanding', label: '🧠 Deep Understanding', desc: 'Comprehensive knowledge of the field' },
                    { value: 'portfolio_projects', label: '🚀 Portfolio Projects', desc: 'Impressive projects to showcase' },
                    { value: 'exam_success', label: '🏆 Exam/Certification Success', desc: 'Pass specific tests or certifications' },
                    { value: 'career_transition', label: '🔄 Career Transition', desc: 'Successfully switch career paths' },
                    { value: 'skill_enhancement', label: '📈 Skill Enhancement', desc: 'Improve existing professional skills' }
                  ].map(option => (
                    <label key={option.value} className="radio-option detailed">
                      <input
                        type="radio"
                        name="expected_outcome"
                        value={option.value}
                        checked={formData.expected_outcome === option.value}
                        onChange={(e) => updateFormData('expected_outcome', e.target.value)}
                      />
                      <div className="radio-content">
                        <span className="radio-label">{option.label}</span>
                        <span className="radio-desc">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="question-group">
                <label>What's your ideal timeline for achieving your learning goal?</label>
                <div className="radio-group">
                  {[
                    { value: '1-3 months', label: '⚡ 1-3 months (Intensive)' },
                    { value: '3-6 months', label: '🎯 3-6 months (Focused)' },
                    { value: '6-12 months', label: '📈 6-12 months (Steady)' },
                    { value: '1+ years', label: '🌱 1+ years (Gradual)' },
                    { value: 'no_rush', label: '🧘 No specific rush' }
                  ].map(option => (
                    <label key={option.value} className="radio-option">
                      <input
                        type="radio"
                        name="target_timeline"
                        value={option.value}
                        checked={formData.target_timeline === option.value}
                        onChange={(e) => updateFormData('target_timeline', e.target.value)}
                      />
                      <span className="radio-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="question-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.include_assessments}
                    onChange={(e) => updateFormData('include_assessments', e.target.checked)}
                  />
                  <span className="checkbox-label">Include optional assessments and mini-projects in my roadmap</span>
                </label>
              </div>

              <div className="question-group">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.prefer_community}
                    onChange={(e) => updateFormData('prefer_community', e.target.checked)}
                  />
                  <span className="checkbox-label">I'd like recommendations for communities and networking opportunities</span>
                </label>
              </div>

              {errors.submit && <div className="error submit-error">{errors.submit}</div>}

              <div className="completion-summary">
                <h3>🎉 Ready to Generate Your Personalized Roadmap!</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Domain:</strong> {formData.domain || 'Not selected'}
                  </div>
                  <div className="summary-item">
                    <strong>Level:</strong> {formData.current_level || 'Not selected'}
                  </div>
                  <div className="summary-item">
                    <strong>Time Commitment:</strong> {formData.time_commitment || 'Not selected'}
                  </div>
                  <div className="summary-item">
                    <strong>Challenge Level:</strong> {formData.challenge_level || 'Not selected'}
                  </div>
                  <div className="summary-item">
                    <strong>Learning Style:</strong> {formData.learning_style || 'Not selected'}
                  </div>
                  <div className="summary-item">
                    <strong>Expected Outcome:</strong> {formData.expected_outcome || 'Not selected'}
                  </div>
                </div>
                <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280' }}>
                  Your responses will be analyzed by our AI to create a truly personalized learning roadmap
                </p>
              </div>

              {isLoading && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <h3>🤖 Generating Your AI-Powered Roadmap</h3>
                  <p>Our MCP RAG system is analyzing your responses and searching through our knowledge base...</p>
                  <div className="loading-steps">
                    <div className="loading-step">🔍 Analyzing your learning profile</div>
                    <div className="loading-step">📚 Searching relevant learning resources</div>
                    <div className="loading-step">🧠 Processing with fine-tuned AI model</div>
                    <div className="loading-step">🗺️ Creating your personalized roadmap</div>
                  </div>
                  <small>This process may take up to 30-45 seconds for optimal results</small>
                </div>
              )}
            </div>
          </Step>
        </Stepper>

        <div className="wizard-footer">
          <button
            type="button"
            onClick={onSkip}
            className="skip-button"
            disabled={isLoading}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapGenerationWizard;
