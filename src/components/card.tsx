import { cn } from '@/libs/utils';
import { ThemedView } from './themed-view';

type CardProps = {
    children: React.ReactNode;
    className?: string;
}

const tokens = {
    container: 'flex-row items-center justify-between p-4 rounded-2xl border border-border dark:border-border-dark',
}

export default function Card(props: CardProps) {
    const {children, className} = props;
  return (
    <ThemedView type='background' className={cn(tokens.container, className)}>
        {children}
    </ThemedView>
  )
}

Card.displayName = 'Card'