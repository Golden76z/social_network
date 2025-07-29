import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
// import { ButtonAccept } from "./Button/buttonAccept"
// import { PiX } from "react-icons/pi"

const counterVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                CounterFollowers:
                    "text-chart-1",
                CounterFollowing:
                    "text-chart-1",
                CounterPosts:
                    "text-chart-1",              
                CounterLikes:
                    "text-chart-1",
                CounterDislikes:
                    "text-chart-1",
                CounterComments:
                    "text-chart-1",
            },
            size: {
                size1: "h-[100px] w-[100px]",
            },
        },
        defaultVariants: {
            variant: "CounterFollowers",
            size: "size1",
        },
    }
)

function Counter({
    className,
    variant,
    size,
    asChild = false,
    children,
    ...props
}: React.ComponentProps<"div"> &
    VariantProps<typeof counterVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "div"

    return (
        <Comp
            className={cn(counterVariants({ variant, size, className }))}
            {...props}
        >

        <span>{children}</span>
        {variant === "CounterFollowers" && (
            <>
            <text>99K Followers</text>
            </>
        )}

        {variant === "CounterFollowing" && (
            <>
            <text>99K Following</text>
            </>
        )}

        {variant === "CounterPosts" && (
            <>
            <text>99K Posts</text>
            </>
        )}
        </Comp>
    )
}

export { Counter, counterVariants }