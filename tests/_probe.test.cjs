// PROBE TEMPORAL 2
const {
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  setDoc,
  updateDoc,
  deleteField,
} = require('firebase/firestore');

const fs = require('fs');
const path = require('path');

const RULES = fs.readFileSync(path.join(__dirname, '_probe.rules'), 'utf8');
const PROJECT = 'probe-rules';

let testEnv;
const db = (uid) => testEnv.authenticatedContext(uid).firestore();

before(async () => {
  testEnv = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: RULES } });
});
after(async () => { await testEnv.cleanup(); });
beforeEach(() => { testEnv.clearFirestore(); });

async function seed(col, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), col, 'doc1'), data);
  });
}

async function probe(nombre, update) {
  try {
    await updateDoc(doc(db('u'), nombre, 'doc1'), update);
    console.log(`${nombre}: PERMITIDO`);
  } catch (e) {
    console.log(`${nombre}: DENEGADO`);
  }
}

it('probes', async () => {
  const miembro = (role) => ({ uid: role, role, joinedAt: 't' });

  // Cambio de rol anidado en members.a
  await seed('probeA', { members: { a: miembro('member') } });
  await probe('probeA', { 'members.a.role': 'moderator' });

  await seed('probeA2', { members: { a: miembro('member') } });
  await probe('probeA2', { 'members.a.role': 'moderator' });

  // Borrado de members.a
  await seed('probeB1', { members: { a: miembro('member'), b: miembro('owner') } });
  await probe('probeB1', { 'members.a': deleteField() });

  await seed('probeB2', { members: { a: miembro('member'), b: miembro('owner') } });
  await probe('probeB2', { 'members.a': deleteField() });

  await seed('probeB3', { members: { a: miembro('member'), b: miembro('owner') } });
  await probe('probeB3', { 'members.a': deleteField() });

  // hasAll: eliminar a b (supervivientes ya estaban, mismo tamaño tras reemplazo?)
  await seed('probeG', { members: { a: miembro('owner'), b: miembro('member') } });
  await probe('probeG', { members: { a: miembro('owner'), c: miembro('member') } });

  // keyValues
  await seed('probeI', { members: { a: miembro('owner') } });
  await probe('probeI', { x: 1 });
});
