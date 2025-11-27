import { Router } from "express";
import { InvitationController } from "../controllers/invitation.controller";
import { authenticate } from "../middlewares/authMiddleware";
const inviteRouter = Router();

// Create a new invitation
inviteRouter.post("/", authenticate, InvitationController.createInvite);

// Get invitation by ID
inviteRouter.get("/:id", authenticate, InvitationController.getInviteById);

// Get invitations by team ID
inviteRouter.get("/team/:teamId", authenticate, InvitationController.getInvitesByTeamId);

// Get invitations by user ID
inviteRouter.get("/user/:userId", authenticate, InvitationController.getInvitesByUserId);

// Get pending invitation for a user and team
inviteRouter.get("/pending/:teamId/:userId", authenticate, InvitationController.getPendingInvite);

// Accept an invitation
inviteRouter.patch("/:id/respond", authenticate, InvitationController.handleInviteResponse);

// Delete an invitation
inviteRouter.delete("/:id", authenticate, InvitationController.deleteInvite);

export default inviteRouter;
