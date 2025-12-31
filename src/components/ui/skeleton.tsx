
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'table' | 'circle';
  width?: string | number;
  height?: string | number;
}

function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-lg',
    table: 'h-12 w-full rounded',
    circle: 'rounded-full',
  };

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  )
}

export { Skeleton }
