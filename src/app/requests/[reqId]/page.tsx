import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequestStatus } from "@/components/features/request-status";
import { ApiError } from "@/lib/api/errors";
import { getRequest } from "@/lib/api/oracle";
import type { RequestSummary } from "@/lib/api/schemas";

/** On-chain request ids are base-10 uint256 strings (openapi: hex is rejected). */
const REQ_ID_RE = /^\d+$/;

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

  // Reject malformed ids up front so we never hand a 400-bound value to the BFF
  // (which would otherwise show a perpetual "awaiting indexer" shell).
  if (!REQ_ID_RE.test(reqId)) notFound();

  // Fetch the initial snapshot; a not-yet-indexed request (404) renders the
  // pending shell and the client poller takes over. Other failures (502 etc.)
  // also fall back to the polling shell rather than 500-ing.
  let initial: RequestSummary | null = null;
  try {
    initial = await getRequest(reqId);
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    initial = null;
  }

  return <RequestStatus reqId={reqId} initial={initial} />;
}
