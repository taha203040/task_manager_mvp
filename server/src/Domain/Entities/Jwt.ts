

export class JwtValidation {
    constructor(
        public id: string,            // معرّف المستخدم أو الجلسة
        public duration: string,      // مدة صلاحية التوكن (ex: "1h", "7d")
    ) { }
}

export interface JwtPayloadEntity {
    userId: string;
    email: string;      // expiry
}
export class JwtToken {
    constructor(
        public token: string,        // النص المشفر
        public expiresAt: Date,      // وقت الانتهاء
        public type: "access" | "refresh"  // نوع التوكن
    ) { }
}

export class JwtConfig {
    constructor(
        public secret: string,
        public algorithm: "HS256" | "HS384" | "HS512" = "HS256",
        public accessTokenDuration: string = "15m",   // مدة صلاحية Access Token
        public refreshTokenDuration: string = "7d"    // مدة صلاحية Refresh Token
    ) { }
}
