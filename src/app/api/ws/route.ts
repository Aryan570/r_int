import { type NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });
const clients = new Map<number, WebSocket>();

export async function GET(req: NextRequest) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const { socket, upgrade } = (req as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  upgrade();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  wss.handleUpgrade(req as any, socket, Buffer.alloc(0), (ws) => {
    const userId = Number(req.headers.get('user-id')); // Use a userId from headers for tracking
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    clients.set(userId, ws as any);

    ws.on('message', (message) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      clients.forEach((client) => client.send(message.toString()));
    });

    ws.on('close', () => clients.delete(userId));
  });

  return new Response('WebSocket connection established');
}
