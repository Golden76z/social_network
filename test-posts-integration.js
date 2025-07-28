/**
 * Script de test pour l'intégration des posts
 *
 * Ce script teste :
 * 1. L'authentification
 * 2. La création de posts
 * 3. La récupération de posts
 * 4. La suppression de posts
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

// Fonction pour faire une requête HTTP
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

// Test de l'authentification
async function testAuthentication() {
  log("\n🔐 Test de l'authentification...", 'blue');

  try {
    // Test de création d'un compte avec un email unique
    const timestamp = Date.now().toString().slice(-6); // 6 derniers chiffres
    const registerData = {
      nickname: `testuser${timestamp}`,
      first_name: 'Test',
      last_name: 'User',
      email: `test${timestamp}@example.com`,
      date_of_birth: '1990-01-01',
      password: 'Password1234!',
    };

    const registerResponse = await makeRequest(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(registerData),
    });

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      log('✅ Inscription réussie', 'green');
    } else {
      log(`⚠️  Inscription: ${registerResponse.status}`, 'yellow');
      log(`Réponse: ${registerResponse.data}`, 'yellow');
    }

    // Test de connexion avec les mêmes données
    const loginData = {
      email: registerData.email,
      password: registerData.password,
    };

    const loginResponse = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    if (loginResponse.status === 200) {
      log('✅ Connexion réussie', 'green');

      // Extraire les cookies de session
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        log('✅ Cookies de session reçus', 'green');
        return cookies;
      }
    } else {
      log(`❌ Connexion échouée: ${loginResponse.status}`, 'red');
      log(`Réponse: ${loginResponse.data}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur d'authentification: ${error.message}`, 'red');
  }

  return null;
}

// Test des posts avec authentification
async function testPosts(cookies) {
  log('\n📝 Test des posts...', 'blue');

  if (!cookies) {
    log('⚠️  Impossible de tester les posts sans authentification', 'yellow');
    return;
  }

  try {
    // Test de création d'un post
    const postData = {
      title: 'Mon premier post',
      body: "Ceci est un test de création de post via l'API.",
      visibility: 'public',
    };

    const createResponse = await makeRequest(`${BACKEND_URL}/api/post`, {
      method: 'POST',
      headers: {
        Cookie: cookies.join('; '),
      },
      body: JSON.stringify(postData),
    });

    if (createResponse.status === 201) {
      log('✅ Création de post réussie', 'green');
      const responseData = JSON.parse(createResponse.data);
      const postId = responseData.postID;

      // Test de récupération des posts
      const getResponse = await makeRequest(`${BACKEND_URL}/api/post`, {
        headers: {
          Cookie: cookies.join('; '),
        },
      });

      if (getResponse.status === 200) {
        log('✅ Récupération des posts réussie', 'green');
        const posts = JSON.parse(getResponse.data);
        log(`📊 ${posts.length} posts récupérés`, 'blue');
      } else {
        log(`❌ Récupération des posts échouée: ${getResponse.status}`, 'red');
        log(`Réponse: ${getResponse.data}`, 'red');
      }

      // Test de suppression du post
      const deleteResponse = await makeRequest(
        `${BACKEND_URL}/api/post/${postId}`,
        {
          method: 'DELETE',
          headers: {
            Cookie: cookies.join('; '),
          },
        },
      );

      if (deleteResponse.status === 200) {
        log('✅ Suppression de post réussie', 'green');
      } else {
        log(`❌ Suppression de post échouée: ${deleteResponse.status}`, 'red');
        log(`Réponse: ${deleteResponse.data}`, 'red');
      }
    } else {
      log(`❌ Création de post échouée: ${createResponse.status}`, 'red');
      log(`Réponse: ${createResponse.data}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur lors du test des posts: ${error.message}`, 'red');
  }
}

// Test principal
async function runIntegrationTests() {
  log("🚀 Démarrage des tests d'intégration des posts...", 'blue');

  // Test de connectivité
  try {
    const backendTest = await makeRequest(BACKEND_URL);
    log(`✅ Backend accessible: ${backendTest.status}`, 'green');
  } catch (error) {
    log(`❌ Backend inaccessible: ${error.message}`, 'red');
    return;
  }

  try {
    const frontendTest = await makeRequest(FRONTEND_URL);
    log(`✅ Frontend accessible: ${frontendTest.status}`, 'green');
  } catch (error) {
    log(`⚠️  Frontend inaccessible: ${error.message}`, 'yellow');
  }

  // Test d'authentification
  const cookies = await testAuthentication();

  // Test des posts
  await testPosts(cookies);

  log("\n🎯 Tests d'intégration terminés !", 'blue');
}

// Exécution des tests
runIntegrationTests().catch(console.error);
