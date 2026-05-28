import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md animate-shimmer", className)}
      {...props}
    />
  )
}

export { Skeleton }
