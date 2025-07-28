/**
 * Script de test pour vérifier la connexion entre frontend et backend
 *
 * Ce script teste :
 * 1. La connectivité du serveur backend
 * 2. La connectivité du client frontend
 * 3. Les routes API principales
 */

const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:3000';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction pour tester une URL
function testUrl(url, description) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      log(`✅ ${description}: ${res.statusCode}`, 'green');
      resolve(true);
    });

    req.on('error', (err) => {
      log(`❌ ${description}: ${err.message}`, 'red');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      log(`⏰ ${description}: Timeout`, 'yellow');
      req.destroy();
      resolve(false);
    });
  });
}

// Test des routes API
async function testApiRoutes() {
  log('\n🔍 Test des routes API principales...', 'blue');

  const routes = [
    { url: `${BACKEND_URL}/auth/login`, description: 'Route de login' },
    { url: `${BACKEND_URL}/auth/register`, description: 'Route de register' },
    {
      url: `${BACKEND_URL}/api/user/profile`,
      description: 'Route profil utilisateur',
    },
    { url: `${BACKEND_URL}/api/post`, description: 'Route des posts' },
    { url: `${BACKEND_URL}/api/group`, description: 'Route des groupes' },
  ];

  for (const route of routes) {
    await testUrl(route.url, route.description);
  }
}

// Test principal
async function runTests() {
  log('🚀 Démarrage des tests de connexion...', 'blue');

  // Test du backend
  log('\n🔧 Test du serveur backend...', 'blue');
  const backendOk = await testUrl(BACKEND_URL, 'Serveur backend');

  // Test du frontend
  log('\n🎨 Test du client frontend...', 'blue');
  const frontendOk = await testUrl(FRONTEND_URL, 'Client frontend');

  // Test des routes API
  if (backendOk) {
    await testApiRoutes();
  }

  // Résumé
  log('\n📊 Résumé des tests:', 'blue');
  log(
    `Backend: ${backendOk ? '✅ Connecté' : '❌ Non connecté'}`,
    backendOk ? 'green' : 'red',
  );
  log(
    `Frontend: ${frontendOk ? '✅ Connecté' : '❌ Non connecté'}`,
    frontendOk ? 'green' : 'red',
  );

  if (backendOk && frontendOk) {
    log(
      '\n🎉 Tous les tests sont passés ! Votre application est prête.',
      'green',
    );
    log(
      'Vous pouvez maintenant ouvrir http://localhost:3000 dans votre navigateur.',
      'blue',
    );
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez que :', 'yellow');
    log('1. Le serveur backend est démarré (go run server.go)', 'yellow');
    log('2. Le client frontend est démarré (npm run dev)', 'yellow');
    log('3. Les ports 8080 et 3000 sont disponibles', 'yellow');
  }
}

// Exécution des tests
runTests().catch(console.error);
