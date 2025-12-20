"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    fullWidth?: boolean;
}

export function PageShell({
    title,
    description,
    action,
    children,
    fullWidth = false,
    className,
    ...props
}: PageShellProps) {
    return (
        <div
            className={cn(
                "min-h-[calc(100vh-4rem)] w-full bg-background bg-noise",
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    "mx-auto space-y-8 p-8 transition-all duration-300 ease-in-out",
                    fullWidth ? "w-full" : "max-w-7xl"
                )}
            >
                {/* Header Section */}
                {(title || action) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                    >
                        <div className="space-y-1.5">
                            {title && (
                                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-gradient-silver">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="text-muted-foreground text-lg">
                                    {description}
                                </p>
                            )}
                        </div>
                        {action && <div className="flex items-center gap-2">{action}</div>}
                    </motion.div>
                )}

                {/* Content Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                    className="relative"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
