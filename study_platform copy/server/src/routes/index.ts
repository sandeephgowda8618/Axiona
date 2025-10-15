import { Router } from 'express';
import roadmapRouter from './roadmap';

const router = Router();
router.use('/roadmap', roadmapRouter);

export default router;
