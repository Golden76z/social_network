import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ButtonPP } from "./Button/buttonPP"
import { ButtonNavBar } from "./Button/buttonNavBar"

const appBarVariants = cva(
    "inline-flex items-center  gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                Heading1:
                    "border border-chart-1",
                Heading2:
                    "border border-chart-1",
                NavBar1:
                    "border border-chart-1",
                NavBar2:
                    "border border-chart-1",
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
            className={cn(appBarVariants({ variant, size, className }))}
            {...props}
        >
            <span>{children}</span>
            {variant === "Heading1" && (
                <><text className="text-chart-1 text-left pl-[5px]">Deustagram</text>
                <ButtonPP variant={"PP"} size={"size1"} className="ml-auto pl-[5px]">
                </ButtonPP></>
            )}

            {variant === "Heading2" && (
                <><text className="text-chart-1 text-left pl-[5px]">Deustagram</text>
                <ButtonPP variant={"Login"} size="size2">
                </ButtonPP></>
            )}
            {variant === "NavBar1" && (
            <div className="flex justify-evenly w-full">
                <ButtonNavBar variant={"Home"} size="size1">
                </ButtonNavBar>
                <ButtonNavBar variant={"Post"} size="size1">
                </ButtonNavBar>
                <ButtonNavBar variant={"Chat"} size="size1">
                </ButtonNavBar>
                <ButtonNavBar variant={"Profile"} size="size1">
                </ButtonNavBar>
            </div>
            )}
            {variant === "NavBar2" && (
            <div className="flex justify-evenly w-full">
                <ButtonNavBar variant={"Home"} size="size1">
                </ButtonNavBar>
                <ButtonNavBar variant={"Login"} size="size1">
                </ButtonNavBar>
            </div>
            )}
        </Comp>
    )
}

export { AppBar, appBarVariants }