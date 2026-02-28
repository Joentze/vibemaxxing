'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { FormEvent, useState } from 'react';

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });
  const [input, setInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage({ text });
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-3xl flex-col p-4">
      <div className="mb-4 text-lg font-semibold">Chat</div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-md border p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Start by sending a message.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="rounded-md border bg-card p-3 text-card-foreground"
            >
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {message.role}
              </p>
              <p className="whitespace-pre-wrap text-sm">
                {message.parts
                  .filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')}
              </p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={isLoading || input.trim().length === 0}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}