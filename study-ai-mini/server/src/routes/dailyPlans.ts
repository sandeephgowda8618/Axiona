import { Router } from 'express'
import mongoose from 'mongoose'
import { DailyPlan, StudySession } from '../models'
import { protect } from '../middleware/auth'

const router = Router()

// Get today's daily plan
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dailyPlan = await DailyPlan.findOne({
      userId: req.user!._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })

    if (!dailyPlan) {
      return res.status(404).json({ error: 'No daily plan found for today' })
    }

    return res.json(dailyPlan)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch today\'s daily plan' })
  }
})

// Get daily plan by date
router.get('/date/:date', protect, async (req, res) => {
  try {
    const { date } = req.params
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const dailyPlan = await DailyPlan.findOne({
      userId: req.user!._id,
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    })

    if (!dailyPlan) {
      return res.status(404).json({ error: 'No daily plan found for this date' })
    }

    return res.json(dailyPlan)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch daily plan' })
  }
})

// Create or update daily plan
router.post('/', protect, async (req, res) => {
  try {
    const { date, goalMinutes, tasks } = req.body

    const planDate = new Date(date)
    planDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(planDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Check if plan already exists for this date
    let dailyPlan = await DailyPlan.findOne({
      userId: req.user!._id,
      date: {
        $gte: planDate,
        $lt: nextDay
      }
    })

    if (dailyPlan) {
      // Update existing plan
      dailyPlan.goalMinutes = goalMinutes
      dailyPlan.tasks = tasks.map((task: any, index: number) => ({
        ...task,
        taskId: task.taskId || new mongoose.Types.ObjectId()
      }))
      await dailyPlan.save()
    } else {
      // Create new plan
      dailyPlan = new DailyPlan({
        userId: req.user!._id,
        date: planDate,
        goalMinutes,
        tasks: tasks.map((task: any) => ({
          ...task,
          taskId: task.taskId || new mongoose.Types.ObjectId()
        }))
      })
      await dailyPlan.save()
    }

    return res.status(201).json(dailyPlan)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create/update daily plan' })
  }
})

// Update task completion status
router.put('/:planId/task/:taskId', protect, async (req, res) => {
  try {
    const { planId, taskId } = req.params
    const { done } = req.body

    const dailyPlan = await DailyPlan.findOne({
      _id: planId,
      userId: req.user!._id
    })

    if (!dailyPlan) {
      return res.status(404).json({ error: 'Daily plan not found' })
    }

    const task = dailyPlan.tasks.find(t => t.taskId.toString() === taskId)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    task.done = done
    await dailyPlan.save()

    return res.json(task)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update task status' })
  }
})

// Add task to daily plan
router.post('/:planId/tasks', protect, async (req, res) => {
  try {
    const { planId } = req.params
    const { title, estMinutes, resourceRef, resourceModel } = req.body

    const dailyPlan = await DailyPlan.findOne({
      _id: planId,
      userId: req.user!._id
    })

    if (!dailyPlan) {
      return res.status(404).json({ error: 'Daily plan not found' })
    }

    const newTask = {
      taskId: new mongoose.Types.ObjectId(),
      title,
      estMinutes,
      done: false,
      resourceRef,
      resourceModel
    }

    dailyPlan.tasks.push(newTask)
    await dailyPlan.save()

    return res.status(201).json(newTask)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add task' })
  }
})

// Remove task from daily plan
router.delete('/:planId/task/:taskId', protect, async (req, res) => {
  try {
    const { planId, taskId } = req.params

    const dailyPlan = await DailyPlan.findOne({
      _id: planId,
      userId: req.user!._id
    })

    if (!dailyPlan) {
      return res.status(404).json({ error: 'Daily plan not found' })
    }

    dailyPlan.tasks = dailyPlan.tasks.filter(t => t.taskId.toString() !== taskId)
    await dailyPlan.save()

    return res.json({ message: 'Task removed successfully' })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove task' })
  }
})

// Get daily plan progress
router.get('/:planId/progress', protect, async (req, res) => {
  try {
    const { planId } = req.params

    const dailyPlan = await DailyPlan.findOne({
      _id: planId,
      userId: req.user!._id
    })

    if (!dailyPlan) {
      return res.status(404).json({ error: 'Daily plan not found' })
    }

    const totalTasks = dailyPlan.tasks.length
    const completedTasks = dailyPlan.tasks.filter(t => t.done).length
    const totalEstMinutes = dailyPlan.tasks.reduce((sum, t) => sum + (t.estMinutes || 0), 0)
    const completedEstMinutes = dailyPlan.tasks.filter(t => t.done).reduce((sum, t) => sum + (t.estMinutes || 0), 0)

    // Get actual study time for this day
    const planDate = new Date(dailyPlan.date)
    const nextDay = new Date(planDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const studySessions = await StudySession.find({
      userId: req.user!._id,
      dailyPlanId: planId,
      startAt: {
        $gte: planDate,
        $lt: nextDay
      },
      status: 'closed'
    })

    const actualMinutes = studySessions.reduce((sum, session) => sum + (session.actualMinutes || 0), 0)

    const progress = {
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      time: {
        goal: dailyPlan.goalMinutes,
        estimated: totalEstMinutes,
        actual: actualMinutes,
        remaining: Math.max(0, dailyPlan.goalMinutes - actualMinutes),
        goalPercentage: dailyPlan.goalMinutes > 0 ? Math.round((actualMinutes / dailyPlan.goalMinutes) * 100) : 0
      },
      studySessions: studySessions.length
    }

    return res.json(progress)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch plan progress' })
  }
})

// Get user's daily plans history
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const plans = await DailyPlan.find({ userId: req.user!._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const total = await DailyPlan.countDocuments({ userId: req.user!._id })

    // Calculate progress for each plan
    const plansWithProgress = plans.map(plan => {
      const totalTasks = plan.tasks.length
      const completedTasks = plan.tasks.filter(t => t.done).length
      
      return {
        ...plan,
        progress: {
          tasks: {
            total: totalTasks,
            completed: completedTasks,
            percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          }
        }
      }
    })

    return res.json({
      plans: plansWithProgress,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch daily plans history' })
  }
})

// Delete daily plan
router.delete('/:planId', protect, async (req, res) => {
  try {
    const { planId } = req.params

    const dailyPlan = await DailyPlan.findOneAndDelete({
      _id: planId,
      userId: req.user!._id
    })

    if (!dailyPlan) {
      return res.status(404).json({ error: 'Daily plan not found' })
    }

    return res.json({ message: 'Daily plan deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete daily plan' })
  }
})

export default router
