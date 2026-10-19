import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge the STHM-only class names from global.css so they
// override each other like built-in ones (`rounded-xl` vs `rounded-pill`).
const twMerge = extendTailwindMerge<'typography'>({
    extend: {
        theme: {
            radius: ['pill'],
        },
        classGroups: {
            'font-family': [{ font: ['onest', 'onest-medium', 'onest-semibold', 'onest-bold'] }],
            typography: [{ type: ['display', 'title', 'heading', 'subhead', 'body-strong', 'body', 'label', 'caption'] }],
        },
    },
});

/**
 * Merges Tailwind CSS classes with proper precedence
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
