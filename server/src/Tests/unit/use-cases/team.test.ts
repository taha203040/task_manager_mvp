import { Team } from "../../../Domain/Entities/Team";
import { CreateTeam, GetTeamsByUser, GetTeamById, DeleteTeam, UpdateTeam } from "../../../Application/use-cases/Team-usecases/Team.usecase";
import { TeamRepo } from "../../../Application/Repositories/TeamRepo";

// Mock TeamRepo
const mockTeamRepo: jest.Mocked<TeamRepo> = {
    create: jest.fn(),
    getTeamsByUser: jest.fn(),
    getById: jest.fn(),
    delete: jest.fn(),
    update: jest.fn()
};

describe('Team Use Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('CreateTeam', () => {
        it('should create a team successfully', async () => {
            // Arrange
            const createTeam = new CreateTeam(mockTeamRepo);
            const team = new Team('Team A', 'user123', 'team-123');
            
            // Act
            await createTeam.execute(team);

            // Assert
            expect(mockTeamRepo.create).toHaveBeenCalledWith(team);
            expect(mockTeamRepo.create).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when creating a team', async () => {
            // Arrange
            const createTeam = new CreateTeam(mockTeamRepo);
            const team = new Team('Team A', 'user123', 'team-123');
            const error = new Error('Database error');
            mockTeamRepo.create.mockRejectedValue(error);

            // Act & Assert
            await expect(createTeam.execute(team)).rejects.toThrow('Database error');
            expect(mockTeamRepo.create).toHaveBeenCalledWith(team);
        });
    });

    describe('GetTeamsByUser', () => {
        it('should return teams for a user', async () => {
            // Arrange
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);
            const userId = 'user123';
            const expectedTeams = [
                new Team('Team A', userId, 'team-123'),
                new Team('Team B', userId, 'team-456')
            ];
            mockTeamRepo.getTeamsByUser.mockResolvedValue(expectedTeams);

            // Act
            const result = await getTeamsByUser.execute(userId);

            // Assert
            expect(result).toEqual(expectedTeams);
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledWith(userId);
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledTimes(1);
        });

        it('should return empty array when user has no teams', async () => {
            // Arrange
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);
            const userId = 'user123';
            mockTeamRepo.getTeamsByUser.mockResolvedValue([]);

            // Act
            const result = await getTeamsByUser.execute(userId);

            // Assert
            expect(result).toEqual([]);
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledWith(userId);
        });

        it('should handle errors when getting teams by user', async () => {
            // Arrange
            const getTeamsByUser = new GetTeamsByUser(mockTeamRepo);
            const userId = 'user123';
            const error = new Error('Database error');
            mockTeamRepo.getTeamsByUser.mockRejectedValue(error);

            // Act & Assert
            await expect(getTeamsByUser.execute(userId)).rejects.toThrow('Database error');
            expect(mockTeamRepo.getTeamsByUser).toHaveBeenCalledWith(userId);
        });
    });

    describe('GetTeamById', () => {
        it('should return a team by id', async () => {
            // Arrange
            const getTeamById = new GetTeamById(mockTeamRepo);
            const teamId = 'team-123';
            const userId = 'user123';
            const expectedTeam = new Team('Team A', userId, teamId);
            mockTeamRepo.getById.mockResolvedValue(expectedTeam);

            // Act
            const result = await getTeamById.execute(teamId, userId);

            // Assert
            expect(result).toEqual(expectedTeam);
            expect(mockTeamRepo.getById).toHaveBeenCalledWith(teamId, userId);
            expect(mockTeamRepo.getById).toHaveBeenCalledTimes(1);
        });

        it('should return null when team is not found', async () => {
            // Arrange
            const getTeamById = new GetTeamById(mockTeamRepo);
            const teamId = 'non-existent-team';
            const userId = 'user123';
            mockTeamRepo.getById.mockResolvedValue(null);

            // Act
            const result = await getTeamById.execute(teamId, userId);

            // Assert
            expect(result).toBeNull();
            expect(mockTeamRepo.getById).toHaveBeenCalledWith(teamId, userId);
        });

        it('should handle errors when getting team by id', async () => {
            // Arrange
            const getTeamById = new GetTeamById(mockTeamRepo);
            const teamId = 'team-123';
            const userId = 'user123';
            const error = new Error('Database error');
            mockTeamRepo.getById.mockRejectedValue(error);

            // Act & Assert
            await expect(getTeamById.execute(teamId, userId)).rejects.toThrow('Database error');
            expect(mockTeamRepo.getById).toHaveBeenCalledWith(teamId, userId);
        });
    });

    describe('DeleteTeam', () => {
        it('should delete a team successfully', async () => {
            // Arrange
            const deleteTeam = new DeleteTeam(mockTeamRepo);
            const teamId = 'team-123';
            const userId = 'user123';

            // Act
            await deleteTeam.execute(teamId, userId);

            // Assert
            expect(mockTeamRepo.delete).toHaveBeenCalledWith(teamId, userId);
            expect(mockTeamRepo.delete).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when deleting a team', async () => {
            // Arrange
            const deleteTeam = new DeleteTeam(mockTeamRepo);
            const teamId = 'team-123';
            const userId = 'user123';
            const error = new Error('Database error');
            mockTeamRepo.delete.mockRejectedValue(error);

            // Act & Assert
            await expect(deleteTeam.execute(teamId, userId)).rejects.toThrow('Database error');
            expect(mockTeamRepo.delete).toHaveBeenCalledWith(teamId, userId);
        });
    });

    describe('UpdateTeam', () => {
        it('should update a team successfully', async () => {
            // Arrange
            const updateTeam = new UpdateTeam(mockTeamRepo);
            const team = new Team('Updated Team Name', 'user123', 'team-123');
            const userId = 'user123';

            // Act
            await updateTeam.execute(team, userId);

            // Assert
            expect(mockTeamRepo.update).toHaveBeenCalledWith(team, userId);
            expect(mockTeamRepo.update).toHaveBeenCalledTimes(1);
        });

        it('should handle errors when updating a team', async () => {
            // Arrange
            const updateTeam = new UpdateTeam(mockTeamRepo);
            const team = new Team('Updated Team Name', 'user123', 'team-123');
            const userId = 'user123';
            const error = new Error('Database error');
            mockTeamRepo.update.mockRejectedValue(error);

            // Act & Assert
            await expect(updateTeam.execute(team, userId)).rejects.toThrow('Database error');
            expect(mockTeamRepo.update).toHaveBeenCalledWith(team, userId);
        });
    });
});