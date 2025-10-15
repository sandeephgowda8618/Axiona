import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import User from '../models/User';
import Activity from '../models/Activity';

const router = Router();

// Star re-computer
async function recalcStars(userId: string, nodeId: string) {
  const user = await User.findById(userId);
  const prog = user.roadmapProgress.find((p: any) => p.nodeId.toString() === nodeId);
  if (!prog) return;
  const act = await Activity.findOne({ nodeId });
  let stars = 0;
  if (prog.tutorialDone) stars = 1;
  if (prog.slideDone) stars = 2;
  if (prog.quizzesDone.length === act.quizIds.length) stars = 3;
  await User.updateOne(
    { _id: userId, 'roadmapProgress.nodeId': nodeId },
    { $set: { 'roadmapProgress.$.stars': stars } }
  );
  return stars;
}

// Mark tutorial finished
router.post('/nodes/:nodeId/tutorial/done', auth, async (req: Request, res: Response) => {
  await User.updateOne(
    { _id: req.user._id },
    {
      $addToSet: {
        roadmapProgress: {
          nodeId: req.params.nodeId,
          tutorialDone: new Date(),
          slideDone: null,
          quizzesDone: [],
          stars: 0,
        },
      },
    },
    { upsert: true }
  );
  await User.updateOne(
    { _id: req.user._id, 'roadmapProgress.nodeId': req.params.nodeId },
    { $set: { 'roadmapProgress.$.tutorialDone': new Date() } }
  );
  const newStars = await recalcStars(req.user._id, req.params.nodeId);
  res.json({ success: true, stars: newStars });
});

// Mark slides finished
router.post('/nodes/:nodeId/slides/done', auth, async (req: Request, res: Response) => {
  await User.updateOne(
    { _id: req.user._id, 'roadmapProgress.nodeId': req.params.nodeId },
    { $set: { 'roadmapProgress.$.slideDone': new Date() } }
  );
  const newStars = await recalcStars(req.user._id, req.params.nodeId);
  res.json({ success: true, stars: newStars });
});

// Get node activities and user progress
router.get('/nodes/:nodeId/activities', auth, async (req: Request, res: Response) => {
  const act = await Activity.findOne({ nodeId: req.params.nodeId })
    .populate('tutorialId slideId quizIds');
  if (!act) return res.status(404).send('No activity');
  const user = await User.findById(req.user._id);
  const prog = user.roadmapProgress.find((p: any) => p.nodeId.toString() === req.params.nodeId);
  res.json({
    activity: {
      nodeId: act.nodeId,
      nodeTitle: act.nodeId.title,
      tutorialId: act.tutorialId._id,
      slideId: act.slideId._id,
      quizIds: act.quizIds,
    },
    progress: {
      tutorialDone: prog?.tutorialDone || null,
      slideDone: prog?.slideDone || null,
      quizzesDone: prog?.quizzesDone || [],
      stars: prog?.stars || 0,
    },
  });
});

export default router;
