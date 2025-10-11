declare namespace Express {
    export interface Request {
        user?: {
            email: string
            username: string
            user_id: string
            role?: string
            iat: number
            exp?: number
        }
    }
}