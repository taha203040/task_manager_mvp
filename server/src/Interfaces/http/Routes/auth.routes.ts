import Router from 'express'
import { authenticate } from '../middlewares/authMiddleware'
import { cookie } from 'express-validator'
const authrouter = Router()


authrouter.get('/verify', authenticate, (req, res) => {
    res.status(200).json({ msg: "done" })
})
authrouter.get('/logout', (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
            path: "/"
            ,
        })
        return res.status(200).json({
            msg: "logged out done"
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            msg: "error while logout"
        })
    }
})
export default authrouter