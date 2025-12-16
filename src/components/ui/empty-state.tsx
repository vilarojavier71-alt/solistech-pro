import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: LucideIcon
    title: string
    description: string
    action?: ReactNode
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50",
                className
            )}
            {...props}
        >
            {Icon && (
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
            <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm text-center">
                {description}
            </p>
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    )
}
