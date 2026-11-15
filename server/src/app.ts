import express, { type Request, type Response } from 'express';
// import { connectMongodb, getDb } from './Infrastructure/Repositories/mongoDb/mongoClient';
import userRouter from './Interfaces/http/Routes/user.routes';
import authrouter from './Interfaces/http/Routes/auth.routes';
// import filerouter from './Interfaces/http/Routes/file.routes';
import inviteRouter from './Interfaces/http/Routes/Invites.routes';
import rateLimit from 'express-rate-limit';
import taskrouter from './Interfaces/http/Routes/task.routes';
import teamrouter from './Interfaces/http/Routes/Team.routes';
import memberRouter from './Interfaces/http/Routes/memebers.routes';
import projectRouter from './Interfaces/http/Routes/project.routes';
import activityRouter from './Interfaces/http/Routes/activity.routes';
import cors from "cors";
import config from './Config/envs';
import cookieParser from 'cookie-parser'
const app = express();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false
})
app.set('trust proxy', 1);   // needed so rate-limit sees the real IP on Vercel
app.use(limiter);           // you created the limiter but never applied it
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:8080",  // set CLIENT_URL on Vercel to your frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));
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
    console.log('server running')
});
console.log('serer running')
export default app