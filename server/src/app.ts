import express, { type Request, type Response } from 'express';
import { connectMongodb, getDb } from './Infrastructure/database/mongoDb/mongoClient';
import userRouter from './Interfaces/http/Routes/user.routes';
import filerouter from './Interfaces/http/Routes/file.routes';
const app = express();
import rateLimit from 'express-rate-limit';

const limmiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false
})
app.use(express.json());
app.use('/api/v1/users', userRouter);
app.use('/api/v1/files', filerouter);

async function startServer() {
    await connectMongodb("mongodb://localhost:27017/", "mydb");
    app.listen(3000, () => console.log('Server running on port 3000'));
}

startServer().catch(err => {
    console.error("Failed to start server:", err);
});
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World');
});
app.use('/users', userRouter);


app.listen(3000, () => console.log('Server running'));
