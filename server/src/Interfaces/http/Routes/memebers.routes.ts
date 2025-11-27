import { Router } from 'express';
import { MemberController } from '../controllers/Member.controller';
import { authenticate } from '../middlewares/authMiddleware';

const memberRouter = Router();

// Create a new team member

// Get team members by team ID
memberRouter.get('/team/:teamId', authenticate , MemberController.getTeamMembersByTeamId);

// Get team members by user ID
memberRouter.get('/user/:userId', authenticate , MemberController.getTeamMembersByUserId);

// Update team member role
memberRouter.put('/:teamId/:userId',authenticate ,  MemberController.updateTeamMemberRole);

// Delete team member
memberRouter.delete('/:teamId/:userId', authenticate , MemberController.deleteTeamMember);

// Check team membership
memberRouter.get('/:teamId/:userId', authenticate , MemberController.checkTeamMembership);

export default memberRouter;