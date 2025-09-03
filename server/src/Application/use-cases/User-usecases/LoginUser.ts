import { UserRep } from "../../../Domain/Repositories/UserRepository";
import { JwtRepo } from "../../../Domain/Repositories/jwtRepoDef";
import bcrypt from "bcrypt";

export class LoginUser {
    constructor(
        private userRepo: UserRep,
        private jwt?: JwtRepo
    ) { }

    async execute(email: string, password: string) {
        // 1. Find user
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new Error("User not found");
        }

        // 2. Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }

        // 3. Generate JWT token

        // 4. Return safe user data + token
        return {
            id: user.id,
            email: user.email,

        };
    }
}
