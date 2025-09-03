
import { FileRepo } from "../../../Domain/Repositories/UploadFileRepo";

export class GetFileByid {
    constructor(private filerepo: FileRepo) {
    }
    async execute(file: string) {
        const files = await this.filerepo.getFile(file)
        return files
    }
} 