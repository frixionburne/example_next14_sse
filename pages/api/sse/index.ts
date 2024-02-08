import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

interface SSEClient {
    id: string;
    response: NextApiResponse;
}

let clients: SSEClient[] = [];
let interval: any = null;

// This sse endpoint maintains a list of connected clients and sends out a single message to all of them on an interval.
// If all clients disconnect, the endpoint sits idle and doesn't spin the interval constantly
const handler = async (
    req: NextApiRequest,
    res: NextApiResponse
) => {
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Encoding': 'none',
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type': 'text/event-stream',
    });

    const sseClient = {
        id: uuidv4(),
        response: res
    }
    clients.push(sseClient);

    if (!interval) {
        interval = setInterval(async () => {
            const random = Math.random();
            const output = {
                value: random
            }
            clients.forEach(client => {
                client.response.write(
                    `data: ${JSON.stringify(output)}\n\n`
                )
            });
        }, 3000);
    }

    // I'm not sure which one of these is needed, or both. Closing the connection in postmans causes both event listeners to fire
    res.on('close', () => {
        clients = clients.filter(client => client.id !== sseClient.id);
        if (clients.length < 1) {
            clearInterval(interval);
            interval = null;
        }
        sseClient.response.end();
        res.end();
    });

    res.socket?.on('close', () => {
        clients = clients.filter(client => client.id !== sseClient.id);
        if (clients.length < 1) {
            clearInterval(interval);
            interval = null;
        }
        sseClient.response.end();
        res.end();
    });
}

export default handler;