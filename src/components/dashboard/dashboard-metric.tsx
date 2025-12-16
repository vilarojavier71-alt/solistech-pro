import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardMetricProps {
    icon: LucideIcon
    value: string | number
    label: string
    secondary?: string
    trend?: {
        value: string
        positive: boolean
    }
    className?: string
    variant?: "default" | "highlight"
}

export function DashboardMetric({
    icon: Icon,
    value,
    label,
    secondary,
    trend,
    className,
    variant = "default"
}: DashboardMetricProps) {
    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border/60",
            variant === "highlight"
                ? "bg-gradient-to-br from-background to-primary/5 hover:to-primary/10 border-primary/20"
                : "bg-card/50 hover:bg-card/80",
            className
        )}>
            <CardContent className="p-6 flex flex-col items-start gap-4">
                {/* 1. Icono Grande */}
                <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    variant === "highlight"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                )}>
                    <Icon className="w-8 h-8" strokeWidth={1.5} />
                </div>

                <div className="space-y-1">
                    {/* 2. Valor Principal (Huge) */}
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-foreground">
                            {value}
                        </h3>
                        {trend && (
                            <span className={cn(
                                "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                                trend.positive
                                    ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400"
                                    : "text-rose-600 bg-rose-100 dark:bg-rose-950 dark:text-rose-400"
                            )}>
                                {trend.value}
                            </span>
                        )}
                    </div>

                    {/* 3. TÃ­tulo (Label) */}
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </p>
                </div>

                {/* 4. MÃ©trica Secundaria */}
                {secondary && (
                    <div className="pt-2 mt-auto border-t border-border/50 w-full">
                        <p className="text-xs text-muted-foreground/80 truncate">
                            {secondary}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
