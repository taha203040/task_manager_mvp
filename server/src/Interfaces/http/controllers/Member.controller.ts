import { routeParam } from "../utils/params";
import { Request, Response } from "express";
import { SqlMemberRepository } from "../../../Infrastructure/Repositories/Sql/Member";
import { TeamRepoPostGress } from "../../../Infrastructure/Repositories/Sql/Team_SQl";
import pool from "../../../Config/db";
import * as members from "../../../Application/use-cases/Team-usecases/Member.usecase";
import { sendError, sendUnauthorized } from "../middlewares/errorHandler";

// Wiring: one member repository for every use case; team repository is needed to
// resolve the ownership anchor (teams.created_by) for member management rules.
export function Memebers(pool: any) {
    const repo = new SqlMemberRepository(pool)
    const teamRepo = new TeamRepoPostGress(pool)
    return {
        create: new members.CreateTeamMemberUseCase(repo),
        getByTeamId: new members.GetTeamMembersByTeamIdUseCase(repo),
        getByUserId: new members.GetTeamMembersByUserIdUseCase(repo),
        updateRole: new members.UpdateTeamMemberRoleUseCase(repo, teamRepo),
        delete: new members.DeleteTeamMemberUseCase(repo, teamRepo),
        checkMembership: new members.CheckTeamMembershipUseCase(repo),
        searchUsers: new members.SearchUsersUsecase(repo)
    }
}

export class MemberController {
    private static useCases = Memebers(pool)

    static async searchUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await MemberController.useCases.searchUsers.execute(req.query?.q);
            res.status(200).json({ users });
        } catch (error) {
            sendError(res, error);
        }
    }

    /** Members of one team. Requires team membership; the creator is listed as owner. */
    static async getTeamMembersByTeamId(req: Request, res: Response): Promise<void> {
        try {
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            const teamId = routeParam(req.params.teamId);
            const teamMembers = await MemberController.useCases.getByTeamId.execute(teamId as string, actorId);
            res.status(200).json(teamMembers);
        } catch (error) {
            sendError(res, error);
        }
    }

    /** Own memberships only. */
    static async getTeamMembersByUserId(req: Request, res: Response): Promise<void> {
        try {
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            const userId = routeParam(req.params.userId);
            const teamMembers = await MemberController.useCases.getByUserId.execute(userId as string, actorId);
            res.status(200).json(teamMembers);
        } catch (error) {
            sendError(res, error);
        }
    }

    /** Owner/admin only; cannot change your own role, cannot escalate to owner as admin. */
    static async updateTeamMemberRole(req: Request, res: Response): Promise<void> {
        try {
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            const teamId = routeParam(req.params.teamId);
const userId = routeParam(req.params.userId);
            const { role } = req.body ?? {};
            await MemberController.useCases.updateRole.execute(
                teamId as string,
                userId as string,
                role,
                actorId,
            );
            res.status(200).json({ message: "Team member role updated successfully" });
        } catch (error) {
            sendError(res, error);
        }
    }

    /** Owner/admin removing someone else, or a member leaving the team. */
    static async deleteTeamMember(req: Request, res: Response): Promise<void> {
        try {
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            const teamId = routeParam(req.params.teamId);
const userId = routeParam(req.params.userId);
            await MemberController.useCases.delete.execute(teamId as string, userId as string, actorId);
            res.status(204).send();
        } catch (error) {
            sendError(res, error);
        }
    }

    /** Self-check, or a member of the same team. */
    static async checkTeamMembership(req: Request, res: Response): Promise<void> {
        try {
            const actorId = req.user?.user_id;
            if (!actorId) {
                return sendUnauthorized(res);
            }
            const teamId = routeParam(req.params.teamId);
const userId = routeParam(req.params.userId);
            const isMember = await MemberController.useCases.checkMembership.execute(
                teamId as string,
                userId as string,
                actorId,
            );
            res.status(200).json({ isMember });
        } catch (error) {
            sendError(res, error);
        }
    }
}
