try {
    process.loadEnvFile(); // reads .env from the folder where you run the server
} catch {
    // no .env file: fall back to variables already set in the environment
}

function required(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing env var: ${name}`);
    return value;
}

const config = {
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:8080",
    databaseUrl: required("DATABASE_URL"),
    jwt: {
        secret: required("JWT_SECRET"),
        expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    },
} as const;

export default config;