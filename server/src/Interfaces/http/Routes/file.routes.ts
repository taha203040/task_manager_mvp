import pool from "../../../Config/db";
import crypto from "crypto";
import { GetFiles } from "../../../Application/use-cases/File-usecases/Files_Gets";
import { GetFileByid } from "../../../Application/use-cases/File-usecases/GetfileByid";
import jwt from 'jsonwebtoken'
import { authenticate } from "../middlewares/authMiddleware";
import { Router, Response, Request } from "express";
import { FileRepoPostgres } from "../../../Infrastructure/database/Sql/PostgresLogic";
import { UploadFile } from "../../../Application/use-cases/File-usecases/uploadFile";
import multer from 'multer'
import { fileScan } from "../../../Infrastructure/security/fileChecker";
// import { filescanner } from "../../../Infrastructure/security/clamav";

const filerouter = Router();
const upload = multer({ dest: "uploads/" });

filerouter.post(
    "/upload"
    , authenticate,
    // authenticate, // 👈 protect this route
    upload.single("file"),
    async (req: Request, res: Response) => {
        try {
            const { originalname, mimetype, size } = req.file as Express.Multer.File;
            const filerepo = new FileRepoPostgres(pool);
            const uploadfile = new UploadFile(filerepo);
            const random ='9907800kjhgkjhgh0988809809788'
            const file = await uploadfile.execute(originalname, mimetype, size, random);
            await fileScan("uploads/"),
                console.log("File scanned successfully");
            res.status(201).json(file);
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Failed to upload file" });
        }
    }
)
filerouter.get("/file/:id", authenticate, async (req: Request, res: Response) => {
    // extract id of file
    const { id } = req.params
    // If the file is in 
    if (id) {
        const filerepo = new FileRepoPostgres(pool);
        const getFiles = new GetFileByid(filerepo)
        const file = await getFiles.execute(id)
        if (file) {
            res.send({ file })
        }
    }
    else {
        res.send({ msg: " file not found" })
    }
})
filerouter.get("/getfiles", authenticate, async (req: Request, res: Response) => {
    try {
        const filerepo = new FileRepoPostgres(pool);
        const getFiles = new GetFiles(filerepo);
        const files = await getFiles.execute();
        if (files.length === 0) {
            res.send({ msg: 'Not Found' })
        }
        res.status(200).json({ files });

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Failed to upload file" })
    }

})



filerouter.get("/generate/:id", authenticate, async (req: Request, res: Response) => {
    const { id } = req.params
    // check if the id in db after we genreate a link file and be temporaly
    const token = jwt.sign({ fileId: id }, '21299234kksdf', { expiresIn: '20m' })
    res.send({ url: `http://localhost:3000/api/v1/files/secure/${token}` })
})



filerouter.get("/secure/:token", async (req: Request, res: Response) => {
    try {
        const { token } = req.params
        if (!token) {
            res.json({ message: `Access Denied}` });
        }
        //@ts-ignore
        const decoded = jwt.verify(token, '21299234kksdf') as { fileId: string }
        const filerepo = new FileRepoPostgres(pool);
        const getFile = new GetFileByid(filerepo)
        const file = await getFile.execute(decoded.fileId)

        if (file) {
            const { id, ...safeFile } = file
            res.send({ safeFile })

        } else res.send({ msg: 'File not found ' })
    }
    catch (e) {
        res.status(401).json({ message: "Link expired or invalid" });
    }
});
export default filerouter;
