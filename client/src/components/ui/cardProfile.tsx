import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ButtonAccept } from "./Button/buttonAccept"
import { PiX } from "react-icons/pi"
import { Counter } from "./counter"
import TripleButton from "./Button/tripleButton"

const cardProfileVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                CardProfileUser:
                    "bg-chart-3",
                CardProfilePublic:
                    "bg-chart-3",
                CardProfilePrivate:
                    "bg-chart-3",                
                CardGroup:
                    "bg-chart-3",
            },
            size: {
                size1: "h-[100px] w-screen",
            },
        },
        defaultVariants: {
            variant: "CardProfileUser",
            size: "size1",
        },
    }
)

function CardProfile({
    className,
    variant,
    size,
    asChild = false,
    children,
    ...props
}: React.ComponentProps<"div"> &
    VariantProps<typeof cardProfileVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "div"

    const handleClick = (message: string) => {
        alert(message);
    };



    return (
        <Comp
            className={cn(cardProfileVariants({ variant, size, className }))}
            {...props}
        >

        <span>{children}</span>
        {variant === "CardProfileUser" && (
            <>
            <img src="https://tse2.mm.bing.net/th/id/OIP.vg1KOuYtiZI2V0_ZXB-05gHaGc?r=0&pid=Api" alt="Profile" className="h-[30%]"></img>
            <text className="text-chart-1 text-left pl-[5px]">userName</text>
            <ButtonAccept>Private</ButtonAccept>
            <ButtonAccept>Édit</ButtonAccept>
            <br></br>
            <Counter variant="CounterFollowers"></Counter>
            <Counter variant="CounterFollowing"></Counter>
            <Counter variant="CounterPosts"></Counter>
            <text>bio</text>
            <TripleButton
                    buttons={[
                        { label: 'Post', onClick: () => handleClick('Tu as cliqué sur le 1')},
                        { label: 'Comments', onClick: () => handleClick('Tu as cliqué sur le 2')},
                        { label: 'Likes', onClick: () => handleClick('Tu as cliqué sur le 3')},
                    ]}></TripleButton>
            </>
        )}

        </Comp>
    )
}

export { CardProfile, cardProfileVariants }