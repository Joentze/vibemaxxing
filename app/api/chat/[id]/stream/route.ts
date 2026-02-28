import { createUIMessageStreamResponse } from 'ai';
import { getRun } from 'workflow/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const startIndexParam = searchParams.get('startIndex');
  const parsedStartIndex =
    startIndexParam === null ? undefined : Number.parseInt(startIndexParam, 10);
  const startIndex =
    parsedStartIndex === undefined || Number.isNaN(parsedStartIndex)
      ? undefined
      : parsedStartIndex;

  const run = getRun(id);
  const stream = run.getReadable({ startIndex });

  return createUIMessageStreamResponse({ stream });
}
