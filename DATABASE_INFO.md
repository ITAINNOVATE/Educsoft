# 🗄️ Base de Données EDUSOFT - Documentation SQL

## 📊 Configuration Actuelle

- **Type** : SQLite
- **Fichier** : `backend/prisma/dev.db`
- **ORM** : Prisma
- **URL de connexion** : `file:./dev.db`

---

## 🏗️ Structure de la Base de Données

### 📋 Tables Principales

#### 1. **User** - Utilisateurs du système
```sql
- id (UUID, Primary Key)
- email (Unique)
- password (Hash)
- firstName, lastName
- role (ADMIN, DIRECTOR, ACCOUNTANT, SECRETARY, TEACHER, PARENT)
- lastLogin
- createdAt, updatedAt
```

#### 2. **Student** - Élèves
```sql
- id (UUID, Primary Key)
- regNumber (Matricule unique)
- firstName, lastName
- dob (Date de naissance), pob (Lieu de naissance)
- gender, nationality, birthCertNumber
- address, photoUrl
- bloodGroup, medicalInfo, handicap
- adminObservations, internalNotes, disciplinaryRecord
- status (ACTIF, SUSPENDU, TRANSFERE, ABANDON, DIPLOME, ARCHIVE)
- createdAt, updatedAt
```

#### 3. **Parent** - Parents/Tuteurs
```sql
- id (UUID, Primary Key)
- firstName, lastName
- phonePrimary, phoneSecondary
- email, address, occupation
- createdAt, updatedAt
```

#### 4. **ParentStudent** - Relation Parent-Élève
```sql
- id (UUID, Primary Key)
- studentId (Foreign Key → Student)
- parentId (Foreign Key → Parent)
- relation (MERE, PERE, TUTEUR)
- isPrimary (Contact principal)
- isEmergency (Contact d'urgence)
```

#### 5. **Enrollment** - Inscriptions
```sql
- id (UUID, Primary Key)
- studentId (Foreign Key → Student)
- classId (Foreign Key → Class)
- schoolYearId (Foreign Key → SchoolYear)
- status (PENDING, VALIDATED, REJECTED)
- createdAt, updatedAt
```

#### 6. **SchoolYear** - Années Scolaires
```sql
- id (UUID, Primary Key)
- name (ex: 2025-2026)
- startDate, endDate
- current (Année en cours)
```

#### 7. **Class** - Classes
```sql
- id (UUID, Primary Key)
- name (ex: CP1, 6ème, Terminale)
- level (MATERNELLE, PRIMAIRE, COLLEGE, LYCEE)
- schoolYearId (Foreign Key → SchoolYear)
```

#### 8. **Fee** - Frais Scolaires
```sql
- id (UUID, Primary Key)
- name (Libellé du frais)
- amount (Montant)
- category (ANNUAL_OBLIGATORY, OPTIONAL, OCCASIONAL)
- type (TUITION, REGISTRATION, TRANSPORT, CANTEEN, UNIFORM, 
        BOOKS, EXAM, ACTIVITY, HEALTH, INTERNAT, PENALTY, 
        DIPLOMA, OTHER)
- classId (Foreign Key → Class)
```

#### 9. **Payment** - Paiements
```sql
- id (UUID, Primary Key)
- studentId (Foreign Key → Student)
- feeId (Foreign Key → Fee, optionnel)
- feeName (Libellé du frais payé)
- amount (Montant payé)
- method (CASH, MOBILE_MONEY, CARD, TRANSFER)
- receiptNumber (Numéro de reçu unique)
- paymentDate
- notes
```

#### 10. **Document** - Documents Élèves
```sql
- id (UUID, Primary Key)
- name (Nom du document)
- type (Type de fichier)
- url (Chemin du fichier)
- status (VALID, EXPIRED, PENDING)
- expiryDate
- studentId (Foreign Key → Student)
- createdAt, updatedAt
```

#### 11. **SchoolHistory** - Historique Scolaire
```sql
- id (UUID, Primary Key)
- studentId (Foreign Key → Student)
- schoolYear (ex: 2023-2024)
- className
- schoolName
- result (ADMIS, REDOUBLANT, EXCLU, TRANSFERE)
- average (Moyenne)
```

#### 12. **AuditLog** - Journal d'Audit
```sql
- id (UUID, Primary Key)
- action (Action effectuée)
- userId (Foreign Key → User)
- createdAt
```

---

## 🔗 Relations Entre Tables

```
User ──┬─→ AuditLog
       
Student ──┬─→ Enrollment ──→ Class ──→ SchoolYear
          ├─→ ParentStudent ──→ Parent
          ├─→ Payment
          ├─→ Document
          └─→ SchoolHistory

Class ──→ Fee
```

---

## 🛠️ Commandes Prisma Utiles

### Créer/Mettre à jour la base de données
```powershell
cd backend
npx prisma migrate dev --name nom_migration
```

### Remplir avec des données de test
```powershell
npx prisma db seed
```

### Réinitialiser la base de données
```powershell
npx prisma migrate reset
```

### Ouvrir l'interface graphique Prisma Studio
```powershell
npx prisma studio
```
📌 **Prisma Studio** s'ouvrira sur `http://localhost:5555` et vous permettra de visualiser et modifier les données facilement !

### Générer le client Prisma (après modification du schema)
```powershell
npx prisma generate
```

---

## 📍 Localisation des Fichiers

- **Schéma** : `backend/prisma/schema.prisma`
- **Base de données** : `backend/prisma/dev.db`
- **Migrations** : `backend/prisma/migrations/`
- **Seed** : `backend/prisma/seed.js`

---

## 🔄 Migration vers MySQL/PostgreSQL (Optionnel)

Si vous souhaitez passer à une base de données plus robuste :

### Pour MySQL
```prisma
datasource db {
  provider = "mysql"
  url      = "mysql://user:password@localhost:3306/edusoft"
}
```

### Pour PostgreSQL
```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://user:password@localhost:5432/edusoft"
}
```

Puis exécutez :
```powershell
npx prisma migrate dev
npx prisma db seed
```

---

## 📊 Requêtes SQL Utiles

### Voir tous les élèves actifs
```sql
SELECT * FROM Student WHERE status = 'ACTIF';
```

### Voir les paiements du jour
```sql
SELECT * FROM Payment 
WHERE DATE(paymentDate) = DATE('now');
```

### Total des revenus
```sql
SELECT SUM(amount) as total FROM Payment;
```

### Élèves avec arriérés
```sql
SELECT s.regNumber, s.firstName, s.lastName,
       (SELECT SUM(f.amount) FROM Fee f 
        JOIN Class c ON f.classId = c.id
        JOIN Enrollment e ON e.classId = c.id
        WHERE e.studentId = s.id) as totalDue,
       (SELECT COALESCE(SUM(p.amount), 0) FROM Payment p 
        WHERE p.studentId = s.id) as totalPaid
FROM Student s
WHERE status = 'ACTIF';
```

---

## 🎯 Accès Rapide à Prisma Studio

**Commande** :
```powershell
cd "C:\Users\HP\Desktop\ITA\GESTION ECOLE INSCRIPTION\backend"
npx prisma studio
```

**Lien** : [http://localhost:5555](http://localhost:5555)

Prisma Studio vous permet de :
- ✅ Visualiser toutes les tables
- ✅ Ajouter/Modifier/Supprimer des données
- ✅ Voir les relations entre tables
- ✅ Exporter des données

---

**Base de données SQLite légère et performante pour EDUSOFT ! 🎓**
