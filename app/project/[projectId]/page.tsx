'use client';

import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';

import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
    PromptInput,
    PromptInputBody,
    PromptInputFooter,
    PromptInputProvider,
    PromptInputSubmit,
    PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/mode-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RainbowButton } from '@/components/ui/rainbow-button';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from 'convex/react';
import {
    ArrowLeftIcon,
    ClockIcon,
    ExternalLinkIcon,
    ImageIcon,
    MessageSquareIcon,
    RefreshCcwIcon,
} from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

function useCountdown(expiryDate: number | null) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!expiryDate) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [expiryDate]);

    if (!expiryDate) return null;

    const diff = expiryDate - now;
    if (diff <= 0) return { expired: true as const, label: 'Expired' };

    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${String(seconds).padStart(2, '0')}s`);

    return { expired: false as const, label: parts.join(' ') };
}

const statusConfig = {
    started: {
        label: 'Starting',
        className: 'bg-muted text-muted-foreground',
    },
    coding: {
        label: 'Coding',
        className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    },
    finished: {
        label: 'Finished',
        className: 'bg-green-500/15 text-green-600 dark:text-green-400',
    },
};

export default function ProjectPage({
    params,
}: {
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = use(params);
    const project = useQuery(api.projects.getWithStatus, {
        id: projectId as Id<'projects'>,
    });
    const [iframeKey, setIframeKey] = useState(0);
    const handleRemixSubmit = (_message: PromptInputMessage) => { };

    if (project === undefined) {
        return (
            <div className="flex min-h-screen flex-col">
                <div className="border-b px-4 py-3">
                    <div className="mx-auto flex max-w-5xl items-center gap-3">
                        <Skeleton className="size-10 rounded-lg" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                </div>
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
        );
    }

    if (project === null) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
                <h1 className="text-2xl font-bold">Project not found</h1>
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                    <ArrowLeftIcon className="size-4" /> Back to projects
                </Link>
            </div>
        );
    }

    const statusInfo = project.agentCoding
        ? statusConfig[project.agentCoding]
        : null;
    const isRemixEnabled = project.agentCoding === 'finished';

    return (
        <div className="flex h-screen flex-col">
            <TopBar
                title={project.title}
                imageUrl={project.imageUrl ?? undefined}
                agentCoding={project.agentCoding}
                statusInfo={statusInfo}
                sandboxExpiryDate={project.sandboxExpiryDate}
            />

            <main className="mx-auto flex h-full min-h-0 w-full flex-1 p-4">
                <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0 flex-1">
                    <ResizablePanel defaultSize={25} minSize={10}>
                        <div className="h-full p-4">
                            <div
                                className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border ${isRemixEnabled
                                    ? 'bg-card'
                                    : 'bg-muted/40 opacity-70'
                                    }`}
                            >
                                <Conversation className="relative min-h-0 flex-1">
                                    <ConversationContent>
                                        <ConversationEmptyState
                                            title="Start remixing"
                                            description={
                                                isRemixEnabled
                                                    ? 'Your remix conversation will appear here.'
                                                    : 'Remix is available when sandbox status is Finished.'
                                            }
                                            icon={<MessageSquareIcon className="size-6" />}
                                        />
                                    </ConversationContent>
                                    <ConversationScrollButton />
                                </Conversation>
                                <div className="border-t p-4">
                                    <PromptInputProvider>
                                        <PromptInput onSubmit={handleRemixSubmit}>
                                            <PromptInputBody>
                                                <PromptInputTextarea
                                                    placeholder="Remix this app..."
                                                    disabled={!isRemixEnabled}
                                                />
                                            </PromptInputBody>
                                            <PromptInputFooter>
                                                <PromptInputSubmit
                                                    className="ml-auto mr-6"
                                                    disabled={!isRemixEnabled}
                                                >
                                                    <RainbowButton
                                                        type="submit"
                                                        variant="outline"
                                                        disabled={!isRemixEnabled}
                                                    >
                                                        Remix
                                                    </RainbowButton>
                                                </PromptInputSubmit>
                                            </PromptInputFooter>
                                        </PromptInput>
                                    </PromptInputProvider>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={75} minSize={35}>
                        <div className="flex h-full w-full justify-center p-4">
                            {project.sandboxUrl ? (
                                <section className="h-full w-full overflow-hidden rounded-xl border bg-card shadow-sm">
                                    <div className="flex items-center justify-between border-b px-4 py-2.5">
                                        <p className="text-sm font-medium">Live Preview</p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIframeKey((k) => k + 1)}
                                            >
                                                <RefreshCcwIcon className="mr-1.5 size-3.5" />
                                                Refresh
                                            </Button>
                                            <a
                                                href={project.sandboxUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                Open in new tab <ExternalLinkIcon className="size-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                    <iframe
                                        key={iframeKey}
                                        src={project.sandboxUrl}
                                        title={`${project.title} preview`}
                                        className="h-[calc(100%-45px)] w-full bg-background"
                                        loading="lazy"
                                    />
                                </section>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
                                    No preview URL available for this project.
                                </div>
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}

function TopBar({
    title,
    imageUrl,
    agentCoding,
    statusInfo,
    sandboxExpiryDate,
}: {
    title: string;
    imageUrl?: string;
    agentCoding: 'started' | 'coding' | 'finished' | null;
    statusInfo: { label: string; className: string } | null;
    sandboxExpiryDate: number | null;
}) {
    const countdown = useCountdown(sandboxExpiryDate);

    return (
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
                <Link
                    href="/"
                    className="mr-1 flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                    <ArrowLeftIcon className="size-4" />
                </Link>

                <Avatar className="size-9 rounded-lg">
                    <AvatarImage src={imageUrl} alt={title} />
                    <AvatarFallback className="rounded-lg">
                        <ImageIcon className="size-4 text-muted-foreground/40" />
                    </AvatarFallback>
                </Avatar>

                <h1 className="min-w-0 truncate text-sm font-semibold">{title}</h1>

                {statusInfo && (
                    <Badge
                        variant="outline"
                        className={`shrink-0 border-transparent ${statusInfo.className}`}
                    >
                        {(agentCoding === 'started' || agentCoding === 'coding') && (
                            <span className="relative mr-1 flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-current" />
                            </span>
                        )}
                        {statusInfo.label}
                    </Badge>
                )}

                <div className="flex-1" />

                {countdown && (
                    <Badge
                        variant="outline"
                        className={`gap-1.5 border-transparent text-xs tabular-nums ${countdown.expired
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                            }`}
                    >
                        <ClockIcon className="size-3.5" />
                        <span>{countdown.label}</span>
                    </Badge>
                )}
                <ModeToggle />
            </div>
        </header>
    );
}
