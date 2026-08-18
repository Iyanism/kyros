export function FormSectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary text-[9px] font-bold text-secondary-foreground">
        {step}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3a4a66]">
        {title}
      </span>
    </div>
  );
}