import { CommentRepo } from "../../../Application/Repositories/CommentRepo";
import { AttachmentRepo } from "../../../Application/Repositories/AttachmentRepo";
import { ActivityRepo } from "../../../Application/Repositories/ActivityRepo";
import { TaskRepo } from "../../../Application/Repositories/Task_Repo";
import { ProjectRepo } from "../../../Application/Repositories/ProjectRepo";
import { TeamMemberRepo } from "../../../Application/Repositories/TeamRepo";
import { ITeamInviteRepository } from "../../../Application/Repositories/Team_invites";
import { UserRep } from "../../../Application/Repositories/UserRepository";
import { Task, TaskPriority, TaskStatus } from "../../../Domain/Entities/Task";
import { TaskAttachment, TaskComment } from "../../../Domain/Entities/Collaboration";
import { ActivityLog } from "../../../Domain/Entities/Activity";
import { TeamInvite } from "../../../Domain/Entities/Invites";
import { User } from "../../../Domain/Entities/User_Entities";
import {
    AddTaskAttachment,
    AddTaskComment,
    DeleteTaskAttachment,
    GetTaskComments,
} from "../../../Application/use-cases/Task_usecases/TaskCollaboration.usecase";
import { TaskAssigneePolicy } from "../../../Application/use-cases/Task_usecases/TaskAssigneePolicy";
import { GetUserActivity, MarkActivityRead } from "../../../Application/use-cases/Activity-usecases/Activity.usecase";
import { UpdateUserProfile } from "../../../Application/use-cases/User-usecases/UpdateProfile";
import { AcceptInviteUseCase, RejectInviteUseCase } from "../../../Application/use-cases/Team-usecases/Invite.usecase";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";

const mockTaskRepo = {
    create: jest.fn(),
    getTasksByUser: jest.fn(),
    getById: jest.fn(),
    canAccess: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
} as unknown as jest.Mocked<TaskRepo>;

const mockCommentRepo = {
    create: jest.fn(),
    listByTask: jest.fn(),
} as unknown as jest.Mocked<CommentRepo>;

const mockAttachmentRepo = {
    create: jest.fn(),
    getById: jest.fn(),
    getByTaskAndId: jest.fn(),
    listByTask: jest.fn(),
    delete: jest.fn(),
} as unknown as jest.Mocked<AttachmentRepo>;

const mockActivityRepo = {
    listForUser: jest.fn(),
    markAllRead: jest.fn(),
    markRead: jest.fn(),
    record: jest.fn(),
} as unknown as jest.Mocked<ActivityRepo>;

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

const mockUserRepo = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    existsByUsername: jest.fn(),
    updateProfile: jest.fn(),
} as unknown as jest.Mocked<UserRep>;

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

const TASK = "11111111-1111-1111-1111-111111111111";
const PROJECT = "22222222-2222-2222-2222-222222222222";
const TEAM = "33333333-3333-3333-3333-333333333333";
const ACTOR = "44444444-4444-4444-4444-444444444444";
const OTHER = "55555555-5555-5555-5555-555555555555";
const ATTACHMENT = "66666666-6666-6666-6666-666666666666";

function sampleTask(overrides: Partial<Task> = {}): Task {
    return Object.assign(new Task(
        "Fix login",
        null,
        TaskPriority.MEDIUM,
        null,
        TaskStatus.TODO,
        ACTOR,
        PROJECT,
        TASK,
    ), overrides);
}

describe("Task collaboration use cases", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockTaskRepo.canAccess.mockResolvedValue(true);
        mockTaskRepo.getById.mockResolvedValue(sampleTask());
    });

    describe("comments", () => {
        it("returns comments in the documented contract shape", async () => {
            mockCommentRepo.listByTask.mockResolvedValue([
                new TaskComment("hello", TASK, OTHER, "c1", new Date("2024-01-01T00:00:00Z"), "bob"),
            ]);
            const useCase = new GetTaskComments(mockCommentRepo, mockTaskRepo);

            const comments = await useCase.execute(TASK, ACTOR);

            expect(comments).toEqual([{
                id: "c1",
                author: { user_id: OTHER, username: "bob" },
                text: "hello",
                date: "2024-01-01T00:00:00.000Z",
            }]);
        });

        it("denies access when the user cannot see the task", async () => {
            mockTaskRepo.canAccess.mockResolvedValue(false);
            const useCase = new GetTaskComments(mockCommentRepo, mockTaskRepo);

            await expect(useCase.execute(TASK, OTHER)).rejects.toThrow(ForbiddenError);
            expect(mockCommentRepo.listByTask).not.toHaveBeenCalled();
        });

        it("always uses the authenticated user as the author", async () => {
            mockCommentRepo.create.mockImplementation(async (comment: TaskComment) =>
                new TaskComment(comment.text, comment.task_id, comment.author_id, "c2", new Date(), "actor"),
            );
            const useCase = new AddTaskComment(mockCommentRepo, mockTaskRepo, mockActivityRepo);

            const comment = await useCase.execute(TASK, ACTOR, "  a real comment  ");

            expect(mockCommentRepo.create).toHaveBeenCalledTimes(1);
            const created = mockCommentRepo.create.mock.calls[0]![0];
            expect(created.author_id).toBe(ACTOR);
            expect(created.text).toBe("a real comment");
            expect(comment.id).toBe("c2");
        });

        it("rejects empty comment content", async () => {
            const useCase = new AddTaskComment(mockCommentRepo, mockTaskRepo, mockActivityRepo);

            await expect(useCase.execute(TASK, ACTOR, "   ")).rejects.toThrow(ValidationError);
            expect(mockCommentRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("attachments", () => {
        it("rejects non http(s) urls", async () => {
            const useCase = new AddTaskAttachment(mockAttachmentRepo, mockTaskRepo);

            await expect(useCase.execute(TASK, ACTOR, { name: "a.pdf", url: "javascript:alert(1)" }))
                .rejects.toThrow(ValidationError);
            expect(mockAttachmentRepo.create).not.toHaveBeenCalled();
        });

        it("creates the attachment for an authorized user", async () => {
            mockAttachmentRepo.create.mockResolvedValue(
                new TaskAttachment("a.pdf", "https://x.io/a.pdf", TASK, ACTOR, ATTACHMENT, new Date()),
            );
            const useCase = new AddTaskAttachment(mockAttachmentRepo, mockTaskRepo);

            const attachment = await useCase.execute(TASK, ACTOR, { name: "a.pdf", url: "https://x.io/a.pdf" });

            expect(attachment.id).toBe(ATTACHMENT);
            expect(mockAttachmentRepo.create.mock.calls[0]![0].task_id).toBe(TASK);
        });

        it("does not delete an attachment that belongs to another task", async () => {
            mockAttachmentRepo.getByTaskAndId.mockResolvedValue(null);
            const useCase = new DeleteTaskAttachment(mockAttachmentRepo, mockTaskRepo);

            await expect(useCase.execute(TASK, ATTACHMENT, ACTOR)).rejects.toThrow(NotFoundError);
            expect(mockAttachmentRepo.delete).not.toHaveBeenCalled();
        });

        it("deletes a scoped attachment", async () => {
            mockAttachmentRepo.getByTaskAndId.mockResolvedValue(
                new TaskAttachment("a.pdf", "https://x.io/a.pdf", TASK, ACTOR, ATTACHMENT),
            );
            mockAttachmentRepo.delete.mockResolvedValue(true);
            const useCase = new DeleteTaskAttachment(mockAttachmentRepo, mockTaskRepo);

            await useCase.execute(TASK, ATTACHMENT, ACTOR);

            expect(mockAttachmentRepo.delete).toHaveBeenCalledWith(TASK, ATTACHMENT);
        });
    });
});

describe("TaskAssigneePolicy", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockProjectRepo.isMember.mockResolvedValue(false);
        mockProjectRepo.getById.mockResolvedValue({
            team_id: TEAM,
        } as never);
        mockMemberRepo.getRole.mockResolvedValue(null);
    });

    it("accepts an explicit project member", async () => {
        mockProjectRepo.isMember.mockResolvedValue(true);
        const policy = new TaskAssigneePolicy(mockProjectRepo, mockMemberRepo);

        await expect(policy.assertAssignable(sampleTask(), OTHER)).resolves.toBeUndefined();
    });

    it("accepts a team member of the project's team", async () => {
        mockMemberRepo.getRole.mockResolvedValue("member");
        const policy = new TaskAssigneePolicy(mockProjectRepo, mockMemberRepo);

        await expect(policy.assertAssignable(sampleTask(), OTHER)).resolves.toBeUndefined();
    });

    it("rejects an unrelated user", async () => {
        const policy = new TaskAssigneePolicy(mockProjectRepo, mockMemberRepo);

        await expect(policy.assertAssignable(sampleTask(), OTHER)).rejects.toThrow(ForbiddenError);
    });

    it("only allows the creator to be assigned on project-less tasks", async () => {
        const policy = new TaskAssigneePolicy(mockProjectRepo, mockMemberRepo);
        const task = sampleTask({ project_id: undefined });

        await expect(policy.assertAssignable(task, OTHER)).rejects.toThrow(ValidationError);
        await expect(policy.assertAssignable(task, ACTOR)).resolves.toBeUndefined();
    });
});

describe("Activity use cases", () => {
    beforeEach(() => jest.clearAllMocks());

    it("maps activity to the documented contract", async () => {
        mockActivityRepo.listForUser.mockResolvedValue([
            new ActivityLog("A task was assigned to you", "TASK_ASSIGNED", ACTOR, "a1", PROJECT, TASK, false, new Date("2024-01-02T03:04:05Z")),
        ]);
        const useCase = new GetUserActivity(mockActivityRepo);

        const activity = await useCase.execute(ACTOR);

        expect(activity).toEqual([{
            id: "a1",
            text: "A task was assigned to you",
            date: "2024-01-02T03:04:05.000Z",
            projectId: PROJECT,
            read: false,
        }]);
        expect(mockActivityRepo.listForUser).toHaveBeenCalledWith(ACTOR, 50);
    });

    it("clamps the limit and always scopes to the caller", async () => {
        mockActivityRepo.listForUser.mockResolvedValue([]);
        const useCase = new GetUserActivity(mockActivityRepo);

        await useCase.execute(ACTOR, 5000);

        expect(mockActivityRepo.listForUser).toHaveBeenCalledWith(ACTOR, 100);
    });

    it("marks all activity read when no ids are given", async () => {
        mockActivityRepo.markAllRead.mockResolvedValue(3);
        const useCase = new MarkActivityRead(mockActivityRepo);

        await expect(useCase.execute(ACTOR)).resolves.toBe(3);
        expect(mockActivityRepo.markAllRead).toHaveBeenCalledWith(ACTOR);
        expect(mockActivityRepo.markRead).not.toHaveBeenCalled();
    });
});

describe("UpdateUserProfile", () => {
    const user = new User("a@b.io", "hash", "alice", "user", ACTOR, "old bio", null);

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepo.existsByUsername.mockResolvedValue(false);
        mockUserRepo.updateProfile.mockResolvedValue(new User("a@b.io", "hash", "alice2", "user", ACTOR, "hi", "https://x.io/a.png"));
    });

    it("updates only the authenticated user and ignores any client-supplied id", async () => {
        const useCase = new UpdateUserProfile(mockUserRepo);

        const profile = await useCase.execute(ACTOR, {
            username: "alice2",
            bio: "hi",
            avatar: "https://x.io/a.png",
            user_id: OTHER,
            role: "admin",
        } as never);

        expect(mockUserRepo.updateProfile).toHaveBeenCalledWith(ACTOR, {
            username: "alice2",
            bio: "hi",
            avatar: "https://x.io/a.png",
        });
        expect(profile).toEqual({
            user_id: ACTOR,
            username: "alice2",
            email: "a@b.io",
            bio: "hi",
            avatar: "https://x.io/a.png",
        });
    });

    it("rejects a duplicate username", async () => {
        mockUserRepo.existsByUsername.mockResolvedValue(true);
        const useCase = new UpdateUserProfile(mockUserRepo);

        await expect(useCase.execute(ACTOR, { username: "taken" })).rejects.toThrow(ConflictError);
        expect(mockUserRepo.updateProfile).not.toHaveBeenCalled();
    });

    it("rejects an invalid username, avatar url or empty payload", async () => {
        const useCase = new UpdateUserProfile(mockUserRepo);

        await expect(useCase.execute(ACTOR, { username: "a" })).rejects.toThrow(ValidationError);
        await expect(useCase.execute(ACTOR, { avatar: "not-a-url" })).rejects.toThrow(ValidationError);
        await expect(useCase.execute(ACTOR, {})).rejects.toThrow(ValidationError);
    });

    void user;
});

describe("Invitation response", () => {
    const pendingInvite = (overrides: Partial<TeamInvite> = {}): TeamInvite =>
        Object.assign(new TeamInvite({
            id: "inv1",
            team_id: TEAM,
            invited_user_id: OTHER,
            role: "member",
            invited_by: ACTOR,
            status: "pending",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 86_400_000),
        }), overrides);

    beforeEach(() => jest.clearAllMocks());

    it("refuses an invitee mismatch (BOLA)", async () => {
        mockInviteRepo.findById.mockResolvedValue(pendingInvite());
        const useCase = new AcceptInviteUseCase(mockInviteRepo);

        await expect(useCase.execute("inv1", ACTOR)).rejects.toThrow(ForbiddenError);
        expect(mockInviteRepo.acceptAsInvitee).not.toHaveBeenCalled();
    });

    it("accepts a pending invite for the intended invitee", async () => {
        mockInviteRepo.findById.mockResolvedValue(pendingInvite());
        mockInviteRepo.acceptAsInvitee.mockResolvedValue(pendingInvite({ status: "accepted" }));
        const useCase = new AcceptInviteUseCase(mockInviteRepo);

        const result = await useCase.execute("inv1", OTHER);

        expect(result.status).toBe("accepted");
        expect(mockInviteRepo.acceptAsInvitee).toHaveBeenCalledWith("inv1", OTHER);
    });

    it("is idempotent for an already accepted invite", async () => {
        mockInviteRepo.findById.mockResolvedValue(pendingInvite({ status: "accepted" }));
        const useCase = new AcceptInviteUseCase(mockInviteRepo);

        const result = await useCase.execute("inv1", OTHER);

        expect(result.status).toBe("accepted");
        expect(mockInviteRepo.acceptAsInvitee).not.toHaveBeenCalled();
    });

    it("rejects an expired invite", async () => {
        mockInviteRepo.findById.mockResolvedValue(pendingInvite({ expires_at: new Date(Date.now() - 1000) }));
        const useCase = new AcceptInviteUseCase(mockInviteRepo);

        await expect(useCase.execute("inv1", OTHER)).rejects.toThrow(ConflictError);
        expect(mockInviteRepo.acceptAsInvitee).not.toHaveBeenCalled();
    });

    it("declines only the invitee's own pending invite", async () => {
        mockInviteRepo.findById.mockResolvedValue(pendingInvite());
        mockInviteRepo.updateStatus.mockResolvedValue(pendingInvite({ status: "rejected" }));
        const useCase = new RejectInviteUseCase(mockInviteRepo);

        await expect(useCase.execute("inv1", ACTOR)).rejects.toThrow(ForbiddenError);

        const result = await useCase.execute("inv1", OTHER);
        expect(result.status).toBe("rejected");
    });
});
