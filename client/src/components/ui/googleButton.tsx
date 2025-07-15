// 'use client';

// import React, { useState } from 'react';
// import { useAuth } from '@/context/AuthProvider';
// import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';

// interface GoogleCredentialResponse {
//   credential: string;
//   select_by: string;
// }

// interface GoogleSignInButtonProps {
//   onSuccess?: () => void;
//   onError?: (error: Error) => void;
//   className?: string;
//   children?: React.ReactNode;
// }

// const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
//   onSuccess,
//   onError,
//   className = '',
//   children,
// }) => {
//   const { isLoading } = useAuth();
//   const [isSigningIn, setIsSigningIn] = useState(false);

//   const handleGoogleSuccess = async (response: GoogleCredentialResponse) => {
//     try {
//       setIsSigningIn(true);
      
//       // Send credential to your backend
//       const apiResponse = await fetch('/api/auth/google', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ credential: response.credential }),
//         credentials: 'include',
//       });

//       if (!apiResponse.ok) {
//         throw new Error('Authentication failed');
//       }

//       const userData = await apiResponse.json();
//       console.log('Google sign-in successful:', userData);
      
//       onSuccess?.();
//     } catch (error) {
//       console.error('Google sign-in failed:', error);
//       onError?.(error as Error);
//     } finally {
//       setIsSigningIn(false);
//     }
//   };

//   const handleGoogleError = (error: Error) => {
//     console.error('Google sign-in error:', error);
//     onError?.(error);
//   };

//   const { isInitialized, signIn, error } = useGoogleSignIn({
//     onSuccess: handleGoogleSuccess,
//     onError: handleGoogleError,
//   });

//   const handleClick = async () => {
//     if (!isInitialized) {
//       onError?.(new Error('Google Sign-In is not ready'));
//       return;
//     }

//     try {
//       await signIn();
//     } catch {
//       // Error already handled by useGoogleSignIn hook
//     }
//   };

//   // Show error state
//   if (error) {
//     return (
//       <div className="text-red-600 text-sm p-2 border border-red-300 rounded">
//         Google Sign-In unavailable: {error}
//       </div>
//     );
//   }

//   return (
//     <button
//       onClick={handleClick}
//       disabled={isLoading || isSigningIn || !isInitialized}
//       className={`
//         flex items-center justify-center gap-3 px-4 py-2 
//         border border-gray-300 rounded-lg
//         bg-white hover:bg-gray-50 
//         text-gray-700 font-medium
//         transition-colors duration-200
//         disabled:opacity-50 disabled:cursor-not-allowed
//         ${className}
//       `}
//     >
//       {isSigningIn ? (
//         <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
//       ) : (
//         <svg className="w-5 h-5" viewBox="0 0 24 24">
//           <path
//             fill="#4285F4"
//             d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//           />
//           <path
//             fill="#34A853"
//             d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//           />
//           <path
//             fill="#FBBC05"
//             d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//           />
//           <path
//             fill="#EA4335"
//             d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//           />
//         </svg>
//       )}
      
//       {children || (
//         <span>
//           {isSigningIn ? 'Signing in...' : !isInitialized ? 'Loading...' : 'Continue with Google'}
//         </span>
//       )}
//     </button>
//   );
// };

// export default GoogleSignInButton;