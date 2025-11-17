import React, { useState } from 'react';
import { 
  BookOpenIcon, 
  VideoCameraIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';

interface Phase {
  phase_id: number;
  title: string;
  concepts: string[];
  difficulty: string;
  estimated_duration_hours: number;
  learning_objectives: string[];
  resources: {
    pes_materials: any[];
    reference_books: any[];
    videos: any;
  };
}

interface WeekData {
  week: number;
  phase: string;
  study_hours?: number;
  project_hours?: number;
  hours: number;
  activities: string[];
}

interface ProjectTimeline {
  week: number;
  project_task: string;
  estimated_hours: number;
}

interface Milestone {
  week: number;
  milestone: string;
}

interface RoadmapTimelineProps {
  roadmap: {
    learning_goal: string;
    subject: string;
    phases: Phase[];
    learning_schedule: {
      total_weeks: number;
      hours_per_week: number;
      weekly_plan: WeekData[];
      milestones: Milestone[];
      project_timeline: ProjectTimeline[];
    };
    analytics: {
      total_phases: number;
    };
    user_profile?: {
      skill_level: string;
    };
  };
}

const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ roadmap }) => {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-50 border-green-200';
      case 'intermediate':
        return 'bg-blue-50 border-blue-200';
      case 'advanced':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPhaseFromWeek = (week: number): Phase | undefined => {
    const weekData = roadmap.learning_schedule.weekly_plan.find(w => w.week === week);
    if (!weekData) return undefined;
    
    // Handle both string and number phase values
    let phaseId: number;
    
    if (typeof weekData.phase === 'number') {
      phaseId = weekData.phase;
    } else if (typeof weekData.phase === 'string') {
      // Extract phase number from phase string (e.g., "Phase 1" -> 1)
      const phaseMatch = weekData.phase.match(/Phase (\d+)/);
      if (!phaseMatch) return undefined;
      phaseId = parseInt(phaseMatch[1]);
    } else {
      return undefined;
    }
    
    return roadmap.phases.find(p => p.phase_id === phaseId);
  };

  const getProjectTaskForWeek = (week: number): ProjectTimeline | undefined => {
    return roadmap.learning_schedule.project_timeline?.find(pt => pt.week === week);
  };

  const getMilestoneForWeek = (week: number): Milestone | undefined => {
    return roadmap.learning_schedule.milestones?.find(m => m.week === week);
  };

  const HoverPopup: React.FC<{ week: number }> = ({ week }) => {
    const phase = getPhaseFromWeek(week);
    const projectTask = getProjectTaskForWeek(week);
    const milestone = getMilestoneForWeek(week);
    
    if (!phase) return null;

    return (
      <div className="absolute z-10 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-6 -translate-x-1/2 left-1/2 top-full mt-2">
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-3">
            <h3 className="font-semibold text-lg text-gray-900">{phase.title}</h3>
            <p className="text-sm text-gray-500 capitalize">Difficulty: {phase.difficulty}</p>
          </div>

          {/* PES Materials */}
          {phase.resources.pes_materials && phase.resources.pes_materials.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">📘 PES Materials</h4>
              </div>
              <ul className="space-y-1">
                {phase.resources.pes_materials.slice(0, 3).map((material, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span>{material.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference Books */}
          {phase.resources.reference_books && phase.resources.reference_books.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <BookOpenIcon className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-gray-900">📚 Reference Books</h4>
              </div>
              <ul className="space-y-1">
                {phase.resources.reference_books.slice(0, 2).map((book, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span>{book.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Video Resources */}
          {phase.resources.videos && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <VideoCameraIcon className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-gray-900">🎥 Video Playlists</h4>
              </div>
              <ul className="space-y-1">
                {phase.resources.videos.search_keywords_playlists?.slice(0, 2).map((keyword: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <span>{keyword}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Objectives */}
          {phase.learning_objectives && phase.learning_objectives.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">🎯 Learning Objectives</h4>
              </div>
              <ul className="space-y-1">
                {phase.learning_objectives.slice(0, 3).map((objective, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concepts */}
          {phase.concepts && phase.concepts.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📝 Concepts</h4>
              <div className="flex flex-wrap gap-1">
                {phase.concepts.slice(0, 5).map((concept, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project Tasks */}
          {projectTask && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🗂 Project Tasks</h4>
              <div className="text-sm text-gray-600">
                <p>{projectTask.project_task}</p>
                <p className="text-xs text-gray-500 mt-1">Estimated: {projectTask.estimated_hours}h</p>
              </div>
            </div>
          )}

          {/* Milestones */}
          {milestone && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Milestones</h4>
              <div className="text-sm text-gray-600">
                <p>{milestone.milestone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const WeekCard: React.FC<{ week: WeekData; index: number }> = ({ week, index }) => {
    const isLeft = index % 2 === 0;
    const phase = getPhaseFromWeek(week.week);
    const difficultyColor = getDifficultyColor(phase?.difficulty || 'beginner');
    
    return (
      <div className={`relative ${isLeft ? 'pr-8' : 'pl-8'}`}>
        <div
          className={`relative ${
            isLeft ? 'ml-auto text-right' : 'mr-auto text-left'
          } max-w-sm`}
          onMouseEnter={() => setHoveredWeek(week.week)}
          onMouseLeave={() => setHoveredWeek(null)}
        >
          <div className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${difficultyColor} hover:scale-105`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">
                Week {week.week} – {week.phase}
              </h3>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <span className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>Study: {week.study_hours || week.hours || 5}h</span>
                {week.project_hours !== undefined && (
                  <>
                    <span>·</span>
                    <span>Project: {week.project_hours}h</span>
                  </>
                )}
              </span>
            </div>

            <ul className="space-y-1">
              {week.activities.slice(0, 3).map((activity, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{activity}</span>
                </li>
              ))}
              {week.activities.length > 3 && (
                <li className="text-xs text-gray-500">
                  +{week.activities.length - 3} more activities
                </li>
              )}
            </ul>
          </div>

          {hoveredWeek === week.week && <HoverPopup week={week.week} />}
        </div>

        {/* Timeline dot */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-600 rounded-full z-10"></div>
      </div>
    );
  };

  if (!roadmap || !roadmap.learning_schedule) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No roadmap data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {roadmap.learning_goal}
          </h2>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span>{roadmap.subject}</span>
            <span>·</span>
            <span>{roadmap.learning_schedule.total_weeks} Weeks</span>
            <span>·</span>
            <span>{roadmap.analytics.total_phases} Phases</span>
            <span>·</span>
            <span className="capitalize">{roadmap.user_profile?.skill_level || 'Beginner'}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-blue-200 h-full"></div>

        {/* Week cards */}
        <div className="space-y-8">
          {roadmap.learning_schedule.weekly_plan.map((week, index) => (
            <WeekCard key={week.week} week={week} index={index} />
          ))}
        </div>
      </div>

      {/* Project Summary */}
      {roadmap.learning_schedule.project_timeline && roadmap.learning_schedule.project_timeline.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <PlayCircleIcon className="h-5 w-5 text-blue-600" />
            <span>Project Timeline</span>
          </h3>
          <div className="space-y-3">
            {roadmap.learning_schedule.project_timeline.map((project, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Week {project.week}</p>
                  <p className="text-sm text-gray-600">{project.project_task}</p>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {project.estimated_hours}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapTimeline;
