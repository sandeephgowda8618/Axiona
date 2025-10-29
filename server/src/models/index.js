// Core entities
const { User } = require('./User');
const { Video } = require('./Video');
const { PDF } = require('./PDF');
const { Comment } = require('./Comment');
const { Highlight } = require('./Highlight');

// Supporting/Event collections
const { WatchHistory } = require('./WatchHistory');
const { SavedVideo } = require('./SavedVideo');
const { LikedVideo } = require('./LikedVideo');
const { Streak } = require('./Streak');

// Study-related models
const { Room } = require('./Room');
const { RoomMessage } = require('./RoomMessage');
const { RoomEvent } = require('./RoomEvent');
const { Quiz } = require('./Quiz');
const { DailyPlan } = require('./DailyPlan');
const { Roadmap } = require('./Roadmap');
const { Topic } = require('./Topic');
const { StudySession } = require('./StudySession');
const { WorkspaceSession } = require('./WorkspaceSession');
const { AiThread } = require('./AiThread');
const { TopTutorial } = require('./TopTutorial');
const { PerformanceInsight } = require('./PerformanceInsight');
const { Export } = require('./Export');
const { StudyMaterial } = require('./StudyMaterial');

module.exports = {
  User,
  Video,
  PDF,
  Comment,
  Highlight,
  WatchHistory,
  SavedVideo,
  LikedVideo,
  Streak,
  Room,
  RoomMessage,
  RoomEvent,
  Quiz,
  DailyPlan,
  Roadmap,
  Topic,
  StudySession,
  WorkspaceSession,
  AiThread,
  TopTutorial,
  PerformanceInsight,
  Export,
  StudyMaterial,
  Highlight
};
