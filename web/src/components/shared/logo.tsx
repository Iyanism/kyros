import { Snowflake } from "lucide-react";

export function KyrosLogo({dark = false}) {
    return (
        <div className={`flex items-center gap-3 ${dark ? "text-[#11203a]" : "text-white"}`}>
            <span className={`${dark ? "bg-primary" : "bg-white"} shadow-[0_8px_20px_rgba(8,25,75,0.12)] h-9 w-9 flex justify-center items-center rounded-[10px]`}>
                <Snowflake className={`${dark ? "text-white" : "text-primary"} h-5 w-5`} strokeWidth={2.4}/>
            </span>
            <span className="font-bold text-xl tracking-[-0.055em]">Kyros</span>
        </div>
    )
}