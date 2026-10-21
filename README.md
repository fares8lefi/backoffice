# Fluxio Backoffice

Console d’administration de la plateforme Fluxio (React 19 + Vite). Elle consomme les routes
`/api/admin/*` et `/api/users/*` du backend `Fluxio_backeEnd` et n’est accessible qu’aux comptes
dont le rôle est `admin`.

## Démarrer

```bash
npm install
cp .env.example .env    # facultatif : VITE_API_TARGET si l'API n'est pas sur :3000
npm run dev             # http://localhost:5175
```

En développement, Vite relaie `/api` vers le backend : pas de CORS à configurer, les cookies
`jwt_login` / `jwt_refresh` passent normalement.

En production, servez `dist/` derrière le même domaine que l’API, ou renseignez `VITE_API_URL`
et ajoutez l’origine de la console à `FRONTEND_URL` côté backend (avec `COOKIE_SAMESITE=none`
si les deux sont sur des sites différents).

## Écrans et endpoints

| Écran | Endpoints |
|---|---|
| Connexion | `POST /api/users/loginUser`, `GET /api/users/me`, `POST /api/users/logOutUser`, `POST /api/users/refreshToken` |
| Vue d’ensemble | `GET /api/admin/kpis/overview`, `/kpis/trend`, `/kpis/top-companies` |
| Entreprises | `GET /api/admin/stats`, `GET /api/admin/companies`, `PATCH /api/admin/companies/:id/status` |
| Fiche entreprise | `GET /api/admin/companies/:id`, `PUT /api/admin/companies/:id`, `GET /api/admin/companies/:id/kpis`, `PATCH /api/admin/users/:id/status` |
| Utilisateurs | `GET /api/users/getAllUsers`, `PATCH /api/admin/users/:id/status`, `DELETE /api/users/:id` |
| Santé | `GET /api/admin/kpis/health`, `PATCH /api/admin/users/:id/status` |

## Structure

```
src/
  api/          client HTTP (refresh automatique) + fonctions par endpoint
  auth/         contexte de session admin
  components/   coque, sélecteur de période, graphique, dialogues, notifications
  pages/        un fichier par écran
  lib/          formats fr-FR / TND, hook de chargement
  styles.css    jetons de couleur (clair/sombre) et styles
```
