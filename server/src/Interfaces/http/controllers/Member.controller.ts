import { SqlMemberRepository } from "../../../Infrastructure/Repositories/Sql/Member";
import pool from "../../../Config/db";
import { CreateTeamMemberUseCase, CheckTeamMembershipUseCase, DeleteTeamMemberUseCase, UpdateTeamMemberRoleUseCase, GetTeamMembersByTeamIdUseCase, GetTeamMembersByUserIdUseCase } from "../../../Application/use-cases/Team-usecases/Member.usecase";
// / Initialize repository and use cases
const memberRepository = new SqlMemberRepository(pool);
const createTeamMemberUseCase = new CreateTeamMemberUseCase(memberRepository);
const getTeamMembersByTeamIdUseCase = new GetTeamMembersByTeamIdUseCase(memberRepository);
const getTeamMembersByUserIdUseCase = new GetTeamMembersByUserIdUseCase(memberRepository);
const updateTeamMemberRoleUseCase = new UpdateTeamMemberRoleUseCase(memberRepository);
const deleteTeamMemberUseCase = new DeleteTeamMemberUseCase(memberRepository);
const checkTeamMembershipUseCase = new CheckTeamMembershipUseCase(memberRepository);

// Controller methods
export class MemberController {
    // Create a new team member
    static async searchUsers(req: any, res: any): Promise<void> {
        try {
            const { q: searchTerm } = req.query;
            console.log(req.query)
            console.log('cs', searchTerm)
            const users = await memberRepository.searchUsers(searchTerm);
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }
    static async createTeamMember(teamId: string, userId: string, role: string): Promise<any> {
        try {
            const teamMember = await createTeamMemberUseCase.execute(teamId, userId, role);
            return { status: 201, data: teamMember };
        } catch (err) {
            return { status: 500, data: { error: err } };
        }
    }

    // Get team members by team ID
    static async getTeamMembersByTeamId(req: any, res: any): Promise<void> {
        try {
            const { teamId } = req.params;
            const teamMembers = await getTeamMembersByTeamIdUseCase.execute(teamId);
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
            const teamMembers = await getTeamMembersByUserIdUseCase.execute(userId);
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
            const updatedTeamMember = await updateTeamMemberRoleUseCase.execute(teamId, userId, role);
            res.status(200).json(updatedTeamMember);
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }

    // Delete team member
    static async deleteTeamMember(req: any, res: any): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            await deleteTeamMemberUseCase.execute(teamId, userId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }

    // Check team membership
    static async checkTeamMembership(req: any, res: any): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            const isMember = await checkTeamMembershipUseCase.execute(teamId, userId);
            res.status(200).json({ isMember });
        } catch (error) {
            res.status(500).json({ error: error });
        }
    }
}
