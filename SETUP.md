# 🚀 Guide de configuration et démarrage

Ce guide vous explique comment configurer et démarrer votre projet social_network.

## 📋 Prérequis

- **Node.js** (version 18 ou supérieure)
- **Go** (version 1.23 ou supérieure)
- **Git**

## 🔧 Configuration

### 1. Configuration du serveur backend (Go)

Le serveur utilise des variables d'environnement pour sa configuration. Créez un fichier `.env` dans le dossier `server/` :

```bash
# Configuration du serveur
ENV=development
PORT=8080

# Configuration de la base de données
DB_PATH=social_network.db
MIGRATIONS_DIR=db/migrations

# Configuration JWT
JWT_EXPIRATION_HOURS=4

# Configuration CORS (autorise le frontend Next.js)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-CSRF-Token,X-Requested-With

# Autres configurations (optionnelles)
POST_MAX_LENGTH=280
FEED_POST_LIMIT=20
MAX_FILE_SIZE_MB=10
ENABLE_REGISTRATION=true
ENABLE_FILE_UPLOAD=true
ENABLE_CHAT=true
```

### 2. Configuration du client frontend (Next.js)

Le client utilise une configuration centralisée dans `src/config/environment.ts`.
Par défaut, il se connecte à `http://localhost:8080`.

Si vous voulez changer l'URL de l'API, créez un fichier `.env.local` dans le dossier `client/` :

```bash
# URL de l'API backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# URL WebSocket pour le chat
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## 🚀 Démarrage

### 1. Démarrer le serveur backend

```bash
# Aller dans le dossier server
cd server

# Installer les dépendances Go
go mod download

# Démarrer le serveur
go run server.go
```

Le serveur sera accessible sur `http://localhost:8080`

### 2. Démarrer le client frontend

```bash
# Aller dans le dossier client
cd client

# Installer les dépendances Node.js
npm install

# Démarrer le serveur de développement
npm run dev
```

Le client sera accessible sur `http://localhost:3000`

## 🧪 Tests de connexion

### 1. Vérifier que le serveur fonctionne

Ouvrez votre navigateur et allez sur `http://localhost:8080`.
Vous devriez voir une page d'accueil ou un message d'erreur 404 (normal, car les routes API sont protégées).

### 2. Tester l'authentification

1. Allez sur `http://localhost:3000`
2. Cliquez sur "Sign In" ou "Register"
3. Créez un compte ou connectez-vous
4. Si tout fonctionne, vous devriez être redirigé vers la page d'accueil

### 3. Vérifier les WebSockets

1. Connectez-vous à l'application
2. Allez sur `http://localhost:3000/dev/websockets`
3. Vous devriez voir le chat en temps réel fonctionner

## 🔍 Dépannage

### Problème de CORS

Si vous avez des erreurs CORS, vérifiez que :

- Le serveur backend est démarré sur le port 8080
- La variable `CORS_ALLOWED_ORIGINS` inclut `http://localhost:3000`
- Le client frontend est démarré sur le port 3000

### Problème de base de données

Si la base de données ne se crée pas :

```bash
cd server
go run server.go
```

Le serveur créera automatiquement la base de données et exécutera les migrations.

### Problème de connexion API

Vérifiez dans la console du navigateur (F12) :

- Que l'URL de l'API est correcte
- Qu'il n'y a pas d'erreurs CORS
- Que les requêtes sont bien envoyées vers le bon endpoint

## 📁 Structure du projet

```
social_network/
├── server/          # Backend Go
│   ├── api/         # Handlers API
│   ├── config/      # Configuration
│   ├── db/          # Base de données et migrations
│   ├── middleware/  # Middleware (auth, CORS, etc.)
│   ├── routes/      # Définition des routes
│   └── websockets/  # Gestion WebSocket
├── client/          # Frontend Next.js
│   ├── src/
│   │   ├── app/     # Pages Next.js
│   │   ├── components/ # Composants React
│   │   ├── config/  # Configuration
│   │   ├── context/ # Contextes React
│   │   ├── hooks/   # Hooks personnalisés
│   │   └── services/ # Services API
│   └── public/      # Fichiers statiques
└── diagrams/        # Diagrammes et documentation
```

## 🎯 Prochaines étapes

Une fois que tout fonctionne, vous pouvez :

1. Créer des posts
2. Gérer votre profil
3. Créer des groupes
4. Utiliser le chat en temps réel
5. Tester toutes les fonctionnalités

Bonne chance avec votre projet ! 🎉
