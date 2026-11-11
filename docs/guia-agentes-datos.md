# Guía para agentes: datos, mantenimiento e índice de búsqueda

Fecha: 2026-11-08

Esta guía es para cualquier agente que vaya a añadir, corregir o indexar
contenido en Geekapoo. Léela antes de ejecutar comandos. Sustituye el
flujo antiguo de "refrescar todo el índice" para operaciones pequeñas.

Documento histórico relacionado: [`docs/indice-busqueda.md`](indice-busqueda.md).
Las cifras y comandos de ese documento son de la versión anterior; para
trabajar usa esta guía.

---

## 0. Reglas que no se negocian

1. **No ejecutes escrituras en producción sin autorización expresa.**
   `--escribir`, `--podar`, instalación de datos o cualquier script que
   modifique Firestore requiere que el usuario lo haya pedido.
2. **No hagas `git push` ni deploy sin autorización.** Un índice
   actualizado en local no cambia Vercel hasta que se commitea el `.gz`
   y se despliega.
3. **No uses `--full` para una operación pequeña.** La reconstrucción
   completa lee unas 23.410 filas del catálogo.
4. **Primero simula.** Los scripts de mantenimiento tienen `--dry-run` o
   funcionan sin `--escribir`. El índice tiene `--dry-run`.
5. **No uses el índice local como única verdad para borrar o pisar.**
   Sirve para localizar candidatos, pero el documento actual se consulta
   en Firestore antes de modificarlo.
6. **No modifiques `firestore.rules`, permisos, diseño, Wiki ni SEO**
   para resolver una tarea de datos.
7. **No crees otra caché ni otro índice.** Reutiliza
   `public/busqueda/indice.json.gz` y los helpers existentes.
8. **No leas `episodes` o `characters` enteros sin `--full`.** Una
   lectura completa de `episodes` son unos 9.200 documentos y una de
   `characters` unos 6.300. Para un anime concreto usa `leerPorCampo` o
   `leerPorIds` con `animeId`. Los scripts globales llevan una guarda
   `--full` precisamente para que esto no pase por accidente.

---

## 1. Arquitectura que hay que entender

El buscador y la Wiki pública usan archivos estáticos:

| Archivo | Papel | ¿Git? |
|---|---|---|
| `public/busqueda/indice.json.gz` | Índice comprimido versionado; fuente del build | **Sí** |
| `public/busqueda/indice.json` | Índice descomprimido generado por el build | No |
| `public/busqueda/animes.json` | Lista ligera de animes para Wiki/Perfiles | No |
| `public/busqueda/temporadas.json` | Temporadas agrupadas por anime | No |
| `public/busqueda/streaming.json` | Disponibilidad agrupada por anime/región | No |

El build normal (`npm run build`) **no lee el catálogo**: `predev` y
`prebuild` ejecutan el generador con `--cache`, que descomprime el `.gz`.
Después, `generar-sitemap.mjs` y `generar-paginas-anime.mjs` reutilizan
ese índice.

Cambiar Firestore no cambia la web pública por sí solo. Para que el
cambio llegue al buscador, la Wiki, el sitemap o las páginas estáticas hay
que regenerar la parte afectada del índice y desplegar.

---

## 2. Decidir qué comando usar

| Lo que ha cambiado | Comando |
|---|---|
| Solo código o documentación | Nada |
| Hilos, comentarios, usuarios, chats o notificaciones | Nada: no están en el índice |
| Disponibilidad de streaming de un anime | `index:buscar -- --only streamingAvailability --anime <id>` |
| Episodios de un anime | `index:buscar -- --only episodes --anime <id>` |
| Personajes de un anime | `index:buscar -- --only characters --anime <id>` |
| Temporadas de un anime | `index:buscar -- --only seasons --anime <id>` |
| Ficha/título/portada de un anime | `index:buscar -- --only animes --anime <id>` |
| Varias secciones de un anime | `--only animes,seasons,episodes,characters,streamingAvailability --anime <id>` |
| Cambio global de una colección | `index:buscar -- --only <colección>` |
| Quieres comprobar sin escribir el índice | añade `--dry-run` |
| Reconstrucción completa de todo | `index:buscar -- --full` (solo si se pide) |

Si el usuario no ha pedido explícitamente una reconstrucción completa,
**no uses `--full`**.

---

## 3. Comandos del índice incremental

Sintaxis general:

```powershell
npm run index:buscar -- --only <colección>[,<colección>] [--anime <id-o-slug>[,<id-o-slug>]] [--dry-run]
```

Colecciones válidas:

- `animes`
- `seasons`
- `episodes`
- `characters`
- `streamingAvailability`

Ejemplos:

```powershell
# Solo episodios de un anime
npm run index:buscar -- --only episodes --anime one-piece

# Personajes de varios animes
npm run index:buscar -- --only characters --anime one-piece,naruto

# Solo disponibilidad
npm run index:buscar -- --only streamingAvailability --anime one-piece

# Varias secciones del mismo anime
npm run index:buscar -- --only animes,seasons,episodes,characters,streamingAvailability --anime one-piece

# Comprobar sin escribir
npm run index:buscar -- --only streamingAvailability --anime one-piece --dry-run

# Colección entera, sin filtro de anime
npm run index:buscar -- --only episodes

# Varias colecciones completas
npm run index:buscar -- --only episodes,characters

# Reconstrucción completa explícita
npm run index:buscar -- --full
```

Notas:

- `--anime` acepta el **id real** o el **slug** del índice. Se resuelve
  contra el índice y, si no está, contra Firestore. No se asume que el
  slug sea el id.
- `--only` y `--full` no se pueden combinar.
- `--anime` necesita `--only`; no se combina con `--full`.
- El `--cache` es interno de `predev`/`prebuild`; no lo uses a mano.
- `--refresh` sigue existiendo como alias antiguo de `--full`; para
  comandos nuevos usa `--full`.

### Qué lee cada actualización

| Sección actualizada | Lee de Firestore | Reutiliza del índice |
|---|---:|---:|
| `animes` | 211 | todo lo demás |
| `seasons` | 520 | todo lo demás |
| `episodes` | 9.035 | todo lo demás |
| `characters` | 5.702 | todo lo demás |
| `streamingAvailability` | 7.942 | todo lo demás |
| `--anime <id>` en una sección | solo los documentos de ese anime | todo lo demás |
| `--full` | 23.410 | nada |

Las cifras son documentos leídos, no facturación.

### Qué hace el generador con el índice anterior

1. Lee y valida `indice.json.gz`.
2. Si `--only` no tiene una base válida, **falla y conserva el anterior**.
3. Consulta únicamente las colecciones indicadas.
4. Sustituye solo esas secciones; con `--anime`, solo las filas de esos
   animes.
5. Reconstruye `animes.json`, `temporadas.json` y `streaming.json` desde
   el índice fusionado, sin leer Firestore.
6. Valida IDs, secciones y relaciones.
7. Genera JSON y gzip, comprueba que contienen lo mismo y publica con
   temporales y copia de seguridad.
8. Si algo falla, conserva la versión anterior.

El frontend no necesita cambios: sigue consumiendo `version: 1`. Los
metadatos añadidos (`tipo`, `parcial`, `colecciones`, `baseHuella`,
`actualizado`) son ignorados por el cliente.

---

## 4. Flujo para añadir un anime nuevo

No basta con crear la ficha: si quieres disponibilidad, hay que añadir su
ID de JustWatch al importador. El importador solo procesa los animes que
están en `FICHAS` dentro de
`scripts/importar-disponibilidad-justwatch.mjs`.

Orden recomendado:

1. **Inspeccionar** cómo se añaden animes, temporadas, episodios y
   personajes en `scripts/datos/`, `scripts/cargar-anime.mjs` y el panel.
2. **Crear los documentos** del anime y sus relaciones con los patrones
   existentes.
3. **Añadir la entrada a `FICHAS`**:
   ```js
   'mi-anime': {
     id: 'ts123456',
     titulo: 'Mi anime',
     anio: 2026,
   },
   ```
   Verifica el ID de JustWatch antes.
4. **Simular la disponibilidad**:
   ```powershell
   node scripts/importar-disponibilidad-justwatch.mjs --anime mi-anime
   ```
5. **Escribir disponibilidad solo si el usuario lo autoriza**:
   ```powershell
   node scripts/importar-disponibilidad-justwatch.mjs --anime mi-anime --escribir
   ```
   No uses `--podar` salvo petición expresa.
6. **Actualizar el índice solo para ese anime**:
   ```powershell
   npm run index:buscar -- --only animes,seasons,episodes,characters,streamingAvailability --anime mi-anime
   ```
   El generador resuelve el ID real; si el anime no estaba en el índice,
   añade su ficha de `animes` como dependencia.
7. **Comprobar**:
   ```powershell
   npm run index:buscar -- --only animes --anime mi-anime --dry-run
   npm run build
   ```
8. **Commit** del `.gz`:
   ```powershell
   git add public/busqueda/indice.json.gz
   git commit -m "Datos: añade <anime> e índice"
   ```
9. **Push/deploy**: solo si el usuario lo pide. Sin push, Vercel no
   recibe el índice nuevo.

Si el anime ya existía y solo cambió la disponibilidad, no hace falta
tocar animes, temporadas, episodios ni personajes:

```powershell
npm run index:buscar -- --only streamingAvailability --anime one-piece
```

---

## 5. Scripts de mantenimiento: categorías

### A. Selectivos

No deben descargar la colección completa:

```powershell
node scripts/bajar-personajes.mjs <animeId>
node scripts/bajar-miniaturas.mjs <animeId>
node scripts/cambiar-fecha.mjs <seasonId> <episodio> <fecha> ...
node scripts/poner-personaje.mjs <animeId> <nombre> <anilistId>
node scripts/ver-personajes-base.mjs <animeId>
```

- `bajar-personajes`: consulta solo los personajes de ese anime.
- `bajar-miniaturas`: consulta solo los episodios de ese anime.
- `cambiar-fecha`: consulta solo los episodios de esa temporada.
- `poner-personaje`: consulta solo los personajes de ese anime.
- `ver-personajes-base`: consulta solo ese anime.

### B. Por anime o temporada

```powershell
node scripts/corregir-seasonids.mjs --anime <id>[,<id>] --dry-run
node scripts/enlazar-imagenes.mjs --anime <id>[,<id>] --dry-run
node scripts/rellenar-alias.mjs --anime <id>[,<id>] --dry-run
node scripts/emparejar-miniaturas.mjs --anime <id> [--escribir]
node scripts/emparejar-miniaturas-fecha.mjs --anime <id> [--escribir]
node scripts/emparejar-miniaturas-tvdb.mjs --anime <id>[,<id>] [--escribir]
node scripts/ver-capitulos-base.mjs <animeId>
node scripts/mirar-miniaturas.mjs <animeId> [cuantas]
node scripts/ver-miniaturas.mjs <animeId>
node scripts/ver-miniaturas-repetidas.mjs <animeId>
node scripts/ver-emparejamiento.mjs <animeId>
node scripts/ver-imagenes-personajes.mjs --anime <animeId>
```

- `--anime` puede repetirse o llevar una lista separada por comas en los
  scripts que lo soportan.
- Los bloques de más de 30 IDs se parten automáticamente.
- `ver-emparejamiento` y `ver-imagenes-personajes` consultan solo ese
  anime.

### B2. Lecturas completas y el coste de `coleccion()`

`coleccion('episodes')` y `coleccion('characters')` **no** leen una
página: recorren la colección entera con `pageSize=300`. Cada pasada
cuesta:

| Colección | Documentos | Páginas de 300 | Lecturas |
|---|---:|---:|---:|
| `episodes` | ~9.253 | 31 | ~9.253 |
| `characters` | ~6.338 | 22 | ~6.338 |

Eso significa que un script de auditoría que se ejecuta cinco veces sin
querer puede gastar más de 45.000 lecturas de episodios. Pasó durante las
tandas de noviembre de 2026: varias comprobaciones de miniaturas y
relaciones leyeron la colección completa repetidamente.

Reglas:

- Para un anime concreto, usa `leerPorCampo({ coleccion: 'episodes',
  campo: 'animeId', valor: id })` o `leerPorIds`. Nunca `coleccion()`
  para luego filtrar en memoria.
- Para personajes de un anime, lo mismo con `characters` y `animeId`.
- Para auditorías globales, usa el índice local
  (`public/busqueda/indice.json.gz`) y consulta Firestore solo por los
  IDs que realmente vayas a tocar.
- Los scripts que sí necesitan la colección entera llevan una guarda
  `--full` y no arrancan sin ella. No la quites.
- No ejecutes el mismo script global varias veces seguidas para ver
  cambios pequeños: usa `--anime` o el índice incremental.

Scripts con guarda `--full` o `--anime` obligatoria:

```powershell
node scripts/ver-imagenes.mjs --full
node scripts/ver-miniaturas-vivas.mjs --full
node scripts/ver-miniaturas.mjs --full
node scripts/ver-miniaturas.mjs <animeId>
node scripts/ver-miniaturas-repetidas.mjs --full
node scripts/ver-miniaturas-repetidas.mjs <animeId>
node scripts/ver-rechazados-fecha.mjs <animeId> --full
node scripts/mirar-miniaturas.mjs <animeId>
node scripts/ver-capitulos-base.mjs <animeId>
node scripts/enlazar-imagenes.mjs --anime <id>[,<id>] | --full
node scripts/ver-emparejamiento.mjs <animeId> | --full
node scripts/ver-imagenes-personajes.mjs --anime <animeId> | --full
node scripts/corregir-seasonids.mjs --anime <id>[,<id>] | --full
node scripts/rellenar-alias.mjs --anime <id>[,<id>] | --full
```

### C. Reconstrucción o auditoría global

Requieren `--full` explícito:

```powershell
node scripts/ver-imagenes.mjs --full
node scripts/ver-miniaturas-vivas.mjs --full
node scripts/ver-miniaturas.mjs --full
node scripts/ver-miniaturas-repetidas.mjs --full
node scripts/ver-rechazados-fecha.mjs <animeId> --full
node scripts/ver-emparejamiento.mjs --full
node scripts/ver-imagenes-personajes.mjs --full
node scripts/corregir-seasonids.mjs --full
node scripts/rellenar-alias.mjs --full
node scripts/enlazar-imagenes.mjs --full
node scripts/emparejar-miniaturas.mjs --full
node scripts/emparejar-miniaturas-fecha.mjs --full
node scripts/emparejar-miniaturas-tvdb.mjs --full
```

`corregir-personajes-conocidos.mjs` usa el índice local para localizar
candidatos y lee después los documentos concretos. `--full` está
disponible para revisar la colección completa.

### No hacer

- No ejecutes un script global sin `--full`: los scripts ahora lo piden
  para que una auditoría no descargue miles de documentos por accidente.
- No uses `--full` para corregir un solo anime.
- No ejecutes `--escribir` o `--podar` sin autorización.
- No uses el índice local para decidir un borrado: lee el documento
  actual antes.
- No uses `coleccion('episodes')` ni `coleccion('characters')` para
  luego filtrar por `animeId` en memoria: usa `leerPorCampo` o
  `leerPorIds`. La colección completa son ~9.253 episodios o ~6.338
  personajes por pasada.
- No repitas una auditoría completa para comprobar un cambio pequeño:
  usa `--anime` o el índice incremental.

---

## 6. Importador de JustWatch

Ya está optimizado: con `--anime` consulta solo las filas de ese anime.
No lo sustituyas ni lo vuelvas a cargar entero.

```powershell
# Simulación de un anime
node scripts/importar-disponibilidad-justwatch.mjs --anime one-piece

# Aplicar
node scripts/importar-disponibilidad-justwatch.mjs --anime one-piece --escribir

# Varios animes
node scripts/importar-disponibilidad-justwatch.mjs --anime one-piece,naruto --escribir

# Reconstrucción completa explícita
node scripts/importar-disponibilidad-justwatch.mjs --escribir

# Poda de obsoletas: solo con autorización
node scripts/importar-disponibilidad-justwatch.mjs --anime one-piece --escribir --podar
```

- Sin `--escribir` no escribe.
- Sin `--podar` no borra.
- `--podar` solo afecta a los animes seleccionados y protege filas
  manuales/sin verificar.
- `FICHAS` es la lista de animes que el importador conoce. Si un anime
  nuevo no está ahí, `--anime` no hará nada.

---

## 7. Después de cambiar datos

### Solo disponibilidad

```powershell
node scripts/importar-disponibilidad-justwatch.mjs --anime one-piece --escribir
npm run index:buscar -- --only streamingAvailability --anime one-piece
```

### Un anime nuevo o ficha completa

```powershell
npm run index:buscar -- --only animes,seasons,episodes,characters,streamingAvailability --anime mi-anime
```

### Cambio global de una colección

```powershell
npm run index:buscar -- --only episodes
```

### Nunca por defecto

```powershell
npm run index:buscar             # full: 23.410 lecturas
npm run index:buscar -- --full   # full explícito: 23.410 lecturas
```

Solo si el usuario pide una reconstrucción completa o hay una razón
justificada.

---

## 8. Verificación mínima antes de terminar

```powershell
npm run lint
npm run test:logica
npm run build
```

Para una operación de datos concreta, además:

```powershell
# Simulación del índice
npm run index:buscar -- --only <sección> --anime <id> --dry-run

# Comprobar que el gzip y el JSON son iguales
node -e "const fs=require('fs'),z=require('zlib');const a=fs.readFileSync('public/busqueda/indice.json','utf8');const b=z.gunzipSync(fs.readFileSync('public/busqueda/indice.json.gz')).toString();console.log(a===b)"

# Comprobar que el build usa la caché y no lee el catálogo
npm run build
```

El build correcto debe mostrar:

```text
indice-busqueda: usa cache local (...)
sitemap: reutiliza el indice de busqueda
```

---

## 9. Checklist para el agente

- [ ] ¿Me han pedido una escritura/borrado o solo una investigación?
- [ ] ¿He leído `FICHAS` antes de usar el importador con un anime nuevo?
- [ ] ¿Estoy usando `--anime` en vez de la importación completa?
- [ ] ¿He hecho primero `--dry-run` o simulación?
- [ ] ¿El cambio es de una sola colección? → `--only`.
- [ ] ¿Es de un solo anime? → `--anime`.
- [ ] ¿Estoy leyendo solo el anime que toca? → `leerPorCampo` o
  `leerPorIds`, no `coleccion()` para filtrar después.
- [ ] ¿He evitado `--full` salvo petición expresa?
- [ ] ¿He commiteado `public/busqueda/indice.json.gz` si cambió el índice?
- [ ] ¿He hecho push/deploy solo con autorización?
- [ ] ¿He conservado reglas, diseño, SEO y datos manuales?

---

## 10. Resumen de coste

| Operación | Documentos leídos |
|---|---:|
| `--full` | ~26.000 |
| `--only animes` | 247 |
| `--only seasons` | 561 |
| `--only episodes` | 9.253 |
| `--only characters` | 6.338 |
| `--only streamingAvailability` | 9.604 |
| `--only episodes --anime 86-eighty-six` | 23 |
| `--only streamingAvailability --anime one-piece` | 74 |
| `--only animes --anime 86-eighty-six` | 1 |
| `coleccion('episodes')` completa | 9.253 |
| `coleccion('characters')` completa | 6.338 |
| `leerPorCampo(... animeId ...)` | solo los del anime |
| `--cache` / build normal | 0 del catálogo |

Las cifras son documentos leídos/páginas REST, no facturación real.
