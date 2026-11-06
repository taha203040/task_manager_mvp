import { Router } from 'express';
//@ts-ignore
import { TaskController } from '../controllers/Task.controller';
import { authenticate } from '../middlewares/authMiddleware';

const taskrouter = Router();

taskrouter.get('/', authenticate, TaskController.getTasksByUser);

taskrouter.post('/task', authenticate, TaskController.createTask);

// Task collaboration: comments
taskrouter.get('/:id/comments', authenticate, TaskController.getComments);
taskrouter.post('/:id/comments', authenticate, TaskController.addComment);

// Task collaboration: attachments
taskrouter.get('/:id/attachments', authenticate, TaskController.getAttachments);
taskrouter.post('/:id/attachments', authenticate, TaskController.addAttachment);
taskrouter.delete('/:id/attachments/:attachmentId', authenticate, TaskController.deleteAttachment);

taskrouter.get('/:id', authenticate, TaskController.getTaskById);

taskrouter.put('/:id', authenticate, TaskController.updateTask);

taskrouter.delete('/:id', authenticate, TaskController.deleteTask);

export default taskrouter;
