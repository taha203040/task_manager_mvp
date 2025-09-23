import { Team } from "../../../Domain/Entities/Team";
import { User } from "../../../Domain/Entities/User_Entities";
import { Task, TaskPriority, TaskStatus } from "../../../Domain/Entities/Task";

describe('test for user test', () => {
    it('it should return all data of the user ', async () => {
        {
            const user = new User('taha@gmail.com', 'ahmedddd', 'user155', 'admin')
            expect(user.role).toBe('admin')
            expect(user.email).toBe('taha@gmail.com')
            expect(user.username).toBe('user155')
            expect(user.password).toBe('ahmedddd')
        }
    })
})
describe('test for tasks', () => {
    it('is should return the taks values ', () => {
        const task = new Task(
            'Complete project documentation',
            'Write comprehensive documentation for the new feature',
            TaskPriority.MEDIUM,
            new Date('2024-12-31'),
            TaskStatus.IN_PROGRESS,
            'user123',
            'project456',
            'task789',
            new Date('2024-01-15'),
            new Date('2024-01-01')
        )
        expect(task.title).toBe('Complete project documentation')
        expect(task.description).toBe('Write comprehensive documentation for the new feature')
        expect(task.priority).toBe(TaskPriority.MEDIUM)
        expect(task.status).toBe(TaskStatus.IN_PROGRESS)
        expect(task.id).toBe('task789')
        expect(task.due_date).toEqual(new Date('2024-12-31'))
        expect(task.user_id).toBe('user123')
        expect(task.project_id).toBe('project456')
        expect(task.updated_at).toEqual(new Date('2024-01-15'))
        expect(task.created_at).toEqual(new Date('2024-01-01'))
    })
    it('it should return false return false', () => {
        const task = new Task(
            'Complete project documentation',
            'Write comprehensive documentation for the new feature',
            TaskPriority.MEDIUM,
            new Date('2024-12-31'),
            TaskStatus.IN_PROGRESS,
            'user123',
            'project456',
            'task789',
            new Date('2024-01-15'),
            new Date('2024-01-01')
        )
        expect(task.title).toBe('Incomplete project documentation')
        expect(task.description).toBe('Write minimal documentation for the old feature')
        expect(task.priority).toBe(TaskPriority.HIGH)
        expect(task.status).toBe(TaskStatus.COMPLETED)
        expect(task.id).toBe('task000')
        expect(task.due_date).toEqual(new Date('2023-12-31'))
        expect(task.user_id).toBe('user000')
        expect(task.project_id).toBe('project000')
        expect(task.updated_at).toEqual(new Date('2023-01-15'))
        expect(task.created_at).toEqual(new Date('2023-01-01'))
    })
})