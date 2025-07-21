"use client"

import { AppBar } from "./ui/Button/appBar";
import { ButtonAccept } from "./ui/Button/buttonAccept";

export function TestForm({
    className,
    ...props
    }: React.ComponentProps<"div">) {
    return (
        <div className={className} {...props}>
            <ButtonAccept variant={"SecondaryRest"} size="size3">
                Accept
            </ButtonAccept>
            <br></br>
            <AppBar variant={"Heading1"} size="size1">
                heading
            </AppBar>
        </div>
    );
    }