/**
 * Configuration centralisée des variables d'environnement
 *
 * Ce fichier centralise toutes les variables d'environnement utilisées
 * par l'application frontend. Cela facilite la maintenance et évite
 * les erreurs de configuration.
 */

export const config = {
  // URL de l'API backend
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:8080',

  // URL WebSocket pour le chat en temps réel
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',

  // Configuration de l'environnement
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Configuration des timeouts
  API_TIMEOUT: 10000, // 10 secondes
  WS_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_INTERVAL: 3000, // 3 secondes

  // Configuration des fonctionnalités
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
} as const;

/**
 * Vérification de la configuration au démarrage
 * Cette fonction vérifie que toutes les variables nécessaires sont définies
 */
export const validateConfig = (): void => {
  const requiredConfigs = [
    { key: 'API_BASE_URL', value: config.API_BASE_URL },
    { key: 'WS_URL', value: config.WS_URL },
  ];

  const missingConfigs = requiredConfigs.filter(
    ({ value }) => !value || value.trim() === '',
  );

  if (missingConfigs.length > 0) {
    console.error('❌ Configuration manquante:', missingConfigs);
    throw new Error(
      `Variables d'environnement manquantes: ${missingConfigs
        .map(({ key }) => key)
        .join(', ')}`,
    );
  }

  if (config.ENABLE_DEBUG_LOGS) {
    console.log('✅ Configuration chargée:', config);
  }
};

// Validation automatique en mode développement
if (typeof window !== 'undefined' && config.ENABLE_DEBUG_LOGS) {
  validateConfig();
}
