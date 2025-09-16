/**
 * Composant DebugAuth - Debug de l'authentification côté client
 *
 * Ce composant affiche l'état de l'authentification et permet de
 * diagnostiquer les problèmes de cookies et de session.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { config } from '@/config/environment';
import Button from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DebugAuth: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<unknown>({});
  const [testResult, setTestResult] = useState<string>('');

  // Collecter les informations de debug
  useEffect(() => {
    const info = {
      cookies: document.cookie,
      userAgent: navigator.userAgent,
      apiUrl: config.API_BASE_URL,
      isAuthenticated,
      user,
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  }, [isAuthenticated, user]);

  // Test de l'API avec les cookies actuels
  const testAPI = async () => {
    try {
      setTestResult('Test en cours...');

      const response = await fetch(`${config.API_BASE_URL}/api/user/profile`, {
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.text();

      setTestResult(`
Status: ${response.status}
Headers: ${JSON.stringify(
        Object.fromEntries(response.headers.entries()),
        null,
        2,
      )}
Data: ${data}
      `);
    } catch (error) {
      setTestResult(`Erreur: ${error}`);
    }
  };

  // Test de création de post
  const testCreatePost = async () => {
    try {
      setTestResult('Test de création de post en cours...');

      const postData = {
        title: 'Test post debug',
        body: 'Ceci est un test de debug depuis le client.',
        visibility: 'public',
      };

      const response = await fetch(`${config.API_BASE_URL}/api/post`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(postData),
      });

      const data = await response.text();

      setTestResult(`
Status: ${response.status}
Headers: ${JSON.stringify(
        Object.fromEntries(response.headers.entries()),
        null,
        2,
      )}
Data: ${data}
      `);
    } catch (error) {
      setTestResult(`Erreur: ${error}`);
    }
  };

  // Vider les cookies
  const clearCookies = () => {
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    window.location.reload();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🔍 Debug de l&apos;authentification</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* État de l'authentification */}
        <div>
          <h3 className="font-semibold mb-2">
            État de l&apos;authentification :
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              Authentifié :{' '}
              <span
                className={isAuthenticated ? 'text-green-600' : 'text-red-600'}
              >
                {isAuthenticated ? 'Oui' : 'Non'}
              </span>
            </div>
            <div>
              Chargement :{' '}
              <span
                className={isLoading ? 'text-yellow-600' : 'text-green-600'}
              >
                {isLoading ? 'Oui' : 'Non'}
              </span>
            </div>
            <div>
              Utilisateur :{' '}
              <span className="text-blue-600">
                {user ? `${user.nickname || user.first_name}` : 'Aucun'}
              </span>
            </div>
            <div>
              ID Utilisateur :{' '}
              <span className="text-blue-600">{user?.id || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Cookies */}
        <div>
          <h3 className="font-semibold mb-2">Cookies :</h3>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
            {
              // On vérifie que debugInfo est bien un objet et qu'il possède la propriété cookies
              typeof debugInfo === 'object' &&
              debugInfo !== null &&
              'cookies' in debugInfo
                ? (debugInfo as { cookies?: string }).cookies || 'Aucun cookie'
                : 'Aucun cookie'
            }
          </div>
        </div>

        {/* Configuration */}
        <div>
          <h3 className="font-semibold mb-2">Configuration :</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              API URL :{' '}
              <span className="text-blue-600">
                {
                  // On vérifie que debugInfo est bien un objet et qu'il possède la propriété apiUrl
                  typeof debugInfo === 'object' &&
                  debugInfo !== null &&
                  'apiUrl' in debugInfo
                    ? (debugInfo as { apiUrl?: string }).apiUrl || 'N/A'
                    : 'N/A'
                }
              </span>
            </div>
            <div>
              User Agent :{' '}
              <span className="text-blue-600 text-xs">
                {
                  // On vérifie que debugInfo est bien un objet et qu'il possède la propriété userAgent
                  typeof debugInfo === 'object' &&
                  debugInfo !== null &&
                  'userAgent' in debugInfo
                    ? ((
                        debugInfo as { userAgent?: string }
                      ).userAgent?.substring(0, 50) || 'N/A') + '...'
                    : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Actions de test */}
        <div>
          <h3 className="font-semibold mb-2">Tests :</h3>
          <div className="flex space-x-2">
            <Button onClick={testAPI} variant="outline" size="sm">
              Test API Profile
            </Button>
            <Button onClick={testCreatePost} variant="outline" size="sm">
              Test Création Post
            </Button>
            <Button
              onClick={clearCookies}
              variant="outline"
              size="sm"
              className="text-red-600"
            >
              Vider Cookies
            </Button>
          </div>
        </div>

        {/* Résultats des tests */}
        {testResult && (
          <div>
            <h3 className="font-semibold mb-2">Résultat du test :</h3>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono whitespace-pre-wrap">
              {testResult}
            </div>
          </div>
        )}

        {/* Informations complètes */}
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">
            Informations complètes
          </summary>
          <div className="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};
