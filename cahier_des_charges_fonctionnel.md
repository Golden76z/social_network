# Cahier des Charges Fonctionnel

## 1. Présentation Générale

Le projet consiste à développer un réseau social similaire à Facebook, permettant à des utilisateurs d'interagir entre eux via des profils, publications, groupes, notifications et messagerie instantanée.

## 2. Objectifs du Projet

- Authentification via session/cookies
- Création de profils utilisateurs (public ou privé)
- Publication de posts avec images/GIFs et options de confidentialité
- Système de suivi (follow/unfollow)
- Création et gestion de groupes
- Chat en temps réel via WebSocket
- Notifications liées aux interactions sociales

## 3. Utilisateurs Cibles

- Étudiants et développeurs participant au projet
- Utilisateurs finaux fictifs simulant une interaction sur un réseau social

## 4. Fonctionnalités Principales

### 4.1 Authentification

- Inscription avec :
  - Email (obligatoire)
  - Mot de passe (obligatoire)
  - Prénom, nom, date de naissance (obligatoire)
  - Pseudo, description, avatar (optionnel)
- Connexion et déconnexion avec gestion de session via cookies

### 4.2 Profils

- Informations visibles dépendent de la confidentialité du profil
- Liste des abonnés et abonnements
- Publications de l’utilisateur

### 4.3 Système de Followers

- Demande de suivi avec acceptation si profil privé
- Suivi automatique si profil public
- Possibilité d’annuler une demande ou de se désabonner

### 4.4 Publications

- Contenu texte + image/GIF
- Visibilité des posts :
  - Public
  - Privé (suiveurs choisis)
  - Semi-privé (tous les suiveurs)

### 4.5 Groupes

- Création de groupes avec titre, description
- Invitations et demandes d’adhésion
- Possibilité de créer des événements dans le groupe :
  - Titre, description, date/heure
  - Réponses : “Je viens” / “Je ne viens pas”

### 4.6 Messagerie instantanée (Chat)

- Messages privés entre utilisateurs suivant ou suivis
- Chat de groupe pour les membres
- WebSockets pour l’instantanéité
- Envoi d'emojis

### 4.7 Notifications

- Nouveaux abonnements en attente (si profil privé)
- Invitations ou demandes pour rejoindre un groupe
- Création d’événements dans les groupes
- Différenciation entre notifications et messages

## 5. Contraintes

- Interface réactive
- Respect de la confidentialité des données
- Système de session sécurisé
- Multi-utilisateur simulé dans un environnement local

## 6. Technologies imposées

- Frontend : HTML, CSS, JS avec un framework (Next.js, Vue.js, etc.)
- Backend : Go
- Base de données : SQLite
- WebSocket : gorilla/websocket
- Authentification : sessions, cookies, bcrypt
