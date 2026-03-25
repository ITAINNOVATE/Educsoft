# Configuration Finale de Déploiement VERCEL

Pour que le système fonctionne (SAAS + Base de Données), vous devez configurer ces variables exactement comme ceci dans votre tableau de bord **VERCEL** :

### 1. Variables d'Environnement (Environment Variables)
Dans Vercel, allez dans **Settings > Environment Variables** et ajoutez :

| Key | Value (Copiez-collez) |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.jorecpcnhlstxzqdygda:EduSoft2026%21@aws-1-eu-west-3.pooler.supabase.com:5432/postgres?connect_timeout=30` |
| `DIRECT_URL` | `postgresql://postgres.jorecpcnhlstxzqdygda:EduSoft2026%21@aws-1-eu-west-3.pooler.supabase.com:5432/postgres?connect_timeout=30` |
| `JWT_SECRET` | `EduSoft-Secret-Key-2026-ITA` |

### 2. Paramètres de Build (Build & Development Settings)
Assurez-vous que ces réglages sont appliqués :
- **Build Command** : `npm run build`
- **Output Directory** : `frontend/dist`
- **Install Command** : `npm install` (ou laissez par défaut)

### 3. Branche GitHub
- Assurez-vous d'être sur la branche **main**.
- Si Vercel mélange les comptes, supprimez le projet sur Vercel et refaites **"New Project"** en liant précisément le dépôt : `ITAINNOVATE/Educsoft`.

---
**Note technique** : L'erreur `FUNCTION_INVOCATION_FAILED` disparaîtra dès que `DATABASE_URL` sera reconnue par le serveur.
