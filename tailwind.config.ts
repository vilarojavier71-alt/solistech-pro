import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // ============================================
            // TRUST & PRESTIGE COLOR SYSTEM
            // ============================================
            colors: {
                // Navy Depth - Primary (Institutional Trust)
                navy: {
                    50: "#F0F4F8",
                    100: "#D9E2EC",
                    200: "#BCCCDC",
                    300: "#9FB3C8",
                    400: "#829AB1",
                    500: "#3B5998",
                    600: "#2A4470",
                    700: "#1A2F52",
                    800: "#0F1F3D",
                    900: "#0A1628",
                    950: "#050B14",
                },

                // Slate Neutral - Professional Grays
                slate: {
                    50: "#F8FAFC",
                    100: "#F1F5F9",
                    200: "#E2E8F0",
                    300: "#CBD5E1",
                    400: "#94A3B8",
                    500: "#64748B",
                    600: "#475569",
                    700: "#334155",
                    800: "#1E293B",
                    900: "#0F172A",
                    950: "#020617",
                },

                // Teal Precision - Technical Actions
                teal: {
                    50: "#F0FDFA",
                    100: "#CCFBF1",
                    200: "#99F6E4",
                    300: "#5EEAD4",
                    400: "#22D3EE",
                    500: "#06B6D4",
                    600: "#0891B2",
                    700: "#0E7490",
                    800: "#155E75",
                    900: "#164E63",
                    950: "#083344",
                },

                // Gold Premium - Financial Actions
                gold: {
                    50: "#FEFCE8",
                    100: "#FEF9C3",
                    200: "#FEF08A",
                    400: "#FDE047",
                    500: "#EAB308",
                    600: "#CA8A04",
                    700: "#A16207",
                    800: "#854D0E",
                    900: "#713F12",
                    950: "#422006",
                },

                // Emerald Success - Confirmations
                emerald: {
                    50: "#ECFDF5",
                    100: "#D1FAE5",
                    200: "#A7F3D0",
                    300: "#6EE7B7",
                    400: "#34D399",
                    500: "#10B981",
                    600: "#059669",
                    700: "#047857",
                    800: "#065F46",
                    900: "#064E3B",
                    950: "#022C22",
                },

                // Amber Warning - Important Alerts
                amber: {
                    50: "#FFFBEB",
                    100: "#FEF3C7",
                    200: "#FDE68A",
                    300: "#FCD34D",
                    400: "#FBBF24",
                    500: "#F59E0B",
                    600: "#D97706",
                    700: "#B45309",
                    800: "#92400E",
                    900: "#78350F",
                    950: "#451A03",
                },

                // Rose Critical - Errors & Destructive
                rose: {
                    50: "#FFF1F2",
                    100: "#FFE4E6",
                    200: "#FECDD3",
                    300: "#FDA4AF",
                    400: "#FB7185",
                    500: "#F43F5E",
                    600: "#E11D48",
                    700: "#BE123C",
                    800: "#9F1239",
                    900: "#881337",
                    950: "#4C0519",
                },

                // Shadcn compatibility
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Zinc - Industrial Base
                zinc: {
                    50: "#fafafa",
                    100: "#f4f4f5",
                    200: "#e4e4e7",
                    300: "#d4d4d8",
                    400: "#a1a1aa",
                    500: "#71717a",
                    600: "#52525b",
                    700: "#3f3f46",
                    800: "#27272a",
                    900: "#18181b",
                    950: "#09090b",
                },
            },

            // ============================================
            // TYPOGRAPHY SYSTEM
            // ============================================
            fontFamily: {
                sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
            },

            fontSize: {
                // Display sizes
                "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
                "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
                "display-md": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],

                // Heading sizes
                "heading-xl": ["1.875rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
                "heading-lg": ["1.5rem", { lineHeight: "1.4", letterSpacing: "-0.005em", fontWeight: "600" }],
                "heading-md": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
                "heading-sm": ["1.125rem", { lineHeight: "1.5", fontWeight: "600" }],

                // Body sizes
                "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
                "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
                "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
                "body-xs": ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
            },

            // ============================================
            // SPACING SYSTEM (8px base)
            // ============================================
            spacing: {
                "0": "0",
                "1": "0.25rem",   // 4px
                "2": "0.5rem",    // 8px
                "3": "0.75rem",   // 12px
                "4": "1rem",      // 16px
                "5": "1.25rem",   // 20px
                "6": "1.5rem",    // 24px
                "8": "2rem",      // 32px
                "10": "2.5rem",   // 40px
                "12": "3rem",     // 48px
                "16": "4rem",     // 64px
                "20": "5rem",     // 80px
                "24": "6rem",     // 96px
            },

            // ============================================
            // BORDER RADIUS (Subtle Premium)
            // ============================================
            borderRadius: {
                none: "0",
                sm: "0.25rem",    // 4px - Badges, tags
                DEFAULT: "0.375rem", // 6px - Buttons, inputs
                md: "0.375rem",   // 6px
                lg: "0.5rem",     // 8px - Cards, modals (DEFAULT)
                xl: "0.75rem",    // 12px - Large cards
                "2xl": "1rem",    // 16px - Hero sections
                full: "9999px",   // Pills, avatars
            },

            // ============================================
            // BOX SHADOWS - MIDNIGHT PRIME (Glow Effects)
            // ============================================
            boxShadow: {
                none: "none",

                // Standard shadows (minimal use)
                sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
                DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
                md: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
                lg: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
                xl: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
                "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",

                // MIDNIGHT PRIME - Glow Shadows (Preferred)
                "glow-cyan-sm": "0 0 10px -2px rgba(6, 182, 212, 0.3)",
                "glow-cyan": "0 0 20px -5px rgba(6, 182, 212, 0.4), 0 0 10px -3px rgba(6, 182, 212, 0.2)",
                "glow-cyan-lg": "0 0 30px -5px rgba(6, 182, 212, 0.5), 0 0 15px -3px rgba(6, 182, 212, 0.3)",

                "glow-orange-sm": "0 0 10px -2px rgba(249, 115, 22, 0.3)",
                "glow-orange": "0 0 20px -5px rgba(249, 115, 22, 0.4), 0 0 10px -3px rgba(249, 115, 22, 0.2)",
                "glow-orange-lg": "0 0 30px -5px rgba(249, 115, 22, 0.5), 0 0 15px -3px rgba(249, 115, 22, 0.3)",

                "glow-emerald-sm": "0 0 10px -2px rgba(16, 185, 129, 0.3)",
                "glow-emerald": "0 0 20px -5px rgba(16, 185, 129, 0.4), 0 0 10px -3px rgba(16, 185, 129, 0.2)",

                "glow-rose-sm": "0 0 10px -2px rgba(244, 63, 94, 0.3)",
                "glow-rose": "0 0 20px -5px rgba(244, 63, 94, 0.4), 0 0 10px -3px rgba(244, 63, 94, 0.2)",

                // Subtle elevation (for cards)
                "elevation": "0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 0 20px -8px rgba(6, 182, 212, 0.1)",
                "elevation-lg": "0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 0 30px -10px rgba(6, 182, 212, 0.15)",
            },

            // ============================================
            // BACKDROP BLUR (Glassmorphism)
            // ============================================
            backdropBlur: {
                xs: "2px",
                sm: "4px",
                DEFAULT: "8px",
                md: "12px",
                lg: "16px",
                xl: "24px",
                "2xl": "40px",
                "3xl": "64px",
            },

            // ============================================
            // ANIMATIONS & TRANSITIONS
            // ============================================
            transitionDuration: {
                DEFAULT: "200ms",
                fast: "150ms",
                normal: "200ms",
                slow: "300ms",
                slower: "500ms",
            },

            transitionTimingFunction: {
                DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
                smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
                bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            },

            keyframes: {
                // Confirmation animations
                "scale-in-bounce": {
                    "0%": { transform: "scale(0.9)", opacity: "0" },
                    "50%": { transform: "scale(1.05)" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },

                // Loading animations
                "pulse-slow": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5" },
                },

                // Slide animations
                "slide-in-right": {
                    "0%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(0)" },
                },

                "slide-in-left": {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(0)" },
                },

                // Fade animations
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },

            animation: {
                "scale-in-bounce": "scale-in-bounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "slide-in-right": "slide-in-right 0.3s ease-out",
                "slide-in-left": "slide-in-left 0.3s ease-out",
                "fade-in": "fade-in 0.2s ease-out",
            },
        },
    },
    plugins: [],
};

export default config;
