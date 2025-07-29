import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"


const buttonPPVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                PP:
                    "bg-[url('https://tse2.mm.bing.net/th/id/OIP.vg1KOuYtiZI2V0_ZXB-05gHaGc?r=0&pid=Api')] bg-cover bg-center text-transparent hover:shadow-xs",
                Login:
                    "text-chart-1 border border-chart-1 hover:border-chart-2 hover:text-chart-2",
            },
            size: {
                size1: "h-[35px] w-[35px]",
                size2: "h-[20px] w-[105px]",
            },
        },
        defaultVariants: {
            variant: "PP",
            size: "size1",
        },
    }
)

function ButtonPP({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonPPVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="button"
            className={cn(buttonPPVariants({ variant, size, className }))}
            {...props}
        >
            {variant === "Login" && (
                <text>Login/Register</text>
            )}
        </Comp>
    )
}

export { ButtonPP, buttonPPVariants }