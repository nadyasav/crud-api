import http from 'http';
import crypto from 'crypto';
import { Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { UUID, User } from './types';
import { getUserIdFromUrl, sendError, sendData, isValidUserData } from './utils';
import { API_USERS } from './constants';
import dotenv from 'dotenv';
import { validate as isValidUUID } from 'uuid';

dotenv.config();

const PORT = process.env.PORT || 3000;

const users: Record<UUID, User> = {};

async function parseBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  const writable = new Writable({
    write(chunk: Buffer, _, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  await pipeline(req, writable);

  const body = Buffer.concat(chunks).toString('utf-8');
  return body ? JSON.parse(body) : {};
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const method = req.method;
  const url = req.url;

  if (!url) {
    sendError(res, 'Not found', 404);
    return;
  }

  switch (method) {
    case 'GET':
      if (url === API_USERS || url === API_USERS + '/') {
        sendData(res, Object.values(users));
        return;
      }

      const userId = getUserIdFromUrl(url);
      if (!userId) {
        sendError(res, 'Not found', 404);
        return;
      }

      if (!isValidUUID(userId)) {
        sendError(res, 'Invalid user id format', 400);
        return;
      }

      const user = users[userId as UUID];
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendData(res, user);
      return;

    case 'POST':
      if (url !== API_USERS && url !== API_USERS + '/') {
        sendError(res, 'Not found', 404);
        return;
      }

      try {
        const body = await parseBody(req);

        if (!isValidUserData(body)) {
          sendError(res, 'Invalid user data', 400);
          return;
        }

        const userId = crypto.randomUUID();
        const newUser: User = {
          id: userId,
          ...body,
        };

        users[userId] = newUser;
        sendData(res, newUser, 201);
      } catch {
        sendError(res, 'Invalid JSON', 400);
      }
      return;

    case 'DELETE':
      if (url === API_USERS || url === API_USERS + '/') {
        sendError(res, 'Not found', 404);
        return;
      }

      const deleteUserId = getUserIdFromUrl(url);
      if (!deleteUserId) {
        sendError(res, 'Not found', 404);
        return;
      }

      if (!isValidUUID(deleteUserId)) {
        sendError(res, 'Invalid user id format', 400);
        return;
      }

      if (!users[deleteUserId as UUID]) {
        sendError(res, 'User not found', 404);
        return;
      }

      delete users[deleteUserId as UUID];
      res.writeHead(204);
      res.end();
      return;

    default:
      sendError(res, 'Not found', 404);
  }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
