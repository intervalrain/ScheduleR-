import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /sprints
router.get('/', async (req, res) => {
  try {
    const sprints = await prisma.sprint.findMany();
    res.json(sprints);
  } catch (error) {
    console.error('Error fetching sprints:', error);
    res.status(500).json({ error: 'Failed to fetch sprints' });
  }
});

// POST /sprints
router.post('/', async (req, res) => {
  const { name, startDate, endDate, teamId } = req.body;
  if (!name || !startDate || !endDate || !teamId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const newSprint = await prisma.sprint.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        team: { connect: { id: teamId } },
      },
    });
    res.status(201).json(newSprint);
  } catch (error) {
    console.error('Error creating sprint:', error);
    res.status(500).json({ error: 'Failed to create sprint' });
  }
});

export default router;
