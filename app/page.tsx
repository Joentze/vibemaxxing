'use client';

import { FormEvent, useState } from 'react';

export default function Page() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResponseText('');

    try {
      const response = await fetch('/api/tasker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const payload = await response.text();
      setResponseText(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-3xl flex-col p-4">
      <div className="mb-4 text-lg font-semibold">App Idea Generator</div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-md border p-3">
        {!responseText ? (
          <p className="text-sm text-muted-foreground">
            Enter a prompt to generate app ideas.
          </p>
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{responseText}</pre>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. apps for fitness coaches"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={isLoading || input.trim().length === 0}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>
    </div>
  );
}