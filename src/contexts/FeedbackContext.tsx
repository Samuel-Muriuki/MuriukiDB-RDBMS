import { createContext, useContext, ReactNode } from 'react';
import { useSounds, SoundsContextType } from '@/hooks/useSounds';

interface FeedbackContextType {
  sounds: SoundsContextType;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const sounds = useSounds();

  return (
    <FeedbackContext.Provider value={{ sounds }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

// Optional hook that doesn't throw if outside provider
export function useFeedbackOptional() {
  return useContext(FeedbackContext);
}
