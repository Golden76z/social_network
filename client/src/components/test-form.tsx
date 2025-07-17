"use client"

import { ButtonAccept } from "./ui/Button/buttonAccept";

export function TestForm({
    className,
    ...props
    }: React.ComponentProps<"div">) {
    return (
        <div className={className} {...props}>
            <ButtonAccept>
                Accept
            </ButtonAccept>
        </div>
    );
    }