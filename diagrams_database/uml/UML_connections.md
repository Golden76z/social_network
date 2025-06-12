# Relations et Cardinalités du Schéma de la Base de Données

Ce document décrit les relations entre les tables du réseau social et précise les cardinalités (1-1, 1-N, N-N) pour chaque lien.

---

## Table des matières

- [Utilisateurs et Relations Directes](#utilisateurs-et-relations-directes)
- [Posts et Visibilité](#posts-et-visibilité)
- [Commentaires](#commentaires)
- [Likes/Dislikes](#likesdislikes)
- [Groupes et Membres](#groupes-et-membres)
- [Demandes et Invitations de Groupe](#demandes-et-invitations-de-groupe)
- [Posts et Commentaires de Groupe](#posts-et-commentaires-de-groupe)
- [Événements de Groupe](#événements-de-groupe)
- [Messages Privés et de Groupe](#messages-privés-et-de-groupe)
- [Notifications](#notifications)

---

## Utilisateurs et Relations Directes

- **users** (1) ⟶ (N) **posts**  
  Un utilisateur peut créer plusieurs posts, chaque post appartient à un seul utilisateur.

- **users** (1) ⟶ (N) **comments**  
  Un utilisateur peut écrire plusieurs commentaires, chaque commentaire a un seul auteur.

- **users** (1) ⟶ (N) **follow_requests** (requester_id)  
  Un utilisateur peut envoyer plusieurs demandes de suivi.

- **users** (1) ⟶ (N) **follow_requests** (target_id)  
  Un utilisateur peut recevoir plusieurs demandes de suivi.

---

## Posts et Visibilité

- **posts** (1) ⟶ (N) **comments**  
  Un post peut avoir plusieurs commentaires, chaque commentaire appartient à un seul post.

- **posts** (1) ⟶ (N) **post_visibility**  
  Un post privé ("selected") peut être visible par plusieurs utilisateurs (via post_visibility).

- **users** (1) ⟶ (N) **post_visibility**  
  Un utilisateur peut avoir accès à plusieurs posts privés.

---

## Commentaires

- **comments** (N) ⟶ (1) **posts**  
  Chaque commentaire appartient à un seul post.

- **comments** (N) ⟶ (1) **users**  
  Chaque commentaire a un seul auteur.

---

## Likes/Dislikes

- **users** (1) ⟶ (N) **likes_dislikes**  
  Un utilisateur peut liker/disliker plusieurs éléments.

- **posts** (1) ⟶ (N) **likes_dislikes**  
  Un post peut recevoir plusieurs likes/dislikes.

- **comments** (1) ⟶ (N) **likes_dislikes**  
  Un commentaire peut recevoir plusieurs likes/dislikes.

- **group_posts** (1) ⟶ (N) **likes_dislikes**  
  Un post de groupe peut recevoir plusieurs likes/dislikes.

- **group_comments** (1) ⟶ (N) **likes_dislikes**  
  Un commentaire de groupe peut recevoir plusieurs likes/dislikes.

---

## Groupes et Membres

- **groups** (1) ⟶ (N) **group_members**  
  Un groupe a plusieurs membres.

- **users** (1) ⟶ (N) **group_members**  
  Un utilisateur peut être membre de plusieurs groupes.

- **users** (1) ⟶ (N) **groups** (creator_id)  
  Un utilisateur peut créer plusieurs groupes.

---

## Demandes et Invitations de Groupe

- **groups** (1) ⟶ (N) **group_requests**  
  Un groupe peut recevoir plusieurs demandes d’adhésion.

- **users** (1) ⟶ (N) **group_requests**  
  Un utilisateur peut demander à rejoindre plusieurs groupes.

- **groups** (1) ⟶ (N) **group_invitations**  
  Un groupe peut envoyer plusieurs invitations.

- **users** (1) ⟶ (N) **group_invitations** (invited_user_id)  
  Un utilisateur peut recevoir plusieurs invitations.

- **users** (1) ⟶ (N) **group_invitations** (invited_by)  
  Un utilisateur peut inviter plusieurs personnes dans des groupes.

---

## Posts et Commentaires de Groupe

- **groups** (1) ⟶ (N) **group_posts**  
  Un groupe peut avoir plusieurs posts.

- **users** (1) ⟶ (N) **group_posts**  
  Un utilisateur peut poster dans plusieurs groupes.

- **group_posts** (1) ⟶ (N) **group_comments**  
  Un post de groupe peut avoir plusieurs commentaires.

- **users** (1) ⟶ (N) **group_comments**  
  Un utilisateur peut commenter plusieurs posts de groupe.

---

## Événements de Groupe

- **groups** (1) ⟶ (N) **group_events**  
  Un groupe peut avoir plusieurs événements.

- **users** (1) ⟶ (N) **group_events** (creator_id)  
  Un utilisateur peut créer plusieurs événements de groupe.

- **group_events** (1) ⟶ (N) **event_rsvps**  
  Un événement peut avoir plusieurs réponses (RSVP).

- **users** (1) ⟶ (N) **event_rsvps**  
  Un utilisateur peut répondre à plusieurs événements.

---

## Messages Privés et de Groupe

- **users** (1) ⟶ (N) **private_messages** (sender_id)  
  Un utilisateur peut envoyer plusieurs messages privés.

- **users** (1) ⟶ (N) **private_messages** (receiver_id)  
  Un utilisateur peut recevoir plusieurs messages privés.

- **groups** (1) ⟶ (N) **group_messages**  
  Un groupe peut avoir plusieurs messages de groupe.

- **users** (1) ⟶ (N) **group_messages** (sender_id)  
  Un utilisateur peut envoyer plusieurs messages dans des groupes.

---

## Notifications

- **users** (1) ⟶ (N) **notifications**  
  Un utilisateur peut recevoir plusieurs notifications.

---

## Résumé des Cardinalités

- **1-1** : Rare dans ce schéma (ex : une notification pourrait être unique pour un utilisateur, mais généralement c’est 1-N).
- **1-N** : Majorité des relations (ex : un utilisateur a plusieurs posts).
- **N-N** : Géré via des tables de liaison (ex : group_members, post_visibility, likes_dislikes).

---