import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { TeamController } from '../controllers/Team.controller';

const teamrouter = Router();


// router.get('/teams',TeamController );
teamrouter.get('/', authenticate, TeamController.getTeamById);
teamrouter.post('/', authenticate, TeamController.createTeam);
teamrouter.put('/:id', authenticate, TeamController.updateTeam);
teamrouter.delete('/:id', authenticate, TeamController.deleteTeam);

export default teamrouter;