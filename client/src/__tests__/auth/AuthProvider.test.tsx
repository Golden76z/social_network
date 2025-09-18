import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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

// Test component that uses auth
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, hasCheckedAuth } = useAuth();
  
  return (
    <div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="hasCheckedAuth">{hasCheckedAuth.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('should initialize with loading state', async () => {
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(null);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('hasCheckedAuth')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('hasCheckedAuth')).toHaveTextContent('true');
  });

  it('should detect JWT token and set user', async () => {
    const mockTokenData = {
      userid: '123',
      username: 'testuser',
    };
    
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(mockTokenData);
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Backend unavailable'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('hasCheckedAuth')).toHaveTextContent('true');
    });

    const userData = JSON.parse(screen.getByTestId('user').textContent || '{}');
    expect(userData.id).toBe(123);
    expect(userData.nickname).toBe('testuser');
  });

  it('should handle successful login', async () => {
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

    const TestLoginComponent = () => {
      const { login, isLoading, isAuthenticated, hasCheckedAuth } = useAuth();
      const [loginResult, setLoginResult] = React.useState<string>('');

      const handleLogin = async () => {
        try {
          await login('test@example.com', 'password');
          setLoginResult('success');
        } catch (error) {
          setLoginResult('error');
        }
      };

      return (
        <div>
          <div data-testid="isLoading">{isLoading.toString()}</div>
          <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
          <div data-testid="hasCheckedAuth">{hasCheckedAuth.toString()}</div>
          <button onClick={handleLogin} data-testid="loginButton">Login</button>
          <div data-testid="loginResult">{loginResult}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hasCheckedAuth')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByTestId('loginButton').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('loginResult')).toHaveTextContent('success');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
  });

  it('should handle login failure', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(null);

    const TestLoginComponent = () => {
      const { login, isLoading, isAuthenticated, hasCheckedAuth } = useAuth();
      const [loginResult, setLoginResult] = React.useState<string>('');

      const handleLogin = async () => {
        try {
          await login('test@example.com', 'wrongpassword');
          setLoginResult('success');
        } catch (error) {
          setLoginResult('error');
        }
      };

      return (
        <div>
          <div data-testid="isLoading">{isLoading.toString()}</div>
          <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
          <div data-testid="hasCheckedAuth">{hasCheckedAuth.toString()}</div>
          <button onClick={handleLogin} data-testid="loginButton">Login</button>
          <div data-testid="loginResult">{loginResult}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hasCheckedAuth')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByTestId('loginButton').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('loginResult')).toHaveTextContent('error');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  it('should handle logout', async () => {
    const mockTokenData = {
      userid: '123',
      username: 'testuser',
    };
    
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(mockTokenData);
    (apiClient.post as jest.Mock).mockResolvedValue({});

    const TestLogoutComponent = () => {
      const { logout, isLoading, isAuthenticated, hasCheckedAuth } = useAuth();
      const [logoutResult, setLogoutResult] = React.useState<string>('');

      const handleLogout = async () => {
        try {
          await logout();
          setLogoutResult('success');
        } catch (error) {
          setLogoutResult('error');
        }
      };

      return (
        <div>
          <div data-testid="isLoading">{isLoading.toString()}</div>
          <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
          <div data-testid="hasCheckedAuth">{hasCheckedAuth.toString()}</div>
          <button onClick={handleLogout} data-testid="logoutButton">Logout</button>
          <div data-testid="logoutResult">{logoutResult}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestLogoutComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByTestId('logoutButton').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('logoutResult')).toHaveTextContent('success');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  it('should handle invalid JWT token', async () => {
    (apiClient.getUserFromToken as jest.Mock).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('hasCheckedAuth')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });
});
