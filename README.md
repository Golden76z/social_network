# Social Network

Projet de réseau social moderne avec une architecture **client-serveur**.  
Il inclut une application web Next.js (avec support Electron pour bureau) et un backend en Go.

## 📁 Structure du projet

```
social-network/
├── client/           → Frontend React/Next.js + Electron
├── server/           → Backend en Go (API REST + Websockets)
├── diagrams/ → Useflow diagrams - Database diagrams
├── cahier_des_charges_fonctionnel.md
├── cahier_des_charges_technique.md
├── LICENSE
└── README.md
```

## 📄 Cahiers des charges

- [Cahier des charges fonctionnel](./cahier_des_charges_fonctionnel.md)
- [Cahier des charges technique](./cahier_des_charges_technique.md)

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/)
- [Go](https://golang.org/)
- [Docker](https://www.docker.com/) (optionnel)

### Lancer le client web

```bash
cd client
npm install
npm run dev
```

### Lancer le client desktop (Electron)

```bash
npm run electron:dev
```

### Lancer le backend Go

```bash
cd server
go run server.go
```

## 🧪 Tests

- **Client :** `npm test` (Jest)
- **Serveur :** `go test ./...`

## 🧱 Technologies principales

- **Frontend** : React 19, Next.js 15, TailwindCSS, Electron
- **Backend** : Go, WebSockets, JWT, SQLite
- **Tests** : Jest, Testing Library, Go testing
- **Sécurité** : Middleware CORS, CSRF, JWT, Rate Limiting

## 📚 Documentation

- [`/diagrams_database/`](./diagrams_database) : MCD, MLD, MPD, UML
- [`/client/README.md`](./client/README.md)
- [`/server/README.md`](./server/README.md)

---

© [Golden76z] – [License](./LICENSE)
