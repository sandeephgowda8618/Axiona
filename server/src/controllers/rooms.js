const { Room } = require('../models/Room');
const { RoomMessage } = require('../models/RoomMessage');
const { RoomEvent } = require('../models/RoomEvent');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, type, subject, difficulty } = req.query;

  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;

  const rooms = await Room.find(filter)
    .populate('studentId', 'fullName avatarUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Room.countDocuments(filter);

  res.json({
    success: true,
    data: rooms,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    }
  });
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoom = async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate('studentId', 'fullName avatarUrl')
    .populate('participants.studentId', 'fullName avatarUrl');

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  res.json({
    success: true,
    data: room
  });
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res) => {
  const room = await Room.create({
    ...req.body,
    createdBy: req.user?._id
  });

  await room.populate('createdBy', 'fullName avatarUrl');

  res.status(201).json({
    success: true,
    data: room
  });
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private
const updateRoom = async (req, res) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is the creator or has admin privileges
  if (room.studentId.toString() !== req.user?._id.toString()) {
    throw new AppError('Not authorized to update this room', 403);
  }

  room = await Room.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('createdBy', 'fullName avatarUrl');

  res.json({
    success: true,
    data: room
  });
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private
const deleteRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is the creator or has admin privileges
  if (room.studentId.toString() !== req.user?._id.toString()) {
    throw new AppError('Not authorized to delete this room', 403);
  }

  await Room.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Room deleted successfully'
  });
};

// @desc    Join room
// @route   POST /api/rooms/:id/join
// @access  Private
const joinRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is already a participant
  if (room.participants.includes(req.user?._id)) {
    throw new AppError('You are already a participant in this room', 400);
  }

  // Check room capacity
  if (room.maxParticipants && room.participants.length >= room.maxParticipants) {
    throw new AppError('Room is at full capacity', 400);
  }

  room.participants.push(req.user?._id);
  await room.save();

  // Create room event
  await RoomEvent.create({
    room: room._id,
    user: req.user?._id,
    type: 'user_joined',
    details: {
      userJoined: req.user?._id
    }
  });

  await room.populate('participants', 'fullName avatarUrl');

  res.json({
    success: true,
    data: room
  });
};

// @desc    Leave room
// @route   POST /api/rooms/:id/leave
// @access  Private
const leaveRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is a participant
  if (!room.participants.includes(req.user?._id)) {
    throw new AppError('You are not a participant in this room', 400);
  }

  room.participants = room.participants.filter(
    participant => participant.toString() !== req.user?._id.toString()
  );
  await room.save();

  // Create room event
  await RoomEvent.create({
    room: room._id,
    user: req.user?._id,
    type: 'user_left',
    details: {
      userLeft: req.user?._id
    }
  });

  res.json({
    success: true,
    message: 'Left room successfully'
  });
};

// @desc    Get room messages
// @route   GET /api/rooms/:id/messages
// @access  Private
const getRoomMessages = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is a participant
  if (!room.participants.includes(req.user?._id)) {
    throw new AppError('You must be a participant to view messages', 403);
  }

  const messages = await RoomMessage.find({ room: req.params.id })
    .populate('sender', 'fullName avatarUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await RoomMessage.countDocuments({ room: req.params.id });

  res.json({
    success: true,
    data: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    }
  });
};

// @desc    Send room message
// @route   POST /api/rooms/:id/messages
// @access  Private
const sendRoomMessage = async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is a participant
  if (!room.participants.includes(req.user?._id)) {
    throw new AppError('You must be a participant to send messages', 403);
  }

  const message = await RoomMessage.create({
    room: req.params.id,
    sender: req.user?._id,
    content: req.body.content,
    type: req.body.type || 'text'
  });

  await message.populate('sender', 'fullName avatarUrl');

  res.status(201).json({
    success: true,
    data: message
  });
};

// @desc    Get room events
// @route   GET /api/rooms/:id/events
// @access  Private
const getRoomEvents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Check if user is a participant
  if (!room.participants.includes(req.user?._id)) {
    throw new AppError('You must be a participant to view events', 403);
  }

  const events = await RoomEvent.find({ room: req.params.id })
    .populate('user', 'fullName avatarUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await RoomEvent.countDocuments({ room: req.params.id });

  res.json({
    success: true,
    data: events,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    }
  });
};

module.exports = {
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
};
