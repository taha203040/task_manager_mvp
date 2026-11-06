import { Request, Response } from "express";
import pool from "../../../Config/db";
import { ActivityRepoPostgress } from "../../../Infrastructure/Repositories/Sql/ActivityPostgress";
import { GetUserActivity, MarkActivityRead } from "../../../Application/use-cases/Activity-usecases/Activity.usecase";
import { ValidationError } from "../../../Domain/Errors/AppError";
import { sendError, sendUnauthorized } from "../middlewares/errorHandler";

const activityRepo = new ActivityRepoPostgress(pool);

export class ActivityController {
    /** Always scoped to the authenticated user — there is no user id parameter. */
    static async list(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const getActivity = new GetUserActivity(activityRepo);
            const activity = await getActivity.execute(userId, req.query["limit"]);

            res.status(200).json({ activity });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async markRead(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            let ids: string[] | undefined;
            const rawIds = req.body?.ids;
            if (rawIds !== undefined) {
                if (!Array.isArray(rawIds)) {
                    throw new ValidationError("ids must be an array of ids");
                }
                ids = rawIds.map((value: unknown) => {
                    if (typeof value !== "string" || value.trim().length === 0) {
                        throw new ValidationError("ids must contain non-empty strings");
                    }
                    return value.trim();
                });
            }

            const markRead = new MarkActivityRead(activityRepo);
            const updated = await markRead.execute(userId, ids);

            res.status(200).json({ message: "Activity marked as read", updated });
        } catch (error) {
            sendError(res, error);
        }
    }
}
