# 🚀 EDUSOFT - Accès Rapide à la Plateforme

## 🌐 Lien Direct

Une fois les serveurs démarrés, accédez à la plateforme via :

### **[http://localhost:5173](http://localhost:5173)**

---

## ⚡ Démarrage Rapide

### 1️⃣ Démarrer le Backend (Terminal 1)
```powershell
cd "C:\Users\HP\Desktop\ITA\GESTION ECOLE INSCRIPTION\backend"
node src/server.js
```
✅ Le backend sera accessible sur `http://localhost:5000`

### 2️⃣ Démarrer le Frontend (Terminal 2)
```powershell
cd "C:\Users\HP\Desktop\ITA\GESTION ECOLE INSCRIPTION\frontend"
node node_modules/vite/bin/vite.js
```
✅ Le frontend sera accessible sur `http://localhost:5173` (ou port affiché)

---

## 🔑 Identifiants de Connexion

### Administrateur Principal (Accès Complet)
- **Identifiant** : `admin`
- **Mot de passe** : `admin123`

### Comptable (Finances)
- **Identifiant** : `comptable`
- **Mot de passe** : `compta123`

### Secrétaire (Inscription Élèves)
- **Identifiant** : `secretaire`
- **Mot de passe** : `secret123`

---

## 📋 Vérification Rapide

Après démarrage, vérifiez que :
- ✅ Backend répond sur : http://localhost:5000/api/config/school-years
- ✅ Frontend s'affiche sur : http://localhost:5173
- ✅ La page de connexion apparaît correctement

---

## 🛠️ En cas de problème

### Erreur PowerShell (scripts désactivés)
Si vous voyez une erreur `UnauthorizedAccess`, utilisez :
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Port déjà utilisé
- Backend (5000) : Changez le port dans `.env`
- Frontend (5173) : Vite choisira automatiquement un autre port

### Base de données
Si la base de données n'existe pas :
```powershell
cd backend
npx prisma migrate dev
npx prisma db seed
```

---

## 📱 Modules Disponibles

Une fois connecté, vous aurez accès à :
- 🏠 **Tableau de Bord** - Statistiques et aperçu
- 👨‍🎓 **Élèves** - Gestion complète des dossiers
- 💰 **Paiements** - Enregistrement et reçus
- 📊 **Comptabilité** - Rapports financiers
- 📱 **Communication** - SMS/Email et Chatbot
- ⚙️ **Configuration** - Classes et frais
- 👥 **Utilisateurs** - Gestion des comptes

---

**Bon travail ! 🎓**
