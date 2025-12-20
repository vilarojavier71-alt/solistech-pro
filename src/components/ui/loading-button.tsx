import { Button, type ButtonProps } from './button'
import { Loader2 } from 'lucide-react'

interface LoadingButtonProps extends ButtonProps {
    loading?: boolean
    loadingText?: string
}

export function LoadingButton({
    loading,
    loadingText,
    children,
    disabled,
    ...props
}: LoadingButtonProps) {
    return (
        <Button {...props} disabled={loading || disabled}>
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText || 'Cargando...'}
                </>
            ) : (
                children
            )}
        </Button>
    )
}
