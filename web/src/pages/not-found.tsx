import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fbfcfe] px-6 text-center">
      <p className="font-display text-[clamp(4rem,10vw,6rem)] font-semibold leading-none tracking-[-0.07em] text-[#13213a]">404</p>
      <p className="text-[15px] text-[#7b8799]">This page doesn't exist.</p>
      <Link to="/" className="mt-2 rounded-[10px] bg-[#2457e6] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1746cd]">
        Back to home
      </Link>
    </div>
  );
}