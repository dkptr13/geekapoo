$content = Get-Content "C:\web anime\tests\firestore.clubs.rules.test.cjs"
$out = @()
$i = 0
while ($i -lt $content.Length) {
    $line = $content[$i]
    if ($line -like "*ni nombrar moderadores nuevos*") {
        # Skip until closing }); and replace the whole block
        $out += "  it('el moderador puede cambiar el rol en el espejo, pero no la autoridad', async () => {"
        $out += "    // El espejo cambia (escribe members[CARA].role = moderator)..."
        $out += "    await assertSucceeds("
        $out += "      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), conMiembros({"
        $out += "        [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },"
        $out += "        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },"
        $out += "        [CARA]: { uid: CARA, role: 'moderator', joinedAt: '2026-01-03T00:00:00.000Z' },"
        $out += "      })),"
        $out += "    );"
        $out += "    // ...pero moderatorIds NO cambia (no estÃ¡ en claves permitidas)."
        $out += "    await assertFails("
        $out += "      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), {"
        $out += "        moderatorIds: [DUENO, MOD, CARA],"
        $out += "      }),"
        $out += "    );"
        $out += "  });"
        # Skip original lines until });
        while ($i -lt $content.Length -and $content[$i] -notlike "*});*") { $i++ }
        $i++  # skip the });
    }
    elseif ($line -like "*intercambiar fichas para hacerse due*") {
        $out += "  it('el moderador puede intercambiar fichas en el espejo, pero no la autoridad', async () => {"
        $out += "    await assertSucceeds("
        $out += "      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), conMiembros({"
        $out += "        [DUENO]: { uid: DUENO, role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },"
        $out += "        [CARA]: { uid: CARA, role: 'owner', joinedAt: '2026-01-03T00:00:00.000Z' },"
        $out += "        [MOD]: { uid: MOD, role: 'moderator', joinedAt: '2026-01-02T00:00:00.000Z' },"
        $out += "      })),"
        $out += "    );"
        $out += "    // moderatorIds no se puede tocar desde la rama del moderador"
        $out += "    await assertFails("
        $out += "      updateDoc(doc(db(MOD), 'clubs', 'club-de-frieren'), {"
        $out += "        moderatorIds: [CARA, MOD],"
        $out += "      }),"
        $out += "    );"
        $out += "  });"
        while ($i -lt $content.Length -and $content[$i] -notlike "*});*") { $i++ }
        $i++
    }
    else {
        $out += $line
        $i++
    }
}
$out | Set-Content "C:\web anime\tests\firestore.clubs.rules.test.cjs"
Write-Host "Done"