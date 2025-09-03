import net from "net";
import fs from "fs";

const SOCKET_PATH: string = "\\wsl.localhost\Ubuntu\run\clamd.ctl";

export const fileScan = async (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const client = net.createConnection(SOCKET_PATH, () => {
            console.log("✅ Connected to clamd");
            client.write("INSTREAM\n"); // بدء بروتوكول INSTREAM

            const stream = fs.createReadStream(filePath);
            stream.on("data", (chunk) => {
                const lengthBuffer = Buffer.alloc(4);
                lengthBuffer.writeUInt32BE(chunk.length, 0);
                client.write(lengthBuffer);
                client.write(chunk);
            });

            stream.on("end", () => {
                const endBuffer = Buffer.alloc(4);
                endBuffer.writeUInt32BE(0, 0); // إشارة نهاية الملف
                client.write(endBuffer);
            });

            stream.on("error", (err) => {
                reject(err);
                client.end();
            });

            let result = "";
            client.on("data", (data) => {
                result += data.toString();
            });

            client.on("end", () => {
                resolve(result.trim());
            });

            client.on("error", (err) => {
                reject(err);
            });
        });
    });
};
