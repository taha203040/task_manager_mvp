export class File {
    constructor(
        public id: string,           
        public name: string,         
        public mimeType: string,     
        public size: number,         
        public ownerId: string,       
        public created_at: Date,      
        public updated_at: Date) {
    }
}