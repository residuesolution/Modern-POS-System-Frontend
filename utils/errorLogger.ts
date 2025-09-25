export function logError(error: any, context?: string) {
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
}