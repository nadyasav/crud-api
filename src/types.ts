export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export interface User {
  id: UUID;
  username: string;
  age: number;
  hobbies: string[];
}
