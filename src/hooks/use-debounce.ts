import { useEffect, useState } from 'react'

/**
 * Debounces a value, returning the latest value only after the specified delay has elapsed without changes.
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return (): void => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}