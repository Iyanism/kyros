import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";

export function PasswordInput({
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: "default" | "lg" }) {
  const [show, setShow] = useState(false);

  return (
    <Input
      type={show ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((prev) => !prev)}
          className="rounded-md p-1.5 text-[#8792a3] transition hover:bg-[#f1f4f9] hover:text-primary"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
}