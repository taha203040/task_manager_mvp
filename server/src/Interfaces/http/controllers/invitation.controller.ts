import pool from "../../../Config/db";
import * as invite from '../../../Application/use-cases/Team-usecases/Invite.usecase'
import { SqlTeamInviteRepository } from "../../../Infrastructure/Repositories/Sql/Invitation";
import { Request, Response } from 'express';

// Initialize repository and use cases
export function createInviteUseCases(pool: any) {
    const repo = new SqlTeamInviteRepository(pool);
    return {
        create: new invite.CreateInviteUseCase(repo),
        getById: new invite.GetInviteByIdUseCase(repo),
        getByTeamId: new invite.GetInvitesByTeamIdUseCase(repo),
        getByUserId: new invite.GetInvitesByUserIdUseCase(repo),
        accept: new invite.AcceptInviteUseCase(repo),
        reject: new invite.RejectInviteUseCase(repo),
        delete: new invite.DeleteInviteUseCase(repo),
        getPending: new invite.GetPendingInviteUseCase(repo)
    };
}

export class InvitationController {
    private static useCases = createInviteUseCases(pool);

    // Create a new invitation
    static async createInvite(req: Request, res: Response): Promise<void> {
        try {
            const { teamId, invitedUserId, role, invitedBy } = req.body;

            if (!teamId || !invitedUserId || !role || !invitedBy) {
                res.status(400).json({ error: 'Missing required fields: teamId, invitedUserId, role, invitedBy' });
                return;
            }

            const newInvite = await InvitationController.useCases.create.execute({
                teamId,
                invitedUserId,
                role,
                invitedBy
            });

            res.status(201).json(newInvite);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    // Get invitation by ID
    static async getInviteById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params
            if (!id) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const invite = await InvitationController.useCases.getById.execute(id);

            if (!invite) {
                res.status(404).json({ error: 'Invite not found' });
                return;
            }

            res.status(200).json(invite);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get invitations by team ID
    static async getInvitesByTeamId(req: Request, res: Response): Promise<void> {
        try {
            const { teamId } = req.params;
            if (!teamId) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const invites = await InvitationController.useCases.getByTeamId.execute(teamId);

            res.status(200).json(invites);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get invitations by user ID
    static async getInvitesByUserId(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            if (!userId) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const invites = await InvitationController.useCases.getByUserId.execute(userId);

            res.status(200).json(invites);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Update invitation status (accept / reject)
    static async handleInviteResponse(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { action } = req.body; // expected: "accepted" | "rejected"

            if (!id) {
                res.status(400).json({ error: "Invitation ID is required" });
                return;
            }

            if (!status || !["accepted", "rejected"].includes(status)) {
                res.status(400).json({ error: "Invalid or missing status. Use 'accepted' or 'rejected'." });
                return;
            }

            const updatedInvite =
                action === "accept"
                    ? await InvitationController.useCases.accept.execute(id)
                    : await InvitationController.useCases.reject.execute(id);

            if (!updatedInvite) {
                res.status(404).json({ error: "Invite not found" });
                return;
            }

            res.status(200).json(updatedInvite);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Internal server error" });
            }
        }
    }


    // Delete an invitation
    static async deleteInvite(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const success = await InvitationController.useCases.delete.execute(id);

            if (!success) {
                res.status(404).json({ error: 'Invite not found' });
                return;
            }

            res.status(200).json({ message: 'Invite deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get pending invitation for a user and team
    static async getPendingInvite(req: Request, res: Response): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            if (!teamId || !userId) {
                res.status(404).json({ msg: 'There is no user with this account' });
                return
            }
            const invite = await InvitationController.useCases.getPending.execute(teamId, userId);

            res.status(200).json(invite);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}