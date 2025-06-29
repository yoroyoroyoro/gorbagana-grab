
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const tiles = Array.from({ length: 20 }, (_, i) => i);
  const activeTiles = Math.floor(((value || 0) / 100) * 20);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("pixel-progress", className)}
      {...props}
    >
      {tiles.map((tile) => (
        <div
          key={tile}
          className={cn(
            "pixel-progress-tile",
            tile < activeTiles && "active"
          )}
          style={{
            animationDelay: `${tile * 50}ms`,
            animation: tile < activeTiles ? 'tile-light-up 0.3s ease-out' : 'none'
          }}
        />
      ))}
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
