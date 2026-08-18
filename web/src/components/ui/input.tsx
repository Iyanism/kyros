import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const inputSizes = {
  default: "h-10 rounded-md px-3.5 text-sm",
  lg: "h-12 rounded-md px-4 text-sm",
}

function Input({
  className,
  type,
  size = "default",
  leftIcon,
  rightSlot,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & {
  size?: keyof typeof inputSizes
  leftIcon?: React.ReactNode
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="relative w-full">
      {leftIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
          {leftIcon}
        </span>
      )}
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "w-full min-w-0 border border-input bg-transparent py-1 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          inputSizes[size],
          leftIcon && "pl-10",
          rightSlot && "pr-10",
          className
        )}
        {...props}
      />
      {rightSlot && (
        <span className="absolute inset-y-0 right-1 flex items-center">
          {rightSlot}
        </span>
      )}
    </div>
  )
}

export { Input }
