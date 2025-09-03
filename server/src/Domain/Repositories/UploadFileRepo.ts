import { File } from "../Entities/File_Entities"

export interface FileRepo {
    upload(file: File): Promise<void>
    getFile(file: string): Promise<File | null>
    getFiles(): Promise<{ id: string; name: string }[]>
}