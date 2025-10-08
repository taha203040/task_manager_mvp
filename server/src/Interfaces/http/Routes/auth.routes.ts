import Router from 'express'
import { authenticate } from '../middlewares/authMiddleware'
const authrouter = Router()


authrouter.get('/verify', authenticate, (req, res) => {
    res.status(200).json({ msg: "done" })
})
export default authrouter