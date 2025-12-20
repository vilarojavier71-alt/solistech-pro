"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlowCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    variant?: "default" | "glass" | "neon";
    noPadding?: boolean;
}

export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
    ({ className, children, variant = "default", noPadding = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                    "relative overflow-hidden rounded-xl border border-border/50 bg-card/50 text-card-foreground shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 group",
                    variant === "glass" && "bg-white/5 border-white/10",
                    variant === "neon" && "border-primary/20 hover:border-primary/50 shadow-primary/5",
                    className
                )}
                {...props}
            >
                {/* Glow Effect Gradient */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Subtle Shine */}
                <div className="absolute inset-0 -z-10 translate-x-[-100%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100" />

                <div className={cn("relative", !noPadding && "p-6")}>
                    {children}
                </div>
            </motion.div>
        );
    }
);
GlowCard.displayName = "GlowCard";

export const GlowCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6 pb-2", className)}
        {...props}
    />
));
GlowCardHeader.displayName = "GlowCardHeader";

export const GlowCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight text-gradient-silver bg-clip-text text-transparent",
            className
        )}
        {...props}
    />
));
GlowCardTitle.displayName = "GlowCardTitle";

export const GlowCardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
GlowCardDescription.displayName = "GlowCardDescription";

export const GlowCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
GlowCardContent.displayName = "GlowCardContent";

export const GlowCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0 mt-auto", className)}
        {...props}
    />
));
GlowCardFooter.displayName = "GlowCardFooter";
