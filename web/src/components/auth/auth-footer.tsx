import { cn } from "@/lib/utils";

export function AuthFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-between border-t border-[#edf0f5] pt-5 text-[10px] font-medium text-[#a1aab8]",
        className
      )}
    >
      <span>© 2026 Kyros Systems</span>
      <span>Privacy · Terms</span>
    </footer>
  );
}