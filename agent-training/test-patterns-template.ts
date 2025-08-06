// Test Patterns Template for Jest + React Testing Library
// Agent Training: Comprehensive testing patterns for React/TypeScript projects

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

// 1. Component Testing Pattern
describe('Component Testing Pattern', () => {
  // Setup user event instance
  const user = userEvent.setup();

  test('renders and handles user interaction', async () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(button).toBeInTheDocument();
  });

  test('conditional rendering based on props', () => {
    const { rerender } = render(<Alert type="success" message="Success!" />);
    
    expect(screen.getByText('Success!')).toHaveClass('alert-success');
    
    rerender(<Alert type="error" message="Error!" />);
    expect(screen.getByText('Error!')).toHaveClass('alert-error');
  });
});

// 2. API Mocking Pattern with MSW
const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id,
        name: 'John Doe',
        email: 'john@example.com',
      })
    );
  }),
  
  rest.post('/api/payments', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        paymentId: 'pay_123',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration Testing', () => {
  test('fetches and displays user data', async () => {
    render(<UserProfile userId="123" />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Override handler for this test
    server.use(
      rest.get('/api/users/:id', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading user/i)).toBeInTheDocument();
    });
  });
});

// 3. Form Testing Pattern
describe('Form Testing Pattern', () => {
  test('validates and submits form data', async () => {
    const handleSubmit = jest.fn();
    render(<PaymentForm onSubmit={handleSubmit} />);

    const user = userEvent.setup();

    // Fill form fields
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    
    // Select expiry date
    await user.selectOptions(screen.getByLabelText(/expiry month/i), '12');
    await user.selectOptions(screen.getByLabelText(/expiry year/i), '2025');

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit payment/i }));

    // Verify submission
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        cardNumber: '4242424242424242',
        cvv: '123',
        expiryMonth: '12',
        expiryYear: '2025',
      });
    });
  });

  test('displays validation errors', async () => {
    render(<PaymentForm onSubmit={jest.fn()} />);
    const user = userEvent.setup();

    // Submit without filling required fields
    await user.click(screen.getByRole('button', { name: /submit payment/i }));

    // Check for validation errors
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/card number is required/i)).toBeInTheDocument();
  });
});

// 4. Custom Hook Testing Pattern
import { renderHook, act } from '@testing-library/react';

describe('Custom Hook Testing', () => {
  test('usePayment hook manages payment state', async () => {
    const { result } = renderHook(() => usePayment());

    // Initial state
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();

    // Process payment
    await act(async () => {
      await result.current.processPayment({
        amount: 1000,
        currency: 'USD',
      });
    });

    // Check success state
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.paymentId).toBe('pay_123');
  });
});

// 5. Context Testing Pattern
describe('Context Testing', () => {
  test('provides and consumes context values', () => {
    const TestComponent = () => {
      const { user, isAuthenticated } = useAuthContext();
      return (
        <div>
          {isAuthenticated ? `Welcome ${user.name}` : 'Please login'}
        </div>
      );
    };

    render(
      <AuthProvider initialUser={{ name: 'John', email: 'john@example.com' }}>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Welcome John')).toBeInTheDocument();
  });
});

// 6. Accessibility Testing Pattern
describe('Accessibility Testing', () => {
  test('modal is keyboard accessible', async () => {
    render(<Modal isOpen={true} onClose={jest.fn()} />);
    const user = userEvent.setup();

    // Check focus management
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(document.activeElement).toBe(closeButton);

    // Test escape key
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('form has proper ARIA labels', () => {
    render(<PaymentForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
    expect(screen.getByRole('button', { name: /submit payment/i })).toBeEnabled();
  });
});

// 7. Snapshot Testing Pattern
describe('Snapshot Testing', () => {
  test('renders correctly', () => {
    const { container } = render(
      <Card title="Payment Summary" amount={1000} currency="USD" />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});

// 8. Timer and Async Testing Pattern
describe('Timer and Async Testing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('debounces search input', async () => {
    const handleSearch = jest.fn();
    render(<SearchInput onSearch={handleSearch} debounceMs={500} />);

    const input = screen.getByRole('searchbox');
    
    // Type multiple characters
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: 'test query' } });

    // Search shouldn't be called yet
    expect(handleSearch).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now it should be called once with final value
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith('test query');
  });
});

// 9. Error Boundary Testing Pattern
describe('Error Boundary Testing', () => {
  test('catches and displays errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

// 10. Performance Testing Pattern
describe('Performance Testing', () => {
  test('memoizes expensive calculations', () => {
    const expensiveCalculation = jest.fn((n: number) => n * 2);
    
    const Component = ({ value }: { value: number }) => {
      const result = useMemo(() => expensiveCalculation(value), [value]);
      return <div>{result}</div>;
    };

    const { rerender } = render(<Component value={5} />);
    expect(expensiveCalculation).toHaveBeenCalledTimes(1);

    // Same prop - should not recalculate
    rerender(<Component value={5} />);
    expect(expensiveCalculation).toHaveBeenCalledTimes(1);

    // Different prop - should recalculate
    rerender(<Component value={10} />);
    expect(expensiveCalculation).toHaveBeenCalledTimes(2);
  });
});

// Test Utilities
export const createMockPayment = (overrides = {}) => ({
  id: 'pay_123',
  amount: 1000,
  currency: 'USD',
  status: 'succeeded',
  ...overrides,
});

export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};