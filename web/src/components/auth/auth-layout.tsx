export function AuthLayout({
  left,
  right,
  leftWidth = "w-[54%]",
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
}) {
  return (
    <div className="flex min-h-screen">
      <div className={`hidden lg:block ${leftWidth}`}>{left}</div>
      <div className="flex w-full flex-col lg:flex-1">{right}</div>
    </div>
  );
}