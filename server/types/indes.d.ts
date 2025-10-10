declare namespace Express {
    export interface Request {
        user?: {
            id: string
            email: string
            username: string
            role?: string
            iat: number
            exp?: number
        }
    }
}