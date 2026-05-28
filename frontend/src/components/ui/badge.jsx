import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive border-destructive/20",
        outline: "text-foreground",
        success: "border-transparent bg-success/10 text-success border-success/20",
        // Category badges
        food: "border-transparent bg-orange-50 text-orange-700 border-orange-100",
        travel: "border-transparent bg-blue-50 text-blue-700 border-blue-100",
        rent: "border-transparent bg-violet-50 text-violet-700 border-violet-100",
        utilities: "border-transparent bg-amber-50 text-amber-700 border-amber-100",
        others: "border-transparent bg-gray-100 text-gray-600 border-gray-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

const CATEGORY_BADGE_VARIANT = {
  Food: "food",
  Travel: "travel",
  Rent: "rent",
  Utilities: "utilities",
  Others: "others",
}

export { Badge, badgeVariants, CATEGORY_BADGE_VARIANT }
