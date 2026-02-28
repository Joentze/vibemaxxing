'use client';

import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { ProjectCard } from '@/components/project-card';
import { HyperText } from '@/components/ui/hyper-text';
import { NumberTicker } from '@/components/ui/number-ticker';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { RetroGrid } from '@/components/ui/retro-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from 'convex/react';
import { LoaderIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { api } from '../convex/_generated/api';
import { ModeToggle } from '@/components/mode-toggle';

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    'submitted' | 'streaming' | 'ready' | 'error'
  >('ready');

  const projects = useQuery(api.projects.listWithStatus);

  const inProgress = useMemo(
    () =>
      projects?.filter(
        (p) => p.agentCoding === 'started' || p.agentCoding === 'coding',
      ) ?? [],
    [projects],
  );

  const finished = useMemo(
    () => projects?.filter((p) => p.agentCoding === 'finished') ?? [],
    [projects],
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text || isLoading) return;

      setIsLoading(true);
      setStatus('submitted');
      setError(null);

      try {
        const response = await fetch('/api/tasker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        setStatus('streaming');
        await response.text();
        setStatus('ready');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 overflow-x-hidden p-4 pb-12">
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>
      <div className="mt-8 z-10">
        <div className="my-4">
          <div className="mb-4 flex flex-col items-center justify-center pb-6">
            <HyperText className="mx-auto text-4xl font-bold">
              VIBE-MAXXING
            </HyperText>
            <p className="text-sm text-muted-foreground">
              Create CRAZY amount of apps with AI
            </p>
          </div>
          <PromptInputProvider>
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea placeholder="Create apps TO THE MAXX" />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputSubmit
                  className="ml-auto mr-8"
                  status={status}
                  disabled={isLoading}
                >
                  <RainbowButton type="submit" variant="outline">
                    Vibe Now
                  </RainbowButton>
                </PromptInputSubmit>
              </PromptInputFooter>
            </PromptInput>
          </PromptInputProvider>
          {error && (
            <p className="mt-2 text-center text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {projects === undefined ? (
        <div className="flex items-center justify-center py-12">
          <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length > 0 ? (
        <Tabs defaultValue="in-progress">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="in-progress">
                In Progress
                {inProgress.length > 0 && (
                  <span className="ml-1.5 tabular-nums">
                    <NumberTicker value={inProgress.length} />
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="finished">
                Finished
                {finished.length > 0 && (
                  <span className="ml-1.5 tabular-nums">
                    <NumberTicker value={finished.length} />
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="in-progress">
            {inProgress.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No projects in progress.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgress.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="finished">
            {finished.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No finished projects yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {finished.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      <RetroGrid />
    </div>
  );
}

