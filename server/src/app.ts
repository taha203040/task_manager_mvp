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

// Liveness probe for the platform. Deliberately mounted BEFORE the rate limiters:
// a throttled instance must still answer the health check, otherwise the platform
// marks it dead and restarts it instead of shedding load. No auth, no database.
app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

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
// The `typeof` guard is required because Nitro bundles this file as ESM for the
// Vercel function, where bare `require`/`module` would throw at import time and
// take the whole SSR function down with them.
const isDirectRun = typeof require !== 'undefined' && require.main === module;

if (isDirectRun) {
    const PORT = Number(process.env.PORT) || config.app.port;
    // Bind all interfaces: the platform's router reaches the container over its
    // private network, so a loopback-only listener is unreachable.
    app.listen(PORT, '0.0.0.0', () => console.log('Server running', PORT));
}

export default app;
