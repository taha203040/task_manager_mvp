import { Router } from 'express';
//@ts-ignore
import { TaskController } from '../controllers/Task.controller';

const router = Router();

router.get('/tasks/user/:userId', TaskController.getTasksByUser);

router.get('/tasks/:id', TaskController.getTaskById);

router.post('/tasks', TaskController.createTask);

router.put('/tasks/:id', TaskController.updateTask);

router.delete('/tasks/:id', TaskController.deleteTask);

export default router;