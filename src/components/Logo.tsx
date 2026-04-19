import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-serif text-lg italic">
        S
      </span>
      <span className="font-serif text-lg tracking-wide">
        Salão <span className="text-primary">[Nome do Salão]</span>
      </span>
    </Link>
  );
}
