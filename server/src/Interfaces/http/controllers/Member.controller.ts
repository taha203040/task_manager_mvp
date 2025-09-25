import { SqlMemberRepository } from "../../../Infrastructure/Repositories/Sql/Member";
import { Pool } from "pg";
import pool from "../../../Config/db";
import { TeamMember } from "../../../Domain/Entities/Team";
import { CreateTeamMemberUseCase, CheckTeamMembershipUseCase, DeleteTeamMemberUseCase, UpdateTeamMemberRoleUseCase, GetTeamMembersByTeamIdUseCase, GetTeamMembersByUserIdUseCase } from "../../../Application/use-cases/Team-usecases/Member.usecase";
// / Initialize repository and use cases
const memberRepository = new SqlMemberRepository(pool);
const createTeamMemberUseCase = new CreateTeamMemberUseCase(memberRepository);
const getTeamMembersByTeamIdUseCase = new GetTeamMembersByTeamIdUseCase(memberRepository);
const getTeamMembersByUserIdUseCase = new GetTeamMembersByUserIdUseCase(memberRepository);
const updateTeamMemberRoleUseCase = new UpdateTeamMemberRoleUseCase(memberRepository);
const deleteTeamMemberUseCase = new DeleteTeamMemberUseCase(memberRepository);
const checkTeamMembershipUseCase = new CheckTeamMembershipUseCase(memberRepository);

// Validation helper functions
const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

const isValidRole = (role: string): boolean => {
    return ['owner', 'admin', 'member'].includes(role);
};

const validateRequiredFields = (fields: Record<string, any>, required: string[]): string[] => {
    const missing: string[] = [];
    required.forEach(field => {
        if (!fields[field] || (typeof fields[field] === 'string' && fields[field].trim() === '')) {
            missing.push(field);
        }
    });
    return missing;
};

// Controller methods
export class MemberController {

    // Create a new team member
 static async createTeamMember(req: Request, res: Response): Promise<void> {
    try {
        const { teamId, userId, role = 'member' } = req.body;

        // التحقق الأساسي
        if (!teamId || !userId) {
            return res.status(400).json({ msg: "teamId and userId are required" });
        }

        // التحقق من الحقول المطلوبة
        const missingFields = validateRequiredFields({ teamId, userId }, ['teamId', 'userId']);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // التحقق من صحة UUID
        if (!isValidUUID(teamId) || !isValidUUID(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid UUID format for teamId or userId'
            });
        }

        // التحقق من الدور
        if (!isValidRole(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be one of: owner, admin, member'
            });
        }

        // التحقق إذا كان العضو موجودًا مسبقًا
        const isExistingMember = await checkTeamMembershipUseCase.execute(teamId, userId);
        if (isExistingMember) {
            return res.status(409).json({
                success: false,
                error: 'User is already a member of this team'
            });
        }

        // إنشاء العضو الجديد
        await createTeamMemberUseCase.execute(teamId, userId, role);

        return res.status(201).json({
            success: true,
            message: 'Team member added successfully',
            data: { teamId, userId, role }
        });

    } catch (error) {
        console.error('Error creating team member:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while creating team member'
        });
    }
}
   // Get team members by team ID
    static async getTeamMembersByTeamId(req: Request, res: Response): Promise<void> {
        try {
            const { teamId } = req.params;

            // Validate UUID format
            if (!isValidUUID(teamId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid UUID format for teamId'
                });
                return;
            }

            const members = await getTeamMembersByTeamIdUseCase.execute(teamId);

            res.status(200).json({
                success: true,
                data: members,
                count: members.length
            });

        } catch (error) {
            console.error('Error fetching team members:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while fetching team members'
            });
        }
    }

    // Get team members by user ID
    static async getTeamMembersByUserId(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            // Validate UUID format
            if (!isValidUUID(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid UUID format for userId'
                });
                return;
            }

            const members = await getTeamMembersByUserIdUseCase.execute(userId);

            res.status(200).json({
                success: true,
                data: members,
                count: members.length
            });

        } catch (error) {
            console.error('Error fetching user team memberships:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while fetching user team memberships'
            });
        }
    }

    // Update team member role
    static async updateTeamMemberRole(req: Request, res: Response): Promise<void> {
        try {
            const { teamId, userId } = req.params;
            const { role } = req.body;

            // Validate required fields
            if (!role) {
                res.status(400).json({
                    success: false,
                    error: 'Role is required'
                });
                return;
            }

            // Validate UUID format
            if (!isValidUUID(teamId) || !isValidUUID(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid UUID format for teamId or userId'
                });
                return;
            }

            // Validate role
            if (!isValidRole(role)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid role. Must be one of: owner, admin, member'
                });
                return;
            }

            // Check if member exists
            const isMember = await checkTeamMembershipUseCase.execute(teamId, userId);
            if (!isMember) {
                res.status(404).json({
                    success: false,
                    error: 'Team member not found'
                });
                return;
            }

            await updateTeamMemberRoleUseCase.execute(teamId, userId, role);

            res.status(200).json({
                success: true,
                message: 'Team member role updated successfully',
                data: { teamId, userId, role }
            });

        } catch (error) {
            console.error('Error updating team member role:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while updating team member role'
            });
        }
    }

    // Delete team member
    static async deleteTeamMember(req: Request, res: Response): Promise<void> {
        try {
            const { teamId, userId } = req.params;

            // Validate UUID format
            if (!isValidUUID(teamId) || !isValidUUID(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid UUID format for teamId or userId'
                });
                return;
            }

            // Check if member exists
            const isMember = await checkTeamMembershipUseCase.execute(teamId, userId);
            if (!isMember) {
                res.status(404).json({
                    success: false,
                    error: 'Team member not found'
                });
                return;
            }

            await deleteTeamMemberUseCase.execute(teamId, userId);

            res.status(200).json({
                success: true,
                message: 'Team member removed successfully'
            });

        } catch (error) {
            console.error('Error deleting team member:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while deleting team member'
            });
        }
    }

    // Check team membership
    static async checkTeamMembership(req: Request, res: Response): Promise<void> {
        try {
            const { teamId, userId } = req.params;

            // Validate UUID format
            if (!isValidUUID(teamId) || !isValidUUID(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid UUID format for teamId or userId'
                });
                return;
            }

            const isMember = await checkTeamMembershipUseCase.execute(teamId, userId);

            res.status(200).json({
                success: true,
                data: { isMember }
            });

        } catch (error) {
            console.error('Error checking team membership:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while checking team membership'
            });
        }
    }
}