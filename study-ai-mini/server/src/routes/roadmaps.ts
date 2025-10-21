import { Router } from 'express'
import { Roadmap, User } from '../models'
import { protect } from '../middleware/auth'

const router = Router()

// Get user's current roadmap
router.get('/my-roadmap', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user!._id).select('currentRoadmapId')
    
    if (!user?.currentRoadmapId) {
      return res.status(404).json({ error: 'No active roadmap found' })
    }

    const roadmap = await Roadmap.findById(user.currentRoadmapId)
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' })
    }

    return res.json(roadmap)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch roadmap' })
  }
})

// Create a new roadmap for user
router.post('/', protect, async (req, res) => {
  try {
    const { title, milestones } = req.body

    // Check if user already has a roadmap
    const existingRoadmap = await Roadmap.findOne({ userId: req.user!._id })
    if (existingRoadmap) {
      return res.status(400).json({ error: 'User already has a roadmap. Use PUT to update.' })
    }

    const roadmap = new Roadmap({
      userId: req.user!._id,
      title,
      milestones: milestones.map((milestone: any, index: number) => ({
        ...milestone,
        order: index + 1,
        finished: 0
      }))
    })

    await roadmap.save()

    // Update user's current roadmap reference
    await User.findByIdAndUpdate(req.user!._id, {
      currentRoadmapId: roadmap._id
    })

    return res.status(201).json(roadmap)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create roadmap' })
  }
})

// Update user's roadmap
router.put('/', protect, async (req, res) => {
  try {
    const { title, milestones } = req.body

    const roadmap = await Roadmap.findOneAndUpdate(
      { userId: req.user!._id },
      {
        title,
        milestones: milestones.map((milestone: any, index: number) => ({
          ...milestone,
          order: index + 1
        }))
      },
      { new: true, upsert: true }
    )

    // Ensure user's current roadmap reference is updated
    await User.findByIdAndUpdate(req.user!._id, {
      currentRoadmapId: roadmap._id
    })

    return res.json(roadmap)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update roadmap' })
  }
})

// Update milestone progress
router.put('/milestone/:mileId/progress', protect, async (req, res) => {
  try {
    const { mileId } = req.params
    const { finished } = req.body

    const roadmap = await Roadmap.findOne({ userId: req.user!._id })
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' })
    }

    const milestone = roadmap.milestones.find(m => m.mileId === mileId)
    
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    milestone.finished = Math.min(finished, milestone.subLessons)
    await roadmap.save()

    return res.json(milestone)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update milestone progress' })
  }
})

// Get milestone details
router.get('/milestone/:mileId', protect, async (req, res) => {
  try {
    const { mileId } = req.params

    const roadmap = await Roadmap.findOne({ userId: req.user!._id })
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' })
    }

    const milestone = roadmap.milestones.find(m => m.mileId === mileId)
    
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    return res.json(milestone)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch milestone' })
  }
})

// Add resource to milestone
router.post('/milestone/:mileId/resource', protect, async (req, res) => {
  try {
    const { mileId } = req.params
    const { type, id, title } = req.body

    const roadmap = await Roadmap.findOne({ userId: req.user!._id })
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' })
    }

    const milestone = roadmap.milestones.find(m => m.mileId === mileId)
    
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    // Check if resource already exists
    const existingResource = milestone.resources.find(r => r.id === id && r.type === type)
    if (existingResource) {
      return res.status(400).json({ error: 'Resource already exists in milestone' })
    }

    milestone.resources.push({ type, id, title })
    await roadmap.save()

    return res.json(milestone)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add resource to milestone' })
  }
})

// Remove resource from milestone
router.delete('/milestone/:mileId/resource/:resourceId', protect, async (req, res) => {
  try {
    const { mileId, resourceId } = req.params

    const roadmap = await Roadmap.findOne({ userId: req.user!._id })
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' })
    }

    const milestone = roadmap.milestones.find(m => m.mileId === mileId)
    
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' })
    }

    milestone.resources = milestone.resources.filter(r => r.id !== resourceId)
    await roadmap.save()

    return res.json(milestone)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove resource from milestone' })
  }
})

// Get roadmap progress summary
router.get('/progress', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user!._id })
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' })
    }

    const totalMilestones = roadmap.milestones.length
    const completedMilestones = roadmap.milestones.filter(m => 
      m.finished >= m.subLessons
    ).length

    const totalSubLessons = roadmap.milestones.reduce((sum, m) => sum + m.subLessons, 0)
    const completedSubLessons = roadmap.milestones.reduce((sum, m) => sum + m.finished, 0)

    const progress = {
      roadmapId: roadmap._id,
      title: roadmap.title,
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        percentage: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
      },
      subLessons: {
        total: totalSubLessons,
        completed: completedSubLessons,
        percentage: totalSubLessons > 0 ? Math.round((completedSubLessons / totalSubLessons) * 100) : 0
      },
      milestoneDetails: roadmap.milestones.map(m => ({
        mileId: m.mileId,
        name: m.name,
        progress: m.subLessons > 0 ? Math.round((m.finished / m.subLessons) * 100) : 0,
        completed: m.finished >= m.subLessons
      }))
    }

    return res.json(progress)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch roadmap progress' })
  }
})

// Delete user's roadmap
router.delete('/', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({ userId: req.user!._id })
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' })
    }

    // Clear user's current roadmap reference
    await User.findByIdAndUpdate(req.user!._id, {
      currentRoadmapId: null
    })

    return res.json({ message: 'Roadmap deleted successfully' })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete roadmap' })
  }
})

export default router
