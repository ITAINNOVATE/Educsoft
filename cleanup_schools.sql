-- ============================================================
-- SCRIPT DE NETTOYAGE EDUSOFT
-- Supprime CREUSET DU SAVOIR et ECOLE PRIVEE LES MERVEILLES
-- Conserve uniquement ITA (ID: 809c17d7-5a93-4b69-81c5-f080ce4126a3)
-- ============================================================

DO $$
DECLARE
    school1 UUID := '7ce8166a-c90d-49ca-92b3-2983008e1127'; -- CREUSET DU SAVOIR
    school2 UUID := 'b4d7f9d6-c495-4415-a67d-74e0c8dc4ea7'; -- ECOLE PRIVEE LES MERVEILLES
    ids UUID[] := ARRAY[school1, school2];
    s UUID;
BEGIN
    FOREACH s IN ARRAY ids LOOP
        RAISE NOTICE 'Nettoyage de l école ID: %', s;

        -- 1. Supprimer les logs d audit
        DELETE FROM "AuditLog" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> AuditLog supprimés';

        -- 2. Supprimer les paiements enseignants
        DELETE FROM "TeacherPayment" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> TeacherPayment supprimés';

        -- 3. Supprimer les paiements élèves
        DELETE FROM "Payment" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> Payment supprimés';

        -- 4. Supprimer les inscriptions des élèves de cet établissement
        DELETE FROM "Enrollment" e
        USING "Student" st
        WHERE e."studentId" = st.id AND st."establishmentId" = s;
        RAISE NOTICE '  -> Enrollment supprimés';

        -- 5. Supprimer ParentStudent des élèves de cet établissement
        DELETE FROM "ParentStudent" ps
        USING "Student" st
        WHERE ps."studentId" = st.id AND st."establishmentId" = s;
        RAISE NOTICE '  -> ParentStudent supprimés';

        -- 6. Supprimer les documents des élèves
        DELETE FROM "Document" d
        USING "Student" st
        WHERE d."studentId" = st.id AND st."establishmentId" = s;
        RAISE NOTICE '  -> Document supprimés';

        -- 7. Supprimer les SchoolHistory des élèves
        DELETE FROM "SchoolHistory" sh
        USING "Student" st
        WHERE sh."studentId" = st.id AND st."establishmentId" = s;
        RAISE NOTICE '  -> SchoolHistory supprimés';

        -- 8. Supprimer les élèves
        DELETE FROM "Student" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> Students supprimés';

        -- 9. Supprimer les parents
        DELETE FROM "Parent" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> Parents supprimés';

        -- 10. Supprimer les Fees des classes
        DELETE FROM "Fee" f
        USING "Class" c
        WHERE f."classId" = c.id AND c."establishmentId" = s;
        RAISE NOTICE '  -> Fees supprimés';

        -- 11. Supprimer les classes
        DELETE FROM "Class" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> Classes supprimées';

        -- 12. Supprimer les années scolaires
        DELETE FROM "SchoolYear" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> SchoolYears supprimées';

        -- 13. Supprimer les utilisateurs
        DELETE FROM "User" WHERE "establishmentId" = s;
        RAISE NOTICE '  -> Users supprimés';

        -- 14. Supprimer l établissement lui-même
        DELETE FROM "Establishment" WHERE id = s;
        RAISE NOTICE '  -> Establishment supprimé ✅';
    END LOOP;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'NETTOYAGE TERMINÉ - Vérification finale:';
END $$;

-- Vérification finale
SELECT id, name, code FROM "Establishment";
