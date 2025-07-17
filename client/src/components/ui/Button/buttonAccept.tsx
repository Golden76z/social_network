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
                    "bg-green-500 text-white shadow-xs hover:bg-green-600",
                PrimaryDisabled:
                    "bg-red-500 text-white shadow-xs hover:bg-red-600 focus-visible:ring-red-400 dark:focus-visible:ring-red-600 dark:bg-red-700",
                SecondaryRest:
                    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
                SecondaryDisable:
                    "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "PrimaryRest",
            size: "default",
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