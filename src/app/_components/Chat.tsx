/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// components/Chat.tsx
import { useEffect, useState } from 'react';
import { api } from '~/trpc/react';
type message = {
    id : number,
    senderId : number | null,
    content : string,
    type : string | null
    timestamp : Date | null
}
export function Chat({ senderId }: { senderId: number }) {
  const [messages, setMessages] = useState<message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Fetch initial messages with tRPC
  const [initialMessages] = api.message.getMessages.useSuspenseQuery({
    senderId,
    recipientId: 1,
  });

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/api/ws');
    setSocket(ws);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    return () => ws.close();
  }, [senderId]);

  const sendMessage = async () => {
    if (socket && newMessage.trim()) {
      socket.send(JSON.stringify({ type: 'sendMessage', senderId, content: newMessage }));
      setNewMessage('');
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, idx) => (
          <p key={idx}>{msg.content}</p>
        ))}
      </div>
      <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
