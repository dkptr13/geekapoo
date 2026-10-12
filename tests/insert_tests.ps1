$content = Get-Content "C:\web anime\tests\firestore.clubs.rules.test.cjs"
$idx = -1
for ($i=0; $i -lt $content.Length; $i++) {
    if ($content[$i] -like "*QUE NO SE HAYA ROTO*") {
        $idx = $i
        break
    }
}
if ($idx -gt 0) {
    Write-Host "Found at $idx"
    $new = @"
// ════════════════════════════════════════════════════════════
// ENTRAR EN CLUB PÚBLICO (sin solicitud)
// ════════════════════════════════════════════════════════════

describe('Entrar en un club público (auto-unirse)', () => {
  const slug = 'club-publico-test';

  beforeEach(async () => {
    await sembrar(async (f) => {
      await setDoc(doc(f, 'clubs', slug), nuevoClub(DUENO, {
        slug,
        name: 'Club Público',
        accessType: 'public',
        moderatorIds: [],
      }));
      await setDoc(
        doc(f, 'chats', 'chat-club-1'),
        nuevoChatClub(DUENO, [DUENO], slug),
      );
    });
  });

  it('un usuario puede añadirse a sí mismo en la ficha del club', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'clubs', slug), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberCount: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('y también en el chat del club (memberIds + hiddenFor)', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'chats', 'chat-club-1'), {
        memberIds: [DUENO, ALICE],
        hiddenFor: [],
      }),
    );
  });

  it('pero NO en un club privado (accessType == private)', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', slug), { accessType: 'private' });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', slug), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberCount: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('ni en un club por solicitud (accessType == request)', async () => {
    await sembrar(async (f) => {
      await updateDoc(doc(f, 'clubs', slug), { accessType: 'request' });
    });

    await assertFails(
      updateDoc(doc(db(ALICE), 'clubs', slug), {
        memberIds: [DUENO, ALICE],
        members: {
          [DUENO]: { uid: DUENO, role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z' },
          [ALICE]: { uid: ALICE, role: 'member', joinedAt: '2026-01-01T00:00:00.000Z' },
        },
        memberCount: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
"
    $out = $content[0..($idx-1)] + $new + $content[$idx..($content.length-1)]
    $out | Set-Content "C:\web anime\tests\firestore.clubs.rules.test.cjs"
    Write-Host "Done"
} else {
    Write-Host "Not found"
}