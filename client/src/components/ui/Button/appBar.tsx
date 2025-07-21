import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ButtonAccept } from "./buttonAccept"
import { ButtonPP } from "./buttonPP"

const appBarVariants = cva(
    "inline-flex items-center  gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                Heading1:
                    "text-chart-1 text-left pl-[5px] border border-chart-1",
                Heading2:
                "text-chart-1 text-left pl-[5px] border border-chart-1",
                Bar1:
                    "rounded-[5px] border border-chart-1 text-chart-1 shadow-xs hover:border-chart-2 hover:text-chart-2",
                Bar2:
                    "rounded-[5px] border border-chart-2 text-chart-2 shadow-xs",
            },
            size: {
                size1: "h-[70px] w-screen",
            },
        },
        defaultVariants: {
            variant: "Heading1",
            size: "size1",
        },
    }
)

function AppBar({
    className,
    variant,
    size,
    asChild = false,
    children,
    ...props
}: React.HTMLAttributes<HTMLElement> &
    VariantProps<typeof appBarVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "div"

    return (
        <Comp
            className={cn(appBarVariants({ variant, size, className }), "justify-between pr-[5px]")}
            {...props}
        >
            <span>{children}</span>
            {variant === "Heading1" && (
            <ButtonPP variant={"PP"} size={"size1"}>

            </ButtonPP>
            )}

            {variant === "Heading2" && (
            <ButtonPP variant={"Login"} size="size2">
                
            </ButtonPP>
            )}
        </Comp>
    )
}

export { AppBar, appBarVariants }