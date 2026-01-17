import * as Sentry from '@sentry/react';

// Temporary test button to verify Sentry error tracking
// Remove this component after testing is complete
function SentryTestButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first Sentry test error!');
      }}
      className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs rounded hover:bg-destructive/90 transition-colors"
    >
      Test Sentry
    </button>
  );
}

export default SentryTestButton;
