"use client"

import { AppBar } from "./ui/appBar";
import { ButtonAccept } from "./ui/Button/buttonAccept";
import { CardProfile } from "./ui/cardProfile";

export function TestForm({
    className,
    ...props
    }: React.ComponentProps<"div">) {
    return (
        <div className={className} {...props}>
            <CardProfile variant={"CardProfileUser"}></CardProfile>
        </div>
    );
    }