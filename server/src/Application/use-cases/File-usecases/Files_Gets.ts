import { FileRepo } from "../../../Domain/Repositories/UploadFileRepo";

export class GetFiles {
    constructor(private filerepo: FileRepo) {
    }
    async execute() {
        const files = await this.filerepo.getFiles()
        return files
    }
}