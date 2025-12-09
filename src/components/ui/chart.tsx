
"use client"

import * as React from "react"
import {
  Tooltip,
} from "recharts"

import { cn } from "@/lib/utils"
import {
  Card,
} from "@/components/ui/card"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: any;
    className?: string;
  }
>(({ config, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex aspect-video w-full flex-col gap-y-4 overflow-hidden rounded-lg p-1",
      className
    )}
    {...props}
  />
))
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = Tooltip
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Card> &
    Pick<
      NonNullable<React.ComponentProps<typeof Tooltip>["content"]>,
      "active" | "payload" | "label"
    > & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
      formatter?: (value: any, name: any, item: any, index: any) => React.ReactNode;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelKey,
      nameKey,
      formatter,
      // @ts-ignore
      accessibilityLayer, // Destructure and ignore the prop
      ...props
    },
    ref
  ) => {

    if (!active || !payload?.length) {
      return null
    }

    return (
      <Card
        ref={ref}
        className={cn("min-w-[8rem] border text-sm", className)}
        {...props}
      >
        <div className="border-b p-2">
          {!hideLabel && (
            <p className="font-medium">
              {label ||
                (labelKey && payload[0]?.payload
                  ? `${payload[0]?.payload[labelKey]}`
                  : null)}
            </p>
          )}
        </div>
        <div className="space-y-1 p-2">
          {payload.map((item, i) => {
            const name = nameKey
              ? item.payload[nameKey]
              : item.name
            const value = item.value
            const color = item.color || item.payload.fill;


            if (!name) {
              return null
            }
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-x-2"
              >
                <div className="flex items-center gap-x-2">
                  {!hideIndicator && (
                    <div
                      className={cn("h-2.5 w-2.5 shrink-0 rounded-[2px]")}
                      style={{
                        backgroundColor: color,
                      }}
                    />
                  )}
                  <p>{item.dataKey}</p>
                </div>
                {value && (
                  <p className="font-medium tabular-nums">
                    {formatter ? formatter(value, name, item, i) : value.toLocaleString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
