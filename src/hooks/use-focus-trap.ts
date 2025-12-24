/**
 * 🎨 MPE-OS V3.0.0 - FOCUS TRAP HOOK
 * 
 * WCAG 2.1.1 Compliant Focus Management
 * Traps focus within a modal/dialog to prevent keyboard navigation outside
 */

import { useEffect, useRef } from 'react'

interface UseFocusTrapOptions {
  /**
   * Whether the trap is active
   */
  isActive: boolean
  /**
   * Optional callback when focus escapes (should not happen in normal use)
   */
  onEscape?: () => void
}

/**
 * Hook to trap focus within a container element
 * 
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null)
 * useFocusTrap({ isActive: isOpen, onEscape: handleClose })
 * 
 * return (
 *   <div ref={modalRef}>
 *     Modal content
 *   </div>
  * )
 * ```
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: UseFocusTrapOptions
) {
  const { isActive, onEscape } = options
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => {
          // Filter out hidden elements
          return (
            el.offsetWidth > 0 &&
            el.offsetHeight > 0 &&
            !el.hasAttribute('aria-hidden')
          )
        }
      )
    }

    const focusableElements = getFocusableElements()

    if (focusableElements.length === 0) {
      // If no focusable elements, focus the container itself
      container.setAttribute('tabindex', '-1')
      container.focus()
      return
    }

    // Focus the first element
    const firstElement = focusableElements[0]
    firstElement.focus()

    // Handle Tab key to cycle through elements
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      )

      if (e.shiftKey) {
        // Shift + Tab: go to previous element
        if (currentIndex === 0) {
          e.preventDefault()
          focusableElements[focusableElements.length - 1].focus()
        }
      } else {
        // Tab: go to next element
        if (currentIndex === focusableElements.length - 1) {
          e.preventDefault()
          focusableElements[0].focus()
        }
      }
    }

    // Handle Escape key
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        e.stopPropagation()
        onEscape()
      }
    }

    container.addEventListener('keydown', handleTabKey)
    container.addEventListener('keydown', handleEscapeKey)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
      container.removeEventListener('keydown', handleEscapeKey)

      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive, containerRef, onEscape])
}


