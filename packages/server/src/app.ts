import express from 'express';
import sprintRoutes from './routes/sprintRoutes';

const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies

app.get('/', (req, res) => {
  res.send('Hello, ScheduleR API!');
});

app.use('/sprints', sprintRoutes);

export default app;
