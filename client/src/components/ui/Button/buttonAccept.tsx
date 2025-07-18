import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonAcceptVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                PrimaryRest:
                    "bg-chart-1 text-white shadow-xs hover:bg-chart-2",
                PrimaryDisabled:
                    "bg-chart-2 text-white shadow-xs",
                SecondaryRest:
                    "rounded-[5px] border border-chart-1 text-chart-1 shadow-xs hover:border-chart-2 hover:text-chart-2",
                SecondaryDisabled:
                    "rounded-[5px] border border-chart-2 text-chart-2 shadow-xs",
            },
            size: {
                size1: "h-[40px] w-[75px]",
                size2: "h-[40px] w-[105px]",
                size3: "h-[40px] w-[190px]",
            },
        },
        defaultVariants: {
            variant: "PrimaryRest",
            size: "size1",
        },
    }
)

function ButtonAccept({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonAcceptVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="button"
            className={cn(buttonAcceptVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { ButtonAccept, buttonAcceptVariants }