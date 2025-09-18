import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getUserFromToken: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Test component that simulates a login form
const LoginForm = () => {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      setError('');
    } catch (err) {
      setError('Login failed');
    }
  };

  if (isAuthenticated) {
    return (
      <div>
        <h2>Welcome, {user?.nickname}!</h2>
        <p>Email: {user?.email}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        data-testid="email-input"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        data-testid="password-input"
      />
      <button type="submit" disabled={isLoading} data-testid="login-button">
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </form>
  );
};

// Test component that simulates a protected page
const ProtectedPage = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in to access this page</div>;
  }

  return (
    <div>
      <h1>Protected Page</h1>
      <p>Welcome, {user?.nickname}!</p>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('should handle complete login flow', async () => {
    const mockLoginResponse = {
      user: {
        id: 123,
        email: 'test@example.com',
        nickname: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '1990-01-01',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        is_private: false,
        created_at: '2023-01-01T00:00:00Z',
        followers: 0,
        followed: 0,
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockLoginResponse);
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(null);

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('login-button')).not.toBeDisabled();
    });

    // Fill in login form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByTestId('login-button'));

    // Check loading state
    expect(screen.getByTestId('login-button')).toHaveTextContent('Logging in...');

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
    });

    // Verify API was called correctly
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle login failure', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(null);

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-button')).not.toBeDisabled();
    });

    // Fill in login form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpassword' },
    });

    // Submit form
    fireEvent.click(screen.getByTestId('login-button'));

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Login failed');
    });

    // Should still show login form
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
  });

  it('should handle logout flow', async () => {
    const mockTokenData = {
      userid: '123',
      username: 'testuser',
    };

    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(mockTokenData);
    (apiClient.post as jest.Mock).mockResolvedValue({});

    render(
      <AuthProvider>
        <ProtectedPage />
      </AuthProvider>
    );

    // Wait for authentication
    await waitFor(() => {
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
    });

    // Click logout
    fireEvent.click(screen.getByTestId('logout-button'));

    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByText('Please log in to access this page')).toBeInTheDocument();
    });

    // Verify logout API was called
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', {});
  });

  it('should handle token-based authentication on page load', async () => {
    const mockTokenData = {
      userid: '123',
      username: 'testuser',
    };

    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(mockTokenData);
    (apiClient.get as jest.Mock).mockResolvedValue({
      user: {
        id: 123,
        email: 'test@example.com',
        nickname: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: '1990-01-01',
        bio: 'Test bio',
        avatar: 'avatar.jpg',
        is_private: false,
        created_at: '2023-01-01T00:00:00Z',
        followers: 0,
        followed: 0,
      },
    });

    render(
      <AuthProvider>
        <ProtectedPage />
      </AuthProvider>
    );

    // Should authenticate automatically
    await waitFor(() => {
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
    });

    // Verify token was checked
    expect(apiClient.getUserFromToken).toHaveBeenCalled();
  });

  it('should handle token-based authentication when backend is unavailable', async () => {
    const mockTokenData = {
      userid: '123',
      username: 'testuser',
    };

    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(mockTokenData);
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Backend unavailable'));

    render(
      <AuthProvider>
        <ProtectedPage />
      </AuthProvider>
    );

    // Should still authenticate with token data
    await waitFor(() => {
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
    });

    // Verify token was checked
    expect(apiClient.getUserFromToken).toHaveBeenCalled();
  });

  it('should handle registration flow', async () => {
    const mockRegisterResponse = {
      user: {
        id: 456,
        email: 'newuser@example.com',
        nickname: 'newuser',
        first_name: 'New',
        last_name: 'User',
        date_of_birth: '1995-01-01',
        bio: '',
        avatar: '',
        is_private: false,
        created_at: '2023-01-01T00:00:00Z',
        followers: 0,
        followed: 0,
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockRegisterResponse);
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(null);

    const RegisterForm = () => {
      const { register, isLoading, isAuthenticated, user } = useAuth();
      const [formData, setFormData] = React.useState({
        nickname: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        date_of_birth: '',
      });

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await register(formData);
      };

      if (isAuthenticated) {
        return <div>Welcome, {user?.nickname}!</div>;
      }

      return (
        <form onSubmit={handleSubmit}>
          <input
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            placeholder="Nickname"
            data-testid="nickname-input"
          />
          <input
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
            data-testid="email-input"
          />
          <input
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Password"
            data-testid="password-input"
          />
          <button type="submit" disabled={isLoading} data-testid="register-button">
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      );
    };

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('register-button')).not.toBeDisabled();
    });

    // Fill in registration form
    fireEvent.change(screen.getByTestId('nickname-input'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByTestId('register-button'));

    // Wait for registration to complete
    await waitFor(() => {
      expect(screen.getByText('Welcome, newuser!')).toBeInTheDocument();
    });

    // Verify API was called correctly
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      nickname: 'newuser',
      first_name: '',
      last_name: '',
      email: 'newuser@example.com',
      password: 'password123',
      date_of_birth: '',
    });
  });
});
