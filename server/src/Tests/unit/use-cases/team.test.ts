import { Team } from "../../../Domain/Entities/Team";
import { CreateTeam, GetTeamsByUser, GetTeamById, DeleteTeam, UpdateTeam } from "../../../Application/use-cases/Team-usecases/Team.usecase";
import { TeamRepo } from "../../../Application/Repositories/TeamRepo";
import { ValidationError } from "../../../Domain/Errors/AppError";

// Mock TeamRepo
const mockTeamRepo: jest.Mocked<TeamRepo> = {
    create: jest.fn(),
    getTeamsByUser: jest.fn(),
    getById: jest.fn(),
    getCreatedBy: jest.fn(),
    delete: jest.fn(),
    update: jest.fn()
};

const storedTeam = (name = "Team A", owner = "user123") =>
    new Team(name, owner, null, "team-123", new Date());

describe('Team Use Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('CreateTeam', () => {
        it('persists the team and returns the stored team (owner comes from created_by)', async () => {
            mockTeamRepo.create.mockResolvedValue(storedTeam());
            const createTeam = new CreateTeam(mockTeamRepo);
            const team = new Team('Team A', 'user123', null);

            const created = await createTeam.execute(team);

            expect(mockTeamRepo.create).toHaveBeenCalledTimes(1);
            expect(mockTeamRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Team A', created_by: 'user123' }),
            );
            expect(created.id).toBe('team-123');
        });

        it('trims the name and normalises an empty description to null', async () => {
            mockTeamRepo.create.mockResolvedValue(storedTeam());
            const createTeam = new CreateTeam(mockTeamRepo);

            await createTeam.execute(new Team('   Team A   ', 'user123', '   '));

            expect(mockTeamRepo.create.mock.calls[0]![0].name).toBe('Team A');
            expect(mockTeamRepo.create.mock.calls[0]![0].description).toBeNull();
        });

        it('rejects a missing creator', async () => {
            const createTeam = new CreateTeam(mockTeamRepo);

            await expect(createTeam.execute(new Team('Team A', ''))).rejects.toThrow(ValidationError);
            expect(mockTeamRepo.create).not.toHaveBeenCalled();
        });

        it('rejects an empty or oversized name', async () => {
            const createTeam = new CreateTeam(mockTeamRepo);

            await expect(createTeam.execute(new Team('   ', 'user123'))).rejects.toThrow(ValidationError);
            await expect(createTeam.execute(new Team('x'.repeat(101), 'user123'))).rejects.toThrow(ValidationError);
            expect(mockTeamRepo.create).not.toHaveBeenCalled();
        });

        it('propagates a membership failure so the transaction can roll back', async () => {
            mockTeamRepo.create.mockRejectedValue(new Error('membership insert failed'));
            const createTeam = new CreateTeam(mockTeamRepo);

            await expect(createTeam.execute(new Team('Team A', 'user123'))).rejects.toThrow('membership insert failed');
        });
    });

    describe('GetTeamsByUser', () => {
        it('should return teams for a user', async () => {
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);
            const userId = 'user123';
            const expectedTeams = [
                new Team('Team A', userId, null, 'team-123'),
                new Team('Team B', userId, null, 'team-456')
            ];
            mockTeamRepo.getTeamsByUser.mockResolvedValue(expectedTeams);

            const result = await getTeamsByUser.execute(userId);

            expect(result).toEqual(expectedTeams);
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledWith(userId);
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledTimes(1);
        });

        it('does not embed members in the team response', async () => {
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);
            mockTeamRepo.getTeamsByUser.mockResolvedValue([storedTeam()]);

            const [team] = await getTeamsByUser.execute('user123');

            expect(team).toBeDefined();
            expect(Object.keys(team as object)).not.toContain('members');
        });

        it('should return empty array when user has no teams', async () => {
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);
            const userId = 'user123';
            mockTeamRepo.getTeamsByUser.mockResolvedValue([]);

            const result = await getTeamsByUser.execute(userId);

            expect(result).toEqual([]);
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledWith(userId);
        });

        it('rejects a missing user id', async () => {
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);

            await expect(getTeamsByUser.execute('')).rejects.toThrow(ValidationError);
        });

        it('should handle errors when getting teams by user', async () => {
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);
            const userId = 'user123';
            const error = new Error('Database error');
            mockTeamRepo.getTeamsByUser.mockRejectedValue(error);

            await expect(getTeamsByUser.execute(userId)).rejects.toThrow('Database error');
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledWith(userId);
        });
    });

    describe('GetTeamById', () => {
        it('should return a team by id', async () => {
            const getTeamById = new GetTeamById(mockTeamRepo);
            const teamId = 'team-123';
            const userId = 'user123';
            const expectedTeam = new Team('Team A', userId, null, teamId);
            mockTeamRepo.getById.mockResolvedValue(expectedTeam);

            const result = await getTeamById.execute(teamId, userId);

            expect(result).toEqual(expectedTeam);
            expect(mockTeamRepo.getById).toHaveBeenCalledWith(teamId, userId);
            expect(mockTeamRepo.getById).toHaveBeenCalledTimes(1);
        });

        it('should return null when the team is not accessible (HTTP 404 policy)', async () => {
            const getTeamById = new GetTeamById(mockTeamRepo);
            mockTeamRepo.getById.mockResolvedValue(null);

            const result = await getTeamById.execute('non-existent-team', 'user123');

            expect(result).toBeNull();
        });

        it('should handle errors when getting team by id', async () => {
            const getTeamById = new GetTeamById(mockTeamRepo);
            const error = new Error('Database error');
            mockTeamRepo.getById.mockRejectedValue(error);

            await expect(getTeamById.execute('team-123', 'user123')).rejects.toThrow('Database error');
        });
    });

    describe('DeleteTeam', () => {
        it('should delete a team successfully', async () => {
            const deleteTeam = new DeleteTeam(mockTeamRepo);

            await deleteTeam.execute('team-123', 'user123');

            expect(mockTeamRepo.delete).toHaveBeenCalledWith('team-123', 'user123');
            expect(mockTeamRepo.delete).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when deleting a team', async () => {
            const deleteTeam = new DeleteTeam(mockTeamRepo);
            const error = new Error('Database error');
            mockTeamRepo.delete.mockRejectedValue(error);

            await expect(deleteTeam.execute('team-123', 'user123')).rejects.toThrow('Database error');
        });
    });

    describe('UpdateTeam', () => {
        it('should update a team successfully', async () => {
            const updateTeam = new UpdateTeam(mockTeamRepo);
            const team = new Team('Updated Team Name', 'user123', null, 'team-123');

            await updateTeam.execute(team, 'user123');

            expect(mockTeamRepo.update).toHaveBeenCalledWith(team, 'user123');
            expect(mockTeamRepo.update).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when updating a team', async () => {
            const updateTeam = new UpdateTeam(mockTeamRepo);
            const team = new Team('Updated Team Name', 'user123', null, 'team-123');
            const error = new Error('Database error');
            mockTeamRepo.update.mockRejectedValue(error);

            await expect(updateTeam.execute(team, 'user123')).rejects.toThrow('Database error');
        });
    });
});
