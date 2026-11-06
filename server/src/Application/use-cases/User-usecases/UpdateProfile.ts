import { UserRep } from "../../Repositories/UserRepository";
import { ProfileUpdate, PublicProfile } from "../../../Domain/Entities/User_Entities";
import { ConflictError, NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";
import { optionalString, requireNonEmptyString } from "../../../Shared/utils/validation";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,50}$/;
const BIO_MAX = 500;
const AVATAR_MAX = 2048;

export interface UpdateProfileInput {
    username?: unknown;
    bio?: unknown;
    avatar?: unknown;
}

/**
 * Updates the authenticated user's own profile.
 * Only an explicit allowlist of fields is read — the client can never choose the target user
 * nor inject role/password/email/id.
 */
export class UpdateUserProfile {
    constructor(private readonly userRepo: UserRep) { }

    async execute(userId: string, input: UpdateProfileInput): Promise<PublicProfile> {
        const update: ProfileUpdate = {};

        if (input.username !== undefined) {
            let username: string;
            try {
                username = requireNonEmptyString(input.username, "username", 50);
            } catch (error) {
                throw new ValidationError((error as Error).message);
            }
            if (!USERNAME_RE.test(username)) {
                throw new ValidationError("username must be 3-50 characters and may only contain letters, numbers, dot, dash or underscore");
            }
            if (await this.userRepo.existsByUsername(username, userId)) {
                throw new ConflictError("Username is already taken");
            }
            update.username = username;
        }

        if (input.bio !== undefined) {
            update.bio = optionalString(input.bio, "bio", BIO_MAX) ?? null;
        }

        if (input.avatar !== undefined) {
            const avatar = optionalString(input.avatar, "avatar", AVATAR_MAX) ?? null;
            if (avatar !== null && !/^https?:\/\//i.test(avatar)) {
                throw new ValidationError("avatar must be an absolute http(s) URL");
            }
            update.avatar = avatar;
        }

        if (Object.keys(update).length === 0) {
            throw new ValidationError("No updatable fields were provided");
        }

        const user = await this.userRepo.updateProfile(userId, update);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        return {
            user_id: user.id as string,
            username: user.username,
            email: user.email,
            bio: user.bio ?? null,
            avatar: user.avatar ?? null,
        };
    }
}
