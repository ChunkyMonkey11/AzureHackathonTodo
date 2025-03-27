/**
 * Error Handler Utility
 * Provides centralized error handling and logging functionality.
 */

// Error severity levels
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Handle and log errors in a consistent way
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @param {string} severity - Error severity level
 * @param {Object} additionalData - Any additional data to log
 */
export const handleError = (error, context, severity = ErrorSeverity.ERROR, additionalData = {}) => {
  // Create error object with metadata
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    severity,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', errorLog);
  }

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement production error logging
    // Example: sendToLoggingService(errorLog);
  }

  // Return user-friendly error message
  return getUserFriendlyError(error, context);
};

/**
 * Convert technical errors to user-friendly messages
 */
const getUserFriendlyError = (error, context) => {
  // Add specific error mappings here
  const errorMappings = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'Account not found. Please check your credentials.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'permission-denied': 'You don\'t have permission to perform this action.',
    'network-error': 'Network error. Please check your connection and try again.',
    'database-error': 'Unable to save changes. Please try again later.'
  };

  // Check if we have a specific mapping for this error
  const errorCode = error.code || error.message;
  const userMessage = errorMappings[errorCode] || 'An unexpected error occurred. Please try again.';

  return {
    userMessage,
    errorCode,
    context
  };
};

/**
 * Error Boundary Component
 */
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    handleError(error, 'ErrorBoundary', ErrorSeverity.CRITICAL, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-700 text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-red-600">We're sorry for the inconvenience. Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
} 