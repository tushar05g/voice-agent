import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center text-center">
        <Bot className="mb-4 h-16 w-16 text-indigo-500" />

        <p className="text-foreground max-w-prose pt-1 leading-6 font-medium">
          Chat live with your voice AI agent
        </p>

        <Button
          size="lg"
          onClick={onStartCall}
          className="mt-6 w-64 rounded-full font-mono text-xs font-bold tracking-wider uppercase bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {startButtonText}
        </Button>
      </section>
    </div>
  );
};
