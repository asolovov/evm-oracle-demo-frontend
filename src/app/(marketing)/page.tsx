import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          frontend-next-template
        </h1>
        <p className="text-lg text-muted-foreground">
          Next.js 16 starter optimized for AI-agent coding workflows. App Router, Server Actions,
          shadcn/ui, Conform, Biome. Read{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">AGENTS.md</code> before editing.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/example" className={buttonVariants()}>
            See example <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
