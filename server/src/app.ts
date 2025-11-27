import express, { type Request, type Response } from 'express';
// import { connectMongodb, getDb } from './Infrastructure/Repositories/mongoDb/mongoClient';
import userRouter from './Interfaces/http/Routes/user.routes';
import authrouter from './Interfaces/http/Routes/auth.routes';
// import filerouter from './Interfaces/http/Routes/file.routes';
import inviteRouter from './Interfaces/http/Routes/Invites.routes';
import rateLimit from 'express-rate-limit';
import taskrouter from './Interfaces/http/Routes/task.routes';
import teamrouter from './Interfaces/http/Routes/Team.routes';
import cors from "cors";
import cookieParser from 'cookie-parser'
const app = express();
const limmiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false
})
app.use(express.json());
app.use(cookieParser())
app.use(cors());
app.use('/api/v1/auth/', authrouter)
app.use('/api/v1/tasks/', taskrouter);
app.use('/api/v1/users/', userRouter);
app.use('/api/v1/teams/', teamrouter);
app.use('/api/v1/invites/', inviteRouter)
const port = 4000

console.log('serer running')
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World');
    console.log('serer running')

});


app.listen(port, () => console.log('Server running'));
