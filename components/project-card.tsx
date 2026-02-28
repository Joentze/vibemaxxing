'use client';

import { Badge } from '@/components/ui/badge';
import { BorderBeam } from '@/components/ui/border-beam';
import { MagicCard } from '@/components/ui/magic-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLinkIcon, ImageIcon } from 'lucide-react';
import Link from 'next/link';

export interface ProjectCardData {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  sandboxUrl?: string | null;
  agentCoding: 'started' | 'coding' | 'finished' | null;
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const isActive =
    project.agentCoding === 'started' || project.agentCoding === 'coding';

  return (
    <Link href={`/project/${project._id}`} className="block">
      <MagicCard className="rounded-xl bg-card opacity-100 transition-shadow hover:shadow-lg">
        <div className="relative flex flex-col gap-3 p-5">
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="aspect-video w-full rounded-md object-cover"
            />
          ) : (
            <Skeleton className="flex aspect-video w-full items-center justify-center rounded-md">
              <ImageIcon className="size-8 text-muted-foreground/40" />
            </Skeleton>
          )}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{project.title}</h3>
            <StatusBadge status={project.agentCoding} />
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
          {project.sandboxUrl && (
            <span
              onClick={(e) => {
                e.preventDefault();
                window.open(project.sandboxUrl!, '_blank');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Open preview <ExternalLinkIcon className="size-3" />
            </span>
          )}
          {isActive && <BorderBeam size={120} duration={8} />}
        </div>
      </MagicCard>
    </Link>
  );
}

function StatusBadge({
  status,
}: {
  status: 'started' | 'coding' | 'finished' | null;
}) {
  if (!status) return null;

  const config = {
    started: { label: 'Starting', className: 'bg-muted text-muted-foreground' },
    coding: { label: 'Coding', className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
    finished: { label: 'Finished', className: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={`shrink-0 border-transparent ${className}`}>
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
