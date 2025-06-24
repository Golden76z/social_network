# Cahier des Charges Technique

## 1. Stack Technologique

- **Frontend**
  - Framework JS : NextJS
  - Tailwind CSS pour condenser les fichiers components pour des questions de maintenabilité
  - Typescript with ESLint pour les good practices et le clean code
  - Dockerisation dans un conteneur distinct
- **Backend**
  - Langage : Go
  - Base de données : SQLite
  - Web server : Go
  - WebSockets : `gorilla/websocket`
  - Authentification : sessions HTTP + cookies, `bcrypt`
  - Migrations : `golang-migrate`
  - Dockerisation dans un conteneur distinct

## 2. Structure de Projet 

```md
social network
│
├── cahier_des_charges_fonctionnel.md
├── cahier_des_charges_technique.md
├── client
│   ├── coverage
│   ├── dist-electron
│   │   ├── main.js
│   │   └── preload.js
│   ├── electron
│   │   ├── main.ts
│   │   ├── preload.ts
│   │   └── tsconfig.json
│   ├── eslint.config.mjs
│   ├── jest.config.js
│   ├── jest.setup.js
│   ├── next.config.ts
│   ├── next-env.d.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── postcss.config.mjs
│   ├── public
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── README.md
│   ├── src
│   │   ├── app
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.test.tsx
│   │   │   └── page.tsx
│   │   ├── components
│   │   │   ├── chatComponent.tsx
│   │   │   └── ui
│   │   ├── context
│   │   │   └── webSocketProvider.tsx
│   │   ├── hooks
│   │   │   ├── useCssVariables.ts
│   │   │   └── useWebSockets.ts
│   │   └── pages
│   │       ├── auth
│   │       ├── dev
│   │       │   ├── palette.tsx
│   │       │   ├── playground.tsx
│   │       │   └── websockets.tsx
│   │       ├── group
│   │       └── profile
│   ├── tailwind.config.ts
│   ├── test
│   └── tsconfig.json
├── diagrams_database
│   ├── MCD_social-network.drawio.pdf
│   ├── MLD_social-network.pdf
│   ├── MPD-social_network.pdf
│   └── uml
│       ├── UML_connections.md
│       └── UML_social-network.pdf
├── LICENSE
├── README.md
└── server
    ├── api
    │   ├── login.go
    │   ├── login_test.go
    │   ├── register.go
    │   └── register_test.go
    ├── db
    │   ├── comments.go
    │   ├── db.go
    │   ├── db_test.go
    │   ├── event_rsvps.go
    │   ...
    │   ├── migrations
    │   │   ├── 000001_create_users_table.down.sql
    │   │   ├── 000001_create_users_table.up.sql
            ...
    │   │   └── migrations.go
    │   ├── notifications.go
    │   ├── posts.go
    │   ├── post_visibility.go
    │   ├── private_messages.go
    │   ├── register.go
    │   ├── sessions.go
    │   └── users.go
    ├── Dockerfile
    ├── go.mod
    ├── go.sum
    ├── middleware
    │   ├── auth.go
    │   ├── cors.go
    │   ├── crsf.go
    │   ├── logger.go
    │   ├── rateLimiter.go
    │   ├── recover.go
    │   └── securityHeader.go
    ├── models
    │   ├── comment.go
    │   ├── event_rsvp.go
    │   ├── follow_request.go
    │   └── user.go
    │   ...
    ├── README.md
    ├── router
    │   └── router.go
    ├── server.go
    ├── social_network.db
    ├── tests
    │   └── securityHeader_test.go
    ├── utils
    │   └── jwtCreation.go
    └── websockets
        ├── client.go
        ├── handler.go
        ├── hub.go
        ├── messages.go
        └── types.go
```


## 3. Composants du Backend

### 3.1 Serveur HTTP

- Routes REST
- Middleware :
  - Authentification
  - Gestion d’images (PNG, JPEG, GIF)
  - Logging
  - CORS
  - CSRF (pour la protection du token stocké dans les cookies)

### 3.2 Sessions & Authentification

- Sessions HTTP avec cookies persistants
- Chiffrement des mots de passe avec `bcrypt`
- Middleware pour vérification d’identité

### 3.3 Migrations SQL

- `golang-migrate`
- Scripts `.up.sql` / `.down.sql`
- Démarrage automatique au lancement de l’application

### 3.4 WebSocket

- Connexions persistantes pour chat privé et de groupe
- Gestion des connexions multiples (mapping utilisateur <-> socket)
- Différenciation des événements (message, notification, etc.)

## 4. Composants du Frontend

- SPA ou MPA en JS Framework
- Gestion des formulaires (auth, post, groupes, chat)
- Affichage conditionnel selon les droits
- Appels HTTP au backend via `fetch` ou `axios`
- Connexion WebSocket côté client
- État global via Redux ou Context API (si besoin)

## 5. Gestion des Images

- Upload via formulaire (posts, profils)
- Stockage local côté serveur avec lien dans BDD
- Vérification MIME type

## 6. Notifications

- Backend : insertion en BDD
- WebSocket : envoi direct si utilisateur connecté
- Frontend : affichage temps réel et badge de nouvelles notifications

## 7. Sécurité

- XSS / CSRF protection
- Hash des mots de passe
- Filtrage de fichiers uploadés
- Restrictions d’accès selon les rôles ou permissions

## 8. Docker

### Backend

- Dockerfile avec build Go statique
- Ports exposés : 8080

### Frontend

- Dockerfile servant l’app via un serveur statique (ex: `serve`, nginx)
- Ports exposés : 3000

### Docker Compose (optionnel)

- Liaison entre les deux conteneurs pour faciliter les échanges

## 9. Packages Autorisés

- `bcrypt`
- `gorilla/websocket`
- `golang-migrate`
- `sqlite3`
- `gofrs/uuid` ou `google/uuid`
