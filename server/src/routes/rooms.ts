import { Router } from 'express';
import { protect } from '../middleware/auth';
import { 
  createRoom, 
  getRooms, 
  getRoom, 
  updateRoom, 
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMessages,
  sendRoomMessage,
  getRoomEvents
} from '../controllers/rooms';

const router = Router();

// Protect all routes
router.use(protect);

// Public room routes
router.route('/')
  .get(getRooms)
  .post(createRoom);

router.route('/:id')
  .get(getRoom)
  .put(updateRoom)
  .delete(deleteRoom);

// Room membership routes
router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);

// Room messages routes
router.route('/:id/messages')
  .get(getRoomMessages)
  .post(sendRoomMessage);

// Room events routes
router.get('/:id/events', getRoomEvents);

export default router;
