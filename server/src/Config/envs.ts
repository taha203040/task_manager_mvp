import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
    app: {
        port: parseInt(process.env.PORT || "3000", 10),
        env: process.env.NODE_ENV || "development",
    },
    db: {
        host: process.env.DB_HOST as string,
        port: parseInt(process.env.DB_PORT as string),
    },
    jwt: {
        secret: process.env.JWT_SECRET as string,
        expiresIn: process.env.JWT_EXPIRES_IN as string,
    },
};

export default config;