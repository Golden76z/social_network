import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonNavBarVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                Home:
                    "",
                Post:
                    "",
                Chat:
                    "",
                Profile:
                    "",
                Login:
                    "",
            },
            size: {
                size1: "h-[45px] w-[30px]",
            },
        },
        defaultVariants: {
            variant: "Home",
            size: "size1",
        },
    }
)

function ButtonNavBar({
    className,
    variant,
    size,
    asChild = false,
    children,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonNavBarVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="button"
            className={cn(buttonNavBarVariants({ variant, size, className }))}
            {...props}
        >

        <span>{children}</span>
        {variant === "Home" && (
            <div className="flex justify-evenly flex-col items-center gap-1">
            <div className="w-8 h-8 border-2 border-current rounded-full" />
            <span className="text-xs">Home</span>
            </div>
        )}

        {variant === "Post" && (
            <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 border-2 border-current rounded-full" />
            <span className="text-xs">Post</span>
            </div>
        )}

        {variant === "Chat" && (
            <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 border-2 border-current rounded-full" />
            <span className="text-xs">Chat</span>
            </div>
        )}

        {variant === "Profile" && (
            <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 border-2 border-current rounded-full" />
            <span className="text-xs">Profile</span>
            </div>
        )}

        {variant === "Login" && (
            <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 border-2 border-current rounded-full" />
            <span className="text-xs">Login/Register</span>
            </div>
        )}
        </Comp>
    )
}

export { ButtonNavBar, buttonNavBarVariants }