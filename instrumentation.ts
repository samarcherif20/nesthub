// instrumentation.ts
export async function register() {
  // Only run on Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Setting up development cron triggers...');
      
      // Dynamic import to avoid issues
      const { startDevCron } = await import('./lib/dev-cron-trigger');
      
      // Wait a bit for the server to be ready
      setTimeout(() => {
        startDevCron();
      }, 5000);
    }
  }
}