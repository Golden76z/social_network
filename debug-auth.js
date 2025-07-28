/**
 * Script de debug pour vérifier l'état de l'authentification
 *
 * Ce script simule exactement ce que fait le client pour identifier
 * pourquoi l'authentification ne fonctionne pas sur le site.
 */

const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:8080';

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

// Fonction pour faire une requête HTTP avec gestion des cookies
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(
        options.body,
      );
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test complet de l'authentification
async function debugAuthentication() {
  log("🔍 Debug de l'authentification...", 'blue');

  try {
    // 1. Créer un compte
    const timestamp = Date.now().toString().slice(-6);
    const registerData = {
      nickname: `debuguser${timestamp}`,
      first_name: 'Debug',
      last_name: 'User',
      email: `debug${timestamp}@example.com`,
      date_of_birth: '1990-01-01',
      password: 'Password1234!',
    };

    log("\n1️⃣ Test d'inscription...", 'blue');
    const registerResponse = await makeRequest(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(registerData),
    });

    log(`Status: ${registerResponse.status}`);
    log(`Réponse: ${registerResponse.data}`);

    if (registerResponse.headers['set-cookie']) {
      log("✅ Cookies reçus lors de l'inscription:", 'green');
      registerResponse.headers['set-cookie'].forEach((cookie) => {
        log(`  ${cookie}`, 'yellow');
      });
    } else {
      log("⚠️  Aucun cookie reçu lors de l'inscription", 'yellow');
    }

    // 2. Se connecter
    log('\n2️⃣ Test de connexion...', 'blue');
    const loginData = {
      email: registerData.email,
      password: registerData.password,
    };

    const loginResponse = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    log(`Status: ${loginResponse.status}`);
    log(`Réponse: ${loginResponse.data}`);

    if (loginResponse.headers['set-cookie']) {
      log('✅ Cookies reçus lors de la connexion:', 'green');
      loginResponse.headers['set-cookie'].forEach((cookie) => {
        log(`  ${cookie}`, 'yellow');
      });
    } else {
      log('⚠️  Aucun cookie reçu lors de la connexion', 'yellow');
    }

    // 3. Tester l'authentification avec les cookies
    if (loginResponse.headers['set-cookie']) {
      log("\n3️⃣ Test d'authentification avec cookies...", 'blue');

      const authResponse = await makeRequest(
        `${BACKEND_URL}/api/user/profile`,
        {
          headers: {
            Cookie: loginResponse.headers['set-cookie'].join('; '),
          },
        },
      );

      log(`Status: ${authResponse.status}`);
      log(`Réponse: ${authResponse.data}`);

      if (authResponse.status === 200) {
        log('✅ Authentification réussie avec cookies', 'green');
      } else {
        log('❌ Authentification échouée avec cookies', 'red');
      }
    }

    // 4. Tester la création de post avec cookies
    if (loginResponse.headers['set-cookie']) {
      log('\n4️⃣ Test de création de post avec cookies...', 'blue');

      const postData = {
        title: 'Test post via debug',
        body: 'Ceci est un test de debug.',
        visibility: 'public',
      };

      const postResponse = await makeRequest(`${BACKEND_URL}/api/post`, {
        method: 'POST',
        headers: {
          Cookie: loginResponse.headers['set-cookie'].join('; '),
        },
        body: JSON.stringify(postData),
      });

      log(`Status: ${postResponse.status}`);
      log(`Réponse: ${postResponse.data}`);

      if (postResponse.status === 201) {
        log('✅ Création de post réussie avec cookies', 'green');
      } else {
        log('❌ Création de post échouée avec cookies', 'red');
      }
    }
  } catch (error) {
    log(`❌ Erreur lors du debug: ${error.message}`, 'red');
  }
}

// Test de la configuration CORS
async function testCORS() {
  log('\n🌐 Test de la configuration CORS...', 'blue');

  try {
    const response = await makeRequest(`${BACKEND_URL}/api/post`, {
      method: 'OPTIONS',
    });

    log(`Status: ${response.status}`);
    log(`CORS Headers:`);
    Object.entries(response.headers).forEach(([key, value]) => {
      if (key.toLowerCase().includes('access-control')) {
        log(`  ${key}: ${value}`, 'yellow');
      }
    });
  } catch (error) {
    log(`❌ Erreur CORS: ${error.message}`, 'red');
  }
}

// Test principal
async function runDebug() {
  log("🚀 Démarrage du debug d'authentification...", 'blue');

  await debugAuthentication();
  await testCORS();

  log('\n🎯 Debug terminé !', 'blue');
}

// Exécution du debug
runDebug().catch(console.error);
