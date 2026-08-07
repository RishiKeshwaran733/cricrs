import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0EA5E9] text-white hover:bg-[#0284C7]",
        secondary: "border-transparent bg-[#1E293B] text-white hover:bg-[#334155]",
        destructive: "border-transparent bg-[#EF4444] text-white hover:bg-red-600",
        success: "border-transparent bg-[#22C55E] text-white",
        warning: "border-transparent bg-[#F59E0B] text-white",
        outline: "text-white border-[#334155]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
