import pool from "../../../Config/db";
import * as invite from '../../../Application/use-cases/Team-usecases/Invite.usecase'
import { SqlTeamInviteRepository } from "../../../Infrastructure/Repositories/Sql/Invitation";
import { SqlMemberRepository } from "../../../Infrastructure/Repositories/Sql/Member";
import { UserRepoPostgress } from "../../../Infrastructure/Repositories/Sql/PostgresLogicUser";
import { Request, Response } from 'express';
import { sendError, sendUnauthorized } from "../middlewares/errorHandler";

// Initialize repository and use cases
export function createInviteUseCases(pool: any) {
    const repo = new SqlTeamInviteRepository(pool);
    const memberRepo = new SqlMemberRepository(pool);
    const userRepo = new UserRepoPostgress(pool);
    return {
        create: new invite.CreateInviteUseCase(repo, memberRepo, userRepo),
        getById: new invite.GetInviteByIdUseCase(repo, memberRepo),
        getByTeamId: new invite.GetInvitesByTeamIdUseCase(repo, memberRepo),
        getByUserId: new invite.GetInvitesByUserIdUseCase(repo),
        accept: new invite.AcceptInviteUseCase(repo),
        reject: new invite.RejectInviteUseCase(repo),
        delete: new invite.DeleteInviteUseCase(repo, memberRepo),
        getPending: new invite.GetPendingInviteUseCase(repo, memberRepo)
    };
}

export class InvitationController {
    private static useCases = createInviteUseCases(pool);

    // Create a new invitation (inviter is always the authenticated user)
    static async createInvite(req: Request, res: Response): Promise<void> {
        try {
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }

            const { teamId, invitedUserId, role } = req.body ?? {};
            if (!teamId || !invitedUserId || !role) {
                res.status(400).json({ error: 'Missing required fields: teamId, invitedUserId, role' });
                return;
            }

            const newInvite = await InvitationController.useCases.create.execute({
                teamId: String(teamId),
                invitedUserId: String(invitedUserId),
                role: String(role),
                invitedBy: actorId,
            });

            res.status(201).json(newInvite);
        } catch (error) {
            sendError(res, error);
        }
    }

    // Get invitation by ID
    static async getInviteById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            if (!id) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const foundInvite = await InvitationController.useCases.getById.execute(id, actorId);

            if (!foundInvite) {
                res.status(404).json({ error: 'Invite not found' });
                return;
            }

            res.status(200).json(foundInvite);
        } catch (error) {
            sendError(res, error);
        }
    }

    // Get invitations by team ID (team members only)
    static async getInvitesByTeamId(req: Request, res: Response): Promise<void> {
        try {
            const { teamId } = req.params;
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            if (!teamId) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const invites = await InvitationController.useCases.getByTeamId.execute(teamId, actorId);

            res.status(200).json(invites);
        } catch (error) {
            sendError(res, error);
        }
    }

    // Get invitations by user ID (always the authenticated user's own invites)
    static async getInvitesByUserId(req: Request, res: Response): Promise<void> {
        try {
            const user_id = req.user?.user_id;
            if (!user_id) {
                return sendUnauthorized(res);
            }

            const invites = await InvitationController.useCases
                .getByUserId
                .execute(user_id);

            res.status(200).json(invites);
        } catch (error) {
            sendError(res, error);
        }
    }

    // Update invitation status (accept / decline)
    static async handleInviteResponse(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }

            const { action } = req.body ?? {}; // expected: "accepted" | "declined" | "rejected"

            if (!id) {
                res.status(400).json({ error: "Invitation ID is required" });
                return;
            }

            if (!action || !["accepted", "declined", "rejected"].includes(action)) {
                res.status(400).json({ error: "Invalid or missing action. Use 'accepted' or 'declined'." });
                return;
            }

            // Membership insertion happens inside the invitation transaction itself,
            // and the team is resolved from the invite record (never from the client).
            const updatedInvite =
                action === "accepted"
                    ? await InvitationController.useCases.accept.execute(id, actorId)
                    : await InvitationController.useCases.reject.execute(id, actorId);

            res.status(200).json(updatedInvite);
        } catch (error) {
            sendError(res, error);
        }
    }

    // Delete an invitation
    static async deleteInvite(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            if (!id) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const success = await InvitationController.useCases.delete.execute(id, actorId);

            if (!success) {
                res.status(404).json({ error: 'Invite not found' });
                return;
            }

            res.status(200).json({ message: 'Invite deleted successfully' });
        } catch (error) {
            sendError(res, error);
        }
    }

    // Get pending invitation for a user and team
    static async getPendingInvite(req: Request, res: Response): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            if (!teamId || !userId) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const pendingInvite = await InvitationController.useCases.getPending.execute(teamId, userId, actorId);

            res.status(200).json(pendingInvite);
        } catch (error) {
            sendError(res, error);
        }
    }
}
