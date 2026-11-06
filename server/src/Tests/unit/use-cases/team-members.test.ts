import { Team, TeamMember } from "../../../Domain/Entities/Team";
import { TeamInvite } from "../../../Domain/Entities/Invites";
import { User } from "../../../Domain/Entities/User_Entities";
import { TeamMemberRepo, TeamRepo } from "../../../Application/Repositories/TeamRepo";
import { ITeamInviteRepository } from "../../../Application/Repositories/Team_invites";
import { UserRep } from "../../../Application/Repositories/UserRepository";
import {
    CheckTeamMembershipUseCase,
    DeleteTeamMemberUseCase,
    GetTeamMembersByTeamIdUseCase,
    GetTeamMembersByUserIdUseCase,
    UpdateTeamMemberRoleUseCase,
} from "../../../Application/use-cases/Team-usecases/Member.usecase";
import { CreateInviteUseCase } from "../../../Application/use-cases/Team-usecases/Invite.usecase";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";

const mockMemberRepo = {
    create: jest.fn(),
    getByTeamId: jest.fn(),
    getByUserId: jest.fn(),
    updateRole: jest.fn(),
    delete: jest.fn(),
    isMember: jest.fn(),
    getRole: jest.fn(),
    countOwners: jest.fn(),
    getByUserIdWithTeam: jest.fn(),
    searchUsers: jest.fn(),
} as unknown as jest.Mocked<TeamMemberRepo>;

const mockTeamRepo = {
    create: jest.fn(),
    getTeamsByUser: jest.fn(),
    getById: jest.fn(),
    getCreatedBy: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
} as unknown as jest.Mocked<TeamRepo>;

const mockInviteRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTeamId: jest.fn(),
    findByUserId: jest.fn(),
    findPendingInvite: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    acceptAsInvitee: jest.fn(),
} as unknown as jest.Mocked<ITeamInviteRepository>;

const mockUserRepo = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    existsByUsername: jest.fn(),
    updateProfile: jest.fn(),
} as unknown as jest.Mocked<UserRep>;

const TEAM = "11111111-1111-1111-1111-111111111111";
const CREATOR = "22222222-2222-2222-2222-222222222222";
const ADMIN = "33333333-3333-3333-3333-333333333333";
const MEMBER = "44444444-4444-4444-4444-444444444444";
const OUTSIDER = "55555555-5555-5555-5555-555555555555";

/** role lookup that mirrors team_members rows (+ the creator ownership anchor) */
function roles(map: Record<string, string | null>) {
    mockMemberRepo.getRole.mockImplementation(async (_teamId: string, userId: string) => map[userId] ?? null);
}

describe("Team members", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockTeamRepo.getCreatedBy.mockResolvedValue(CREATOR);
        mockMemberRepo.countOwners.mockResolvedValue(1);
        roles({ [CREATOR]: "owner", [ADMIN]: "admin", [MEMBER]: "member" });
    });

    describe("GetTeamMembersByTeamId", () => {
        it("returns members for a team member, including the creator as owner", async () => {
            const members = [
                new TeamMember("ahmed", TEAM, CREATOR, "owner", new Date()),
                new TeamMember("bob", TEAM, MEMBER, "member", new Date()),
            ];
            mockMemberRepo.getByTeamId.mockResolvedValue(members);
            const useCase = new GetTeamMembersByTeamIdUseCase(mockMemberRepo);

            const result = await useCase.execute(TEAM, MEMBER);

            expect(result).toEqual(members);
            expect(result[0]!.role).toBe("owner");
            expect(result[0]!.username).toBe("ahmed");
            expect(mockMemberRepo.getByTeamId).toHaveBeenCalledWith(TEAM);
        });

        it("returns an empty array when the team has no members", async () => {
            mockMemberRepo.getByTeamId.mockResolvedValue([]);
            const useCase = new GetTeamMembersByTeamIdUseCase(mockMemberRepo);

            await expect(useCase.execute(TEAM, MEMBER)).resolves.toEqual([]);
        });

        it("denies an unrelated user (BOLA on teamId)", async () => {
            const useCase = new GetTeamMembersByTeamIdUseCase(mockMemberRepo);

            await expect(useCase.execute(TEAM, OUTSIDER)).rejects.toThrow(ForbiddenError);
            expect(mockMemberRepo.getByTeamId).not.toHaveBeenCalled();
        });

        it("does not return a members array inside a team response", async () => {
            mockMemberRepo.getByTeamId.mockResolvedValue([new TeamMember("ahmed", TEAM, CREATOR, "owner")]);
            const useCase = new GetTeamMembersByTeamIdUseCase(mockMemberRepo);

            const members = await useCase.execute(TEAM, MEMBER);

            expect(Array.isArray(members)).toBe(true);
            expect(Object.keys(members[0] as object)).not.toContain("members");
        });
    });

    describe("GetTeamMembersByUserId", () => {
        it("returns the caller's own memberships", async () => {
            mockMemberRepo.getByUserId.mockResolvedValue([new TeamMember("bob", TEAM, MEMBER, "member")]);
            const useCase = new GetTeamMembersByUserIdUseCase(mockMemberRepo);

            await expect(useCase.execute(MEMBER, MEMBER)).resolves.toHaveLength(1);
        });

        it("denies reading another user's memberships", async () => {
            const useCase = new GetTeamMembersByUserIdUseCase(mockMemberRepo);

            await expect(useCase.execute(OUTSIDER, MEMBER)).rejects.toThrow(ForbiddenError);
            expect(mockMemberRepo.getByUserId).not.toHaveBeenCalled();
        });
    });

    describe("UpdateTeamMemberRole", () => {
        it("lets an owner promote a member to admin", async () => {
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await useCase.execute(TEAM, MEMBER, "admin", CREATOR);

            expect(mockMemberRepo.updateRole).toHaveBeenCalledWith(TEAM, MEMBER, "admin");
        });

        it("lets an admin manage a regular member", async () => {
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await useCase.execute(TEAM, MEMBER, "admin", ADMIN);

            expect(mockMemberRepo.updateRole).toHaveBeenCalledWith(TEAM, MEMBER, "admin");
        });

        it("rejects a plain member (management is owner/admin only)", async () => {
            roles({ [CREATOR]: "owner", [MEMBER]: "member" });
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, ADMIN, "member", MEMBER)).rejects.toThrow(ForbiddenError);
            expect(mockMemberRepo.updateRole).not.toHaveBeenCalled();
        });

        it("rejects an outsider", async () => {
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, MEMBER, "admin", OUTSIDER)).rejects.toThrow(ForbiddenError);
        });

        it("rejects capitalised or unknown roles", async () => {
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, MEMBER, "Owner", CREATOR)).rejects.toThrow(ValidationError);
            await expect(useCase.execute(TEAM, MEMBER, "superuser", CREATOR)).rejects.toThrow(ValidationError);
            expect(mockMemberRepo.updateRole).not.toHaveBeenCalled();
        });

        it("prevents changing your own role (no self escalation)", async () => {
            roles({ [CREATOR]: "owner", [ADMIN]: "admin" });
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, ADMIN, "owner", ADMIN)).rejects.toThrow(ForbiddenError);
            expect(mockMemberRepo.updateRole).not.toHaveBeenCalled();
        });

        it("prevents an admin from granting the owner role", async () => {
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, MEMBER, "owner", ADMIN)).rejects.toThrow(ForbiddenError);
            expect(mockMemberRepo.updateRole).not.toHaveBeenCalled();
        });

        it("prevents an admin from modifying an owner", async () => {
            roles({ [CREATOR]: "owner", [ADMIN]: "admin" });
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, CREATOR, "member", ADMIN)).rejects.toThrow(ValidationError);
        });

        it("keeps the creator's role immutable", async () => {
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, CREATOR, "member", ADMIN)).rejects.toThrow(ValidationError);
            expect(mockMemberRepo.updateRole).not.toHaveBeenCalled();
        });

        it("refuses to demote the last owner", async () => {
            roles({ [CREATOR]: "owner", [ADMIN]: "owner", [MEMBER]: "member" });
            mockMemberRepo.countOwners.mockResolvedValue(1);
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, ADMIN, "member", CREATOR)).rejects.toThrow(ConflictError);
            expect(mockMemberRepo.updateRole).not.toHaveBeenCalled();
        });

        it("allows demoting an owner when another owner remains", async () => {
            roles({ [CREATOR]: "owner", [ADMIN]: "owner", [MEMBER]: "member" });
            mockMemberRepo.countOwners.mockResolvedValue(2);
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await useCase.execute(TEAM, ADMIN, "member", CREATOR);

            expect(mockMemberRepo.updateRole).toHaveBeenCalledWith(TEAM, ADMIN, "member");
        });

        it("is a no-op when the role already matches", async () => {
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await useCase.execute(TEAM, MEMBER, "member", CREATOR);

            expect(mockMemberRepo.updateRole).not.toHaveBeenCalled();
        });

        it("404s for a non-member target", async () => {
            roles({ [CREATOR]: "owner" });
            const useCase = new UpdateTeamMemberRoleUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, OUTSIDER, "admin", CREATOR)).rejects.toThrow(NotFoundError);
        });
    });

    describe("DeleteTeamMember", () => {
        it("lets an owner remove a regular member", async () => {
            const useCase = new DeleteTeamMemberUseCase(mockMemberRepo, mockTeamRepo);

            await useCase.execute(TEAM, MEMBER, CREATOR);

            expect(mockMemberRepo.delete).toHaveBeenCalledWith(TEAM, MEMBER);
        });

        it("lets a member leave the team themselves", async () => {
            const useCase = new DeleteTeamMemberUseCase(mockMemberRepo, mockTeamRepo);

            await useCase.execute(TEAM, MEMBER, MEMBER);

            expect(mockMemberRepo.delete).toHaveBeenCalledWith(TEAM, MEMBER);
        });

        it("prevents a member from removing somebody else", async () => {
            const useCase = new DeleteTeamMemberUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, ADMIN, MEMBER)).rejects.toThrow(ForbiddenError);
            expect(mockMemberRepo.delete).not.toHaveBeenCalled();
        });

        it("prevents removing the team creator", async () => {
            const useCase = new DeleteTeamMemberUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, CREATOR, CREATOR)).rejects.toThrow(ConflictError);
            expect(mockMemberRepo.delete).not.toHaveBeenCalled();
        });

        it("prevents removing the last owner", async () => {
            roles({ [CREATOR]: "owner", [ADMIN]: "owner" });
            mockMemberRepo.countOwners.mockResolvedValue(1);
            const useCase = new DeleteTeamMemberUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, ADMIN, CREATOR)).rejects.toThrow(ConflictError);
            expect(mockMemberRepo.delete).not.toHaveBeenCalled();
        });

        it("prevents an admin from removing an owner", async () => {
            roles({ [CREATOR]: "owner", [ADMIN]: "admin", [MEMBER]: "owner" });
            mockMemberRepo.countOwners.mockResolvedValue(2);
            const useCase = new DeleteTeamMemberUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, MEMBER, ADMIN)).rejects.toThrow(ForbiddenError);
            expect(mockMemberRepo.delete).not.toHaveBeenCalled();
        });

        it("404s for a non-member target", async () => {
            roles({ [CREATOR]: "owner" });
            const useCase = new DeleteTeamMemberUseCase(mockMemberRepo, mockTeamRepo);

            await expect(useCase.execute(TEAM, OUTSIDER, CREATOR)).rejects.toThrow(NotFoundError);
        });
    });

    describe("CheckTeamMembership", () => {
        it("answers for the caller without extra access checks", async () => {
            roles({ [MEMBER]: "member" });
            const useCase = new CheckTeamMembershipUseCase(mockMemberRepo);

            await expect(useCase.execute(TEAM, MEMBER, MEMBER)).resolves.toBe(true);
        });

        it("requires shared team membership when asking about somebody else", async () => {
            roles({ [MEMBER]: "member" });
            const useCase = new CheckTeamMembershipUseCase(mockMemberRepo);

            await expect(useCase.execute(TEAM, ADMIN, MEMBER)).resolves.toBe(false);
            await expect(useCase.execute(TEAM, ADMIN, OUTSIDER)).rejects.toThrow(ForbiddenError);
        });
    });

    describe("Invitation authorization", () => {
        const inviteeUser = new User("bob@x.io", "hash", "bob", "user", MEMBER);

        beforeEach(() => {
            // the invitee is not a member yet
            roles({ [CREATOR]: "owner", [ADMIN]: "admin" });
            mockUserRepo.findById.mockResolvedValue(inviteeUser);
            mockInviteRepo.findPendingInvite.mockResolvedValue(null);
            mockInviteRepo.create.mockResolvedValue(new TeamInvite({
                id: "inv1", team_id: TEAM, invited_user_id: MEMBER, role: "member",
                invited_by: CREATOR, status: "pending", created_at: new Date(),
            }));
        });

        it("lets an owner invite", async () => {
            const useCase = new CreateInviteUseCase(mockInviteRepo, mockMemberRepo, mockUserRepo);

            const invite = await useCase.execute({ teamId: TEAM, invitedUserId: MEMBER, role: "member", invitedBy: CREATOR });

            expect(invite.id).toBe("inv1");
            expect(mockInviteRepo.create.mock.calls[0]![0].team_id).toBe(TEAM);
            expect(mockInviteRepo.create.mock.calls[0]![0].invited_by).toBe(CREATOR);
        });

        it("lets an admin invite", async () => {
            roles({ [ADMIN]: "admin" });
            const useCase = new CreateInviteUseCase(mockInviteRepo, mockMemberRepo, mockUserRepo);

            await useCase.execute({ teamId: TEAM, invitedUserId: MEMBER, role: "member", invitedBy: ADMIN });

            expect(mockInviteRepo.create).toHaveBeenCalledTimes(1);
        });

        it("rejects a plain member", async () => {
            roles({ [MEMBER]: "member" });
            const useCase = new CreateInviteUseCase(mockInviteRepo, mockMemberRepo, mockUserRepo);

            await expect(useCase.execute({ teamId: TEAM, invitedUserId: ADMIN, role: "member", invitedBy: MEMBER }))
                .rejects.toThrow(ForbiddenError);
            expect(mockInviteRepo.create).not.toHaveBeenCalled();
        });

        it("rejects an outsider", async () => {
            const useCase = new CreateInviteUseCase(mockInviteRepo, mockMemberRepo, mockUserRepo);

            await expect(useCase.execute({ teamId: TEAM, invitedUserId: MEMBER, role: "member", invitedBy: OUTSIDER }))
                .rejects.toThrow(ForbiddenError);
        });

        it("rejects the owner role in an invitation", async () => {
            const useCase = new CreateInviteUseCase(mockInviteRepo, mockMemberRepo, mockUserRepo);

            await expect(useCase.execute({ teamId: TEAM, invitedUserId: MEMBER, role: "owner", invitedBy: CREATOR }))
                .rejects.toThrow(ValidationError);
            expect(mockInviteRepo.create).not.toHaveBeenCalled();
        });

        it("rejects inviting an existing member", async () => {
            roles({ [CREATOR]: "owner", [MEMBER]: "member" });
            const useCase = new CreateInviteUseCase(mockInviteRepo, mockMemberRepo, mockUserRepo);

            await expect(useCase.execute({ teamId: TEAM, invitedUserId: MEMBER, role: "member", invitedBy: CREATOR }))
                .rejects.toThrow(ConflictError);
        });

        it("scopes the invite to the team from the caller's team, not a foreign one", async () => {
            // creator owns TEAM only — a different teamId must not be invitable
            mockMemberRepo.getRole.mockImplementation(async (teamId: string, userId: string) =>
                teamId === TEAM && userId === CREATOR ? "owner" : null,
            );
            const useCase = new CreateInviteUseCase(mockInviteRepo, mockMemberRepo, mockUserRepo);

            await expect(useCase.execute({
                teamId: "99999999-9999-9999-9999-999999999999",
                invitedUserId: MEMBER,
                role: "member",
                invitedBy: CREATOR,
            })).rejects.toThrow(ForbiddenError);
        });
    });
});
