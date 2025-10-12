import { Router } from 'express';
//@ts-ignore
import { TaskController } from '../controllers/Task.controller';
import { authenticate } from '../middlewares/authMiddleware';

const taskrouter = Router();

taskrouter.get('/user/:userId', authenticate, TaskController.getTasksByUser);

taskrouter.get('/:id', authenticate, TaskController.getTaskById);

taskrouter.post('/task', authenticate, TaskController.createTask);

taskrouter.put('/:id', authenticate, TaskController.updateTask);

taskrouter.delete('/:id', authenticate, TaskController.deleteTask);

export default taskrouter;