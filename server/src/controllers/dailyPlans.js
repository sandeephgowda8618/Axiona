const { DailyPlan } = require('../models/DailyPlan');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get daily plans for user
// @route   GET /api/daily-plans
// @access  Private
const getDailyPlans = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { userId: req.user._id };

  // Date filter
  if (req.query.date) {
    const date = new Date(req.query.date);
    query.date = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    };
  }

  const plans = await DailyPlan.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await DailyPlan.countDocuments(query);

  res.json({
    success: true,
    data: plans,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};

// @desc    Get daily plan by date
// @route   GET /api/daily-plans/:date
// @access  Private
const getDailyPlan = async (req, res) => {
  const date = new Date(req.params.date);
  const plan = await DailyPlan.findOne({
    userId: req.user._id,
    date: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    }
  });

  if (!plan) {
    throw new AppError('Daily plan not found', 404);
  }

  res.json({
    success: true,
    data: plan
  });
};

// @desc    Create daily plan
// @route   POST /api/daily-plans
// @access  Private
const createDailyPlan = async (req, res) => {
  const plan = await DailyPlan.create({
    ...req.body,
    userId: req.user._id
  });

  res.status(201).json({
    success: true,
    data: plan
  });
};

// @desc    Update daily plan
// @route   PUT /api/daily-plans/:id
// @access  Private
const updateDailyPlan = async (req, res) => {
  let plan = await DailyPlan.findById(req.params.id);

  if (!plan) {
    throw new AppError('Daily plan not found', 404);
  }

  // Check ownership
  if (plan.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this plan', 403);
  }

  plan = await DailyPlan.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: plan
  });
};

// @desc    Delete daily plan
// @route   DELETE /api/daily-plans/:id
// @access  Private
const deleteDailyPlan = async (req, res) => {
  const plan = await DailyPlan.findById(req.params.id);

  if (!plan) {
    throw new AppError('Daily plan not found', 404);
  }

  // Check ownership
  if (plan.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this plan', 403);
  }

  await DailyPlan.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Daily plan deleted successfully'
  });
};

// @desc    Toggle task completion
// @route   PATCH /api/daily-plans/:id/tasks/:taskId
// @access  Private
const toggleTask = async (req, res) => {
  const plan = await DailyPlan.findById(req.params.id);

  if (!plan) {
    throw new AppError('Daily plan not found', 404);
  }

  // Check ownership
  if (plan.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this plan', 403);
  }

  try {
    await plan.toggleTask(req.params.taskId);
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
};

// @desc    Add task to daily plan
// @route   POST /api/daily-plans/:id/tasks
// @access  Private
const addTask = async (req, res) => {
  const plan = await DailyPlan.findById(req.params.id);

  if (!plan) {
    throw new AppError('Daily plan not found', 404);
  }

  // Check ownership
  if (plan.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this plan', 403);
  }

  await plan.addTask(req.body);

  res.json({
    success: true,
    data: plan
  });
};

// @desc    Remove task from daily plan
// @route   DELETE /api/daily-plans/:id/tasks/:taskId
// @access  Private
const removeTask = async (req, res) => {
  const plan = await DailyPlan.findById(req.params.id);

  if (!plan) {
    throw new AppError('Daily plan not found', 404);
  }

  // Check ownership
  if (plan.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this plan', 403);
  }

  try {
    await plan.removeTask(req.params.taskId);
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
};

module.exports = {
  getDailyPlans,
  getDailyPlan,
  createDailyPlan,
  updateDailyPlan,
  deleteDailyPlan,
  toggleTask,
  addTask,
  removeTask
};
