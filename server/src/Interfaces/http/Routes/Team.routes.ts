import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { TeamController } from '../controllers/Team.controller';

const teamrouter = Router();


// router.get('/teams',TeamController );
teamrouter.get('/', authenticate, TeamController.getTeamsByUser);
// Canonical team retrieval (previously missing; the old '/invites/:team' alias read
// req.params.id and therefore always answered 401, so it was removed).
teamrouter.get('/:id', authenticate, TeamController.getTeamById);
teamrouter.post('/', authenticate, TeamController.createTeam);
teamrouter.put('/:id', authenticate, TeamController.updateTeam);
teamrouter.delete('/:id', authenticate, TeamController.deleteTeam);

export default teamrouter;