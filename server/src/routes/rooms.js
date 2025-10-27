const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMessages,
  sendRoomMessage,
  getRoomEvents
} = require('../controllers/rooms');

const router = express.Router();

// Room routes
router.route('/')
  .get(protect, getRooms)
  .post(protect, createRoom);

router.route('/:id')
  .get(protect, getRoom)
  .put(protect, updateRoom)
  .delete(protect, deleteRoom);

// Room interaction routes
router.post('/:id/join', protect, joinRoom);
router.post('/:id/leave', protect, leaveRoom);

// Room messages
router.route('/:id/messages')
  .get(protect, getRoomMessages)
  .post(protect, sendRoomMessage);

// Room events
router.get('/:id/events', protect, getRoomEvents);

module.exports = router;
