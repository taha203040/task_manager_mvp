import { SqlMemberRepository } from "../../../Infrastructure/Repositories/Sql/Member";
import pool from "../../../Config/db";
import * as members from "../../../Application/use-cases/Team-usecases/Member.usecase";
// / Initialize repository and use cases

export function Memebers(pool: any) {
    const repo = new SqlMemberRepository(pool)
    return {
        create: new members.CreateTeamMemberUseCase(repo),
        getByTeamId: new members.GetTeamMembersByTeamIdUseCase(repo),
        getByUserId: new members.GetTeamMembersByUserIdUseCase(repo),
        updateRole: new members.UpdateTeamMemberRoleUseCase(repo),
        delete: new members.DeleteTeamMemberUseCase(repo),
        checkMembership: new members.CheckTeamMembershipUseCase(repo)
    }
}
// Controller methods
export class MemberController {
    private static useCases = Memebers(pool)
    // Create a new team member
    // static async searchUsers(req: any, res: any): Promise<void> {
    //     try {
    //         const { q: searchTerm } = req.query;
    //         console.log(req.query)
    //         console.log('cs', searchTerm)
    //         const users = await this.useCases..searchUsers(searchTerm);
    //         res.status(200).json(users);
    //     } catch (error) {
    //         res.status(500).json({ error: error });
    //     }
    // }
    static async createTeamMember(teamId: string, userId: string, role: string): Promise<any> {
        try {
            const teamMember = await MemberController.useCases.create.execute(teamId, userId, role);
            return { status: 201, data: teamMember };
        } catch (err) {
            return { status: 500, data: { error: err } };
        }
    }

    // Get team members by team ID
    static async getTeamMembersByTeamId(req: any, res: any): Promise<void> {
        try {
            const { teamId } = req.params;
            const teamMembers = await MemberController.useCases.getByTeamId.execute(teamId);
            res.status(200).json(teamMembers);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error });
        }
    }

    // Get team members by user ID
    static async getTeamMembersByUserId(req: any, res: any): Promise<void> {
        try {
            const { userId } = req.params;
            const teamMembers = await MemberController.useCases.getByUserId.execute(userId);
            res.status(200).json(teamMembers);
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }

    // Update team member role
    static async updateTeamMemberRole(req: any, res: any): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            const { role } = req.body;
            const updatedTeamMember = await MemberController.useCases.updateRole.execute(teamId, userId, role);
            res.status(200).json(updatedTeamMember);
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }

    // Delete team member
    static async deleteTeamMember(req: any, res: any): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            await MemberController.useCases.delete.execute(teamId, userId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }

    // Check team membership
    static async checkTeamMembership(req: any, res: any): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            const isMember = await MemberController.useCases.checkMembership.execute(teamId, userId);
            res.status(200).json({ isMember });
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }
}
