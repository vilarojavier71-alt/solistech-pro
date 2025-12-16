'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ShinyButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode
    className?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
    ({ children, className, variant = 'primary', ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                initial={{ "--x": "100%", scale: 1 } as any}
                animate={{ "--x": "-100%" } as any}
                transition={{
                    repeat: Infinity,
                    repeatType: "loop",
                    repeatDelay: 1,
                    type: "spring",
                    stiffness: 20,
                    damping: 15,
                    mass: 2,
                    scale: {
                        type: "spring",
                        stiffness: 10,
                        damping: 5,
                        mass: 0.1,
                    },
                }}
                className={cn(
                    "relative rounded-lg px-6 py-2 font-medium backdrop-blur-xl transition-all duration-300 ease-out overflow-hidden",
                    "border border-white/10 shadow-[0_0_20px_-12px_rgba(255,255,255,0.5)]",
                    variant === 'primary' && "bg-zinc-900/80 text-white hover:border-emerald-500/50 hover:shadow-emerald-500/20",
                    variant === 'secondary' && "bg-white/5 text-zinc-200 hover:bg-white/10 hover:border-white/20",
                    variant === 'outline' && "bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700",
                    className
                )}
                {...props}
            >
                <span
                    className="relative block h-full w-full text-sm font-semibold tracking-wide"
                    style={{
                        maskImage:
                            "linear-gradient(-75deg,hsl(var(--primary)) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),hsl(var(--primary)) calc(var(--x) + 100%))",
                    }}
                >
                    {children}
                </span>
                <span
                    style={{
                        mask: "linear-gradient(-75deg,hsl(var(--primary)) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),hsl(var(--primary)) calc(var(--x) + 100%))",
                    }}
                    className="absolute inset-0 block h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent p-px mix-blend-overlay"
                />
                {/* Shine Animation overlay */}
                <span className="absolute inset-0 block h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </motion.button>
        )
    }
)
ShinyButton.displayName = "ShinyButton"
