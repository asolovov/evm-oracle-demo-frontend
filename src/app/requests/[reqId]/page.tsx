import type { Metadata } from "next";
import { RequestStatus } from "@/components/features/request-status";
import { ApiError } from "@/lib/api/errors";
import { getRequest } from "@/lib/api/oracle";
import type { RequestSummary } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reqId: string }>;
}): Promise<Metadata> {
  const { reqId } = await params;
  return { title: `Request #${reqId} — Lighthouse Oracle` };
}

export default async function RequestPage({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;

  // Fetch the initial snapshot; a not-yet-indexed request (404) renders the
  // pending shell and the client poller takes over.
  let initial: RequestSummary | null = null;
  try {
    initial = await getRequest(reqId);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) {
      // Other failures (502 etc.) also fall back to the polling shell.
    }
    initial = null;
  }

  return <RequestStatus reqId={reqId} initial={initial} />;
}
