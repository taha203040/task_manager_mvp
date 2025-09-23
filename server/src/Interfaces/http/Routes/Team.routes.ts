import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { TeamController } from '../controllers/Team.controller';

const teamrouter = Router();


// router.get('/teams',TeamController );
teamrouter.get('/teams/:id', authenticate, TeamController.getTeamById);
teamrouter.post('/teams', authenticate, TeamController.createTeam);
teamrouter.put('/teams/:id', authenticate, TeamController.updateTeam);
teamrouter.delete('/teams/:id', authenticate, TeamController.deleteTeam);

export default teamrouter;