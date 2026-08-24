import type { AlertItem } from "@/lib/data/dashboard";

const styles = {
  warning: { bg: "bg-[#fffbeb]", border: "border-[#fef3c7]", text: "text-[#92400e]" },
  info: { bg: "bg-[#eff6ff]", border: "border-[#dbeafe]", text: "text-[#1e40af]" },
  success: { bg: "bg-[#ecfdf5]", border: "border-[#d1fae5]", text: "text-[#065f46]" },
};

export function AlertBox({ severity, title, desc, time }: AlertItem) {
  const style = styles[severity];

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-3.5`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className={`text-[12px] font-bold ${style.text}`}>{title}</h4>
        <span className="text-[10px] text-[#94a3b8]">{time}</span>
      </div>
      <p className={`text-[11px] leading-relaxed ${style.text} opacity-90`}>{desc}</p>
    </div>
  );
}
