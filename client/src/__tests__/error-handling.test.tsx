/**
 * Test suite for the error handling system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorProvider, useError } from '@/lib/error/errorContext';
import { UserFriendlyError, ErrorToastContainer, FormError } from '@/components/ui/UserFriendlyError';
import { ERROR_CODES } from '@/lib/config/api';

// Test component that uses the error context
const TestErrorComponent = () => {
  const { addError, errors, removeError } = useError();

  const triggerError = () => {
    addError({
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'Test error message',
      details: 'Test error details'
    });
  };

  const triggerNetworkError = () => {
    addError({
      code: ERROR_CODES.NETWORK_ERROR,
      message: 'Network connection failed'
    });
  };

  return (
    <div>
      <button onClick={triggerError} data-testid="trigger-error">
        Trigger Error
      </button>
      <button onClick={triggerNetworkError} data-testid="trigger-network-error">
        Trigger Network Error
      </button>
      <button onClick={() => removeError(errors[0]?.id)} data-testid="remove-error">
        Remove Error
      </button>
      <div data-testid="error-count">{errors.length}</div>
    </div>
  );
};

describe('Error Context', () => {
  test('should provide error context to components', () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );

    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  test('should add errors to context', async () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('trigger-error'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    });
  });

  test('should remove errors from context', async () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('trigger-error'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByTestId('remove-error'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });
  });
});

describe('UserFriendlyError Component', () => {
  const mockError = {
    id: 'test-error',
    code: ERROR_CODES.UNAUTHORIZED,
    message: 'Please log in to continue',
    timestamp: new Date(),
    details: 'Test details'
  };

  test('should render error with correct icon and message', () => {
    render(
      <UserFriendlyError 
        error={mockError} 
        variant="inline"
      />
    );

    expect(screen.getByText('🔐')).toBeInTheDocument();
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please log in to continue using this feature.')).toBeInTheDocument();
  });

  test('should render different variants correctly', () => {
    const { rerender } = render(
      <UserFriendlyError 
        error={mockError} 
        variant="toast"
      />
    );

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();

    rerender(
      <UserFriendlyError 
        error={mockError} 
        variant="modal"
      />
    );

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
  });

  test('should handle dismiss callback', () => {
    const onDismiss = jest.fn();
    
    render(
      <UserFriendlyError 
        error={mockError} 
        variant="toast"
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByRole('button');
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('FormError Component', () => {
  test('should render form error correctly', () => {
    const error = {
      id: 'form-error',
      code: ERROR_CODES.REQUIRED_FIELD,
      message: 'This field is required',
      timestamp: new Date()
    };

    render(<FormError error={error} />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('should not render when no error provided', () => {
    const { container } = render(<FormError />);
    expect(container.firstChild).toBeNull();
  });
});

describe('ErrorToastContainer Component', () => {
  test('should render error toasts', async () => {
    render(
      <ErrorProvider>
        <TestErrorComponent />
        <ErrorToastContainer />
      </ErrorProvider>
    );

    fireEvent.click(screen.getByTestId('trigger-error'));
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
  });

  test('should not render when no errors', () => {
    const { container } = render(
      <ErrorProvider>
        <ErrorToastContainer />
      </ErrorProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('Error Code Mapping', () => {
  test('should map error codes to correct messages', () => {
    const testCases = [
      { code: ERROR_CODES.UNAUTHORIZED, expectedIcon: '🔐', expectedTitle: 'Authentication Required' },
      { code: ERROR_CODES.FILE_TOO_LARGE, expectedIcon: '📁', expectedTitle: 'File Too Large' },
      { code: ERROR_CODES.NETWORK_ERROR, expectedIcon: '🌐', expectedTitle: 'Connection Problem' },
      { code: ERROR_CODES.VALIDATION_ERROR, expectedIcon: '⚠️', expectedTitle: 'Invalid Input' },
    ];

    testCases.forEach(({ code, expectedIcon, expectedTitle }) => {
      const error = {
        id: 'test',
        code,
        message: 'Test message',
        timestamp: new Date()
      };

      const { container } = render(
        <UserFriendlyError error={error} variant="inline" />
      );

      expect(container).toHaveTextContent(expectedIcon);
      expect(container).toHaveTextContent(expectedTitle);
    });
  });
});
