import express, { type Request, type Response } from 'express';
import userRouter from './Interfaces/http/Routes/user.routes';
import authrouter from './Interfaces/http/Routes/auth.routes';
import inviteRouter from './Interfaces/http/Routes/Invites.routes';
import taskrouter from './Interfaces/http/Routes/task.routes';
import teamrouter from './Interfaces/http/Routes/Team.routes';
import memberRouter from './Interfaces/http/Routes/memebers.routes';
import projectRouter from './Interfaces/http/Routes/project.routes';
import activityRouter from './Interfaces/http/Routes/activity.routes';
import cors from "cors";
import config from './Config/envs';
import cookieParser from 'cookie-parser';
import { createAuthLimiter, createGlobalLimiter } from './Interfaces/http/middlewares/rateLimiters';

const app = express();

// The deployment has exactly one trusted reverse-proxy hop. Getting this wrong lets a
// client forge X-Forwarded-For and rotate rate-limit buckets (TM-02, TM-14).
app.set('trust proxy', config.app.trustProxyHops);
app.disable('x-powered-by');

// Broad per-IP ceiling first, so even unauthenticated floods are bounded.
app.use(createGlobalLimiter());
app.use(express.json({ limit: '128kb' }));
app.use(cookieParser());
app.use(cors({
    origin: config.app.corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));

// Strict ceiling on the credential endpoints. Mounted before the routers that own
// these paths; skipSuccessfulRequests keeps normal logins from consuming the budget.
const authLimiter = createAuthLimiter();
app.use('/api/v1/users/signin', authLimiter);
app.use('/api/v1/users/register', authLimiter);

app.use('/api/v1/members/', memberRouter)
app.use('/api/v1/auth/', authrouter)
app.use('/api/v1/tasks/', taskrouter);
app.use('/api/v1/users/', userRouter);
app.use('/api/v1/teams/', teamrouter);
app.use('/api/v1/invites/', inviteRouter)
app.use('/api/v1/projects/', projectRouter)
app.use('/api/v1/activity', activityRouter)

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World');
});

// Only bind a port when run directly. Importing the app (tests, tooling) must not
// start a listener, which would make the module impossible to exercise in-process.
if (require.main === module) {
    const PORT = config.app.port;
    app.listen(PORT, () => console.log('Server running', PORT));
}

export default app;
