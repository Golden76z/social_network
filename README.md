# Social Network

Modern social network project built with a **client–server architecture**.
It includes a Next.js web application (with Electron support for desktop) and a Go backend.

## Project Structure

```
social-network/
├── client/           → React/Next.js frontend + Electron
├── server/           → Go backend (REST API + WebSockets)
├── diagrams/         → User flow diagrams – Database diagrams
├── cahier_des_charges_fonctionnel.md
├── cahier_des_charges_technique.md
├── LICENSE
└── README.md
```

## Specifications

* [Functional specifications](./cahier_des_charges_fonctionnel.md)
* [Technical specifications](./cahier_des_charges_technique.md)

## Quick Start

### Prerequisites

* [Node.js](https://nodejs.org/)
* [Go](https://golang.org/)
* [Docker](https://www.docker.com/) (optional)

### Run the web client

```bash
cd client
npm install
npm run dev
```

### Run the desktop client (Electron)

```bash
npm run electron:dev
```

### Run the Go backend

```bash
cd server
go run server.go
```

## Tests

* **Client:** `npm test` (Jest)
* **Server:** `go test ./...`

## Main Technos

* **Frontend:** React 19, Next.js 15, Tailwind CSS, Electron
* **Backend:** Go, WebSockets, JWT, SQLite
* **Testing:** Jest, Testing Library, Go testing
* **Security:** CORS middleware, CSRF protection, JWT, Rate limiting

## 📚 Documentation

* [`/diagrams/database/`](./diagrams/database/)
  Database diagrams: ERD, logical and physical models, UML

* [`/diagrams/user_flow/`](./diagrams/user_flow/)
  User flow diagrams – full site interactions

* [`/client/README.md`](./client/README.md)
  Client-side setup and usage

* [`/server/README.md`](./server/README.md)
  Server-side setup and usage

---

© [Golden76z] – [License](./LICENSE)
