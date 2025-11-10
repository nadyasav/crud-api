import http from 'http';
import { API_USERS } from './constants';
import { User } from './types';

export function getUserIdFromUrl(url: string): string | null {
  const idMatch = url.match(new RegExp(`^${API_USERS}/(.+)$`));
  return idMatch ? idMatch[1] : null;
}

export function sendError(res: http.ServerResponse, message: string, code: number) {
  res.writeHead(code);
  res.end(JSON.stringify({ error: message }));
}

export function sendData(res: http.ServerResponse, data: unknown, code: number = 200) {
  res.writeHead(code);
  res.end(JSON.stringify({ data }));
}

export function isValidUserData(data: unknown): data is Omit<User, 'id'> {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const { username, age, hobbies } = data as Record<string, unknown>;

  const isValidUserName = typeof username === 'string' && username.trim().length > 0;
  const isValidAge = typeof age === 'number' && age > 0;
  const isValidHobbies =
    Array.isArray(hobbies) &&
    hobbies.length > 0 &&
    hobbies.every((hobbie: unknown) => typeof hobbie === 'string');

  return isValidUserName && isValidAge && isValidHobbies;
}
