export interface Team {
  id: string;
  name: string;
  description?: string;
  members: string[]; // user IDs
  createdAt: Date;
  updatedAt: Date;
}