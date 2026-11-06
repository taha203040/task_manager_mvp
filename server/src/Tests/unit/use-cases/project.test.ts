import { Project } from "../../../Domain/Entities/Project";
import { ProjectRepo } from "../../../Application/Repositories/ProjectRepo";
import { TeamMemberRepo } from "../../../Application/Repositories/TeamRepo";
import {
    CreateProject,
    DeleteProject,
    GetProjectById,
    ListProjects,
    UpdateProject,
} from "../../../Application/use-cases/Project-usecases/Project.usecase";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";

const mockProjectRepo = {
    create: jest.fn(),
    update: jest.fn(),
    getById: jest.fn(),
    listForUser: jest.fn(),
    delete: jest.fn(),
    canAccess: jest.fn(),
    isMember: jest.fn(),
    listMembers: jest.fn(),
} as unknown as jest.Mocked<ProjectRepo>;

const mockMemberRepo = {
    create: jest.fn(),
    getByTeamId: jest.fn(),
    getByUserId: jest.fn(),
    updateRole: jest.fn(),
    delete: jest.fn(),
    isMember: jest.fn(),
    getRole: jest.fn(),
    getByUserIdWithTeam: jest.fn(),
    searchUsers: jest.fn(),
} as unknown as jest.Mocked<TeamMemberRepo>;

const TEAM = "11111111-1111-1111-1111-111111111111";
const OWNER = "22222222-2222-2222-2222-222222222222";
const MEMBER = "33333333-3333-3333-3333-333333333333";
const OUTSIDER = "44444444-4444-4444-4444-444444444444";
const PROJECT = "55555555-5555-5555-5555-555555555555";

function existingProject(): Project {
    return new Project("Alpha", TEAM, null, "Planning", null, null, PROJECT, new Date(), new Date());
}

describe("Project use cases", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockProjectRepo.create.mockResolvedValue(existingProject());
        mockProjectRepo.getById.mockResolvedValue(existingProject());
        mockProjectRepo.listForUser.mockResolvedValue([existingProject()]);
        mockProjectRepo.listMembers.mockResolvedValue([]);
        mockProjectRepo.delete.mockResolvedValue(true);
        mockProjectRepo.update.mockResolvedValue(existingProject());
        mockProjectRepo.isMember.mockResolvedValue(false);
        mockProjectRepo.canAccess.mockResolvedValue(true);
        mockMemberRepo.getRole.mockResolvedValue(null);
    });

    describe("CreateProject", () => {
        it("creates the project for a team owner and adds the actor as a member", async () => {
            mockMemberRepo.getRole.mockResolvedValue("owner");
            const useCase = new CreateProject(mockProjectRepo, mockMemberRepo);

            await useCase.execute({ name: "  Alpha  ", team_id: TEAM, member_ids: [] }, OWNER);

            expect(mockProjectRepo.create).toHaveBeenCalledTimes(1);
            const [project, memberIds] = mockProjectRepo.create.mock.calls[0]!;
            expect(project.name).toBe("Alpha");
            expect(project.team_id).toBe(TEAM);
            expect(project.status).toBe("Planning");
            expect(memberIds).toEqual([OWNER]);
        });

        it("rejects a user who does not belong to the team", async () => {
            mockMemberRepo.getRole.mockResolvedValue(null);
            const useCase = new CreateProject(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute({ name: "Alpha", team_id: TEAM }, OUTSIDER))
                .rejects.toThrow(ForbiddenError);
            expect(mockProjectRepo.create).not.toHaveBeenCalled();
        });

        it("rejects a plain team member (BFLA)", async () => {
            mockMemberRepo.getRole.mockResolvedValue("member");
            const useCase = new CreateProject(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute({ name: "Alpha", team_id: TEAM }, MEMBER))
                .rejects.toThrow(ForbiddenError);
            expect(mockProjectRepo.create).not.toHaveBeenCalled();
        });

        it("rejects project members that do not belong to the team", async () => {
            mockMemberRepo.getRole.mockImplementation(async (_teamId, userId) =>
                userId === OWNER ? "owner" : null,
            );
            const useCase = new CreateProject(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute({ name: "Alpha", team_id: TEAM, member_ids: [OUTSIDER] }, OWNER))
                .rejects.toThrow(ValidationError);
            expect(mockProjectRepo.create).not.toHaveBeenCalled();
        });

        it("rejects an invalid status and inverted dates", async () => {
            mockMemberRepo.getRole.mockResolvedValue("owner");
            const useCase = new CreateProject(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute({ name: "Alpha", team_id: TEAM, status: "Nope" }, OWNER))
                .rejects.toThrow(ValidationError);

            await expect(useCase.execute({
                name: "Alpha",
                team_id: TEAM,
                start_date: "2024-05-10",
                due_date: "2024-05-01",
            }, OWNER)).rejects.toThrow(ValidationError);
        });
    });

    describe("ListProjects", () => {
        it("filters by team for a member", async () => {
            mockMemberRepo.getRole.mockResolvedValue("member");
            const useCase = new ListProjects(mockProjectRepo, mockMemberRepo);

            await useCase.execute(MEMBER, TEAM);

            expect(mockProjectRepo.listForUser).toHaveBeenCalledWith(MEMBER, TEAM);
        });

        it("refuses to filter on a team the user does not belong to", async () => {
            const useCase = new ListProjects(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute(OUTSIDER, TEAM)).rejects.toThrow(ForbiddenError);
            expect(mockProjectRepo.listForUser).not.toHaveBeenCalled();
        });
    });

    describe("GetProjectById", () => {
        it("returns the project with its members", async () => {
            mockProjectRepo.listMembers.mockResolvedValue([
                { user_id: MEMBER, username: "bob", email: "bob@x.io", role: "member", created_at: new Date() },
            ]);
            const useCase = new GetProjectById(mockProjectRepo);

            const project = await useCase.execute(PROJECT, MEMBER);

            expect(project.id).toBe(PROJECT);
            expect(project.members).toHaveLength(1);
        });

        it("hides a project the user cannot access", async () => {
            mockProjectRepo.canAccess.mockResolvedValue(false);
            mockMemberRepo.getRole.mockResolvedValue(null);
            const useCase = new GetProjectById(mockProjectRepo);

            await expect(useCase.execute(PROJECT, OUTSIDER)).rejects.toThrow(NotFoundError);
        });

        it("returns 404 for a missing project", async () => {
            mockProjectRepo.getById.mockResolvedValue(null);
            const useCase = new GetProjectById(mockProjectRepo);

            await expect(useCase.execute(PROJECT, MEMBER)).rejects.toThrow(NotFoundError);
        });
    });

    describe("UpdateProject", () => {
        it("rejects team changes", async () => {
            mockMemberRepo.getRole.mockResolvedValue("owner");
            const useCase = new UpdateProject(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute(PROJECT, { team_id: "66666666-6666-6666-6666-666666666666" }, OWNER))
                .rejects.toThrow(ValidationError);
            expect(mockProjectRepo.update).not.toHaveBeenCalled();
        });

        it("rejects a non-privileged member", async () => {
            mockMemberRepo.getRole.mockResolvedValue("member");
            const useCase = new UpdateProject(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute(PROJECT, { name: "Beta" }, MEMBER)).rejects.toThrow(ForbiddenError);
        });

        it("leaves memberships untouched when member_ids is omitted", async () => {
            mockMemberRepo.getRole.mockResolvedValue("admin");
            const useCase = new UpdateProject(mockProjectRepo, mockMemberRepo);

            await useCase.execute(PROJECT, { name: "Beta" }, OWNER);

            const [project, memberIds] = mockProjectRepo.update.mock.calls[0]!;
            expect(project.name).toBe("Beta");
            expect(memberIds).toBeNull();
        });

        it("replaces memberships with validated team members", async () => {
            mockMemberRepo.getRole.mockImplementation(async (_teamId, userId) =>
                userId === OUTSIDER ? null : "owner",
            );
            const useCase = new UpdateProject(mockProjectRepo, mockMemberRepo);

            await useCase.execute(PROJECT, { member_ids: [MEMBER] }, OWNER);

            const [, memberIds] = mockProjectRepo.update.mock.calls[0]!;
            expect(memberIds).toEqual([OWNER, MEMBER]);
        });
    });

    describe("DeleteProject", () => {
        it("deletes for a team admin", async () => {
            mockMemberRepo.getRole.mockResolvedValue("admin");
            const useCase = new DeleteProject(mockProjectRepo, mockMemberRepo);

            await useCase.execute(PROJECT, OWNER);

            expect(mockProjectRepo.delete).toHaveBeenCalledWith(PROJECT);
        });

        it("refuses for a plain member", async () => {
            mockMemberRepo.getRole.mockResolvedValue("member");
            const useCase = new DeleteProject(mockProjectRepo, mockMemberRepo);

            await expect(useCase.execute(PROJECT, MEMBER)).rejects.toThrow(ForbiddenError);
            expect(mockProjectRepo.delete).not.toHaveBeenCalled();
        });
    });
});
