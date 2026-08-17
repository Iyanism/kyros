import { Link } from "react-router";

import { KyrosLogo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Landing() {
  return (
    <div>
      <header className="flex items-center justify-between p-5">
        <KyrosLogo dark />
        <div className="flex items-center gap-4">
          <Link to="/login" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
            Login
          </Link>
          <Link to="/register" className={cn(buttonVariants({ variant: "default", size: "default" }))}>
            Register
          </Link>
        </div>
      </header>
    </div>
  );
}