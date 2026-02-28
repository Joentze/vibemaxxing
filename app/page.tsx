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
import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/ui/border-beam';
import { HyperText } from '@/components/ui/hyper-text';
import { MagicCard } from '@/components/ui/magic-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { RetroGrid } from '@/components/ui/retro-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from 'convex/react';
import { ExternalLinkIcon, LoaderIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { api } from '../convex/_generated/api';

type ProjectWithStatus = NonNullable<
  ReturnType<typeof useQuery<typeof api.projects.listWithStatus>>
>[number];

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
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 p-4 pb-12">
      <div className="mt-8">
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

function ProjectCard({ project }: { project: ProjectWithStatus }) {
  const isActive =
    project.agentCoding === 'started' || project.agentCoding === 'coding';

  return (
    <MagicCard className="rounded-xl">
      <div className="relative flex flex-col gap-3 p-5">
        {project.imageUrl && (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="aspect-video w-full rounded-md object-cover"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{project.title}</h3>
          <StatusBadge status={project.agentCoding} />
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
        {project.sandboxUrl && (
          <a
            href={project.sandboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Open preview <ExternalLinkIcon className="size-3" />
          </a>
        )}
        {isActive && <BorderBeam size={120} duration={8} />}
      </div>
    </MagicCard>
  );
}

function StatusBadge({
  status,
}: {
  status: 'started' | 'coding' | 'finished' | null;
}) {
  if (!status) return null;

  const config = {
    started: { label: 'Starting', variant: 'outline' as const },
    coding: { label: 'Coding', variant: 'secondary' as const },
    finished: { label: 'Finished', variant: 'default' as const },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant={variant} className="shrink-0">
      {(status === 'started' || status === 'coding') && (
        <span className="relative mr-1 flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
      )}
      {label}
    </Badge>
  );
}
