import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <Scissors className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="font-display text-lg tracking-[0.18em] leading-none">
        Barbearia <span className="text-primary">[Nome]</span>
      </span>
    </Link>
  );
}
