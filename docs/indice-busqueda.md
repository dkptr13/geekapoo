# Índice de búsqueda: cuándo refrescarlo y cómo

> **Actualizado el 2026-11-08:** el generador ya soporta actualización
> incremental (`--only`, `--anime`, `--dry-run`) y publicación atómica.
> Este documento conserva la explicación histórica y las cifras de la
> versión anterior. Para operar o pasar instrucciones a otro agente, usa
> [`docs/guia-agentes-datos.md`](guia-agentes-datos.md).

Fecha: 2026-11-04 (cifras históricas)

Ámbito: Wiki, ficha, buscador, perfiles, editor de tier lists, sitemap y páginas estáticas de anime.

Documento relacionado: [`docs/auditoria/firebase-costes.md`](auditoria/firebase-costes.md), secciones 12 y 13.

## 1. Qué es el índice

Firestore no permite buscar subcadenas. Para que el buscador no tenga que descargar el catálogo completo, la aplicación usa un índice estático:

- **Archivo versionado:** `public/busqueda/indice.json.gz` (~1,52 MB).
- **Archivo generado en cada build/dev:** `public/busqueda/indice.json` (~8,31 MB, ignorado por Git).
- **Lista ligera de animes:** `public/busqueda/animes.json` (~261 KB, ignorado por Git).
- **Temporadas por anime:** `public/busqueda/temporadas.json` (~389 KB, ignorado por Git).
- **Disponibilidad de streaming:** `public/busqueda/streaming.json` (~1,69 MB, ~96 KB gzip; ignorado por Git).
- **Contenido:** 197 animes, 489 temporadas, 8.514 episodios, 5.051 personajes y 7.824 filas de streaming (última medición).
- **Campos:** título, japonés, romaji, alias, sinopsis/géneros/estudio, descripciones, imágenes, notas, claves de búsqueda, datos de temporada y disponibilidad por región.

`animes.json` es solo el array de animes del índice. Lo usan la rejilla de la Wiki, los perfiles, las tier lists y el panel cuando necesitan el catálogo de series; la ficha abierta lee su documento completo de Firestore.

`temporadas.json` agrupa las temporadas por anime. La ficha lo usa para el selector y para la ficha de cada temporada; si el archivo falta, no conoce la serie o el contador `seasonsCount` del anime no coincide con la lista, se leen las temporadas de Firestore como respaldo.

`streaming.json` agrupa la disponibilidad por anime y región. La web pública la usa para pintar «Dónde verla» sin pedir `streamingAvailability`; si el archivo falta o no conoce la serie, cae a Firestore. El panel de administración sigue leyendo Firestore para ver siempre el último cambio.

El índice **no contiene**:

- hilos, comentarios, usuarios, chats o notificaciones.

Por eso cambiar una temporada o una plataforma **sí** obliga a refrescarlo si quieres que la web pública lo vea. El panel ve los cambios al momento.

## 2. Cómo se usa en el build

`prebuild` y `predev` ejecutan:

```bash
node scripts/generar-indice-busqueda.mjs
```

Ese script:

1. Si existe `public/busqueda/indice.json.gz`, lo descomprime y termina.
2. Si no existe, lee Firestore y genera el JSON y el `.gz`.
3. Siempre escribe `animes.json`, `temporadas.json` y `streaming.json` a partir del índice.
4. Si el `.gz` tiene más de 7 días, avisa por consola, pero lo usa igual.

Después:

- `generar-sitemap.mjs` reutiliza los animes del índice.
- `generar-paginas-anime.mjs` reutiliza animes, episodios, personajes y streaming del índice.
- El cliente descarga `/busqueda/indice.json` para el buscador y lo cachea en IndexedDB.
- La Wiki y los perfiles descargan `/busqueda/animes.json` (solo animes) y leen de Firestore únicamente el documento de la ficha abierta.
- La ficha descarga `/busqueda/temporadas.json` y ya no pide la colección `seasons` salvo que el archivo no sirva.
- La ficha descarga `/busqueda/streaming.json` y ya no pide `streamingAvailability` salvo que el archivo no sirva.

## 3. Cuándo ejecutar `npm run index:buscar`

Sí, cuando cambie algo que deba aparecer en la búsqueda o en los artefactos generados:

| Cambio | ¿Refrescar? | Motivo |
|---|---:|---|
| Crear, editar o borrar un anime | **Sí** | Rejilla de Wiki/Perfiles (`animes.json`), búsqueda, sitemap, página estática y tier lists. |
| Crear, editar o borrar un episodio | **Sí** | Búsqueda de episodios; el título/descripción antigua seguiría en el índice. |
| Crear, editar o borrar un personaje | **Sí** | Búsqueda de personajes, perfiles y tier lists. |
| Cambiar título, alias, japonés o romaji | **Sí** | Es lo que usa el buscador. |
| Cambiar sinopsis, descripción, géneros, estudio, categoría, año o nota | **Sí** | Afecta a resultados y filtros de búsqueda. |
| Cambiar portada, banner, miniatura o imagen | **Sí** | Las tarjetas del buscador y el editor de tier lists usan la URL del índice. |
| Añadir un anime nuevo | **Sí, antes de desplegar** | Sin refrescar no aparece en la rejilla de la Wiki/Perfil ni entra en sitemap; la ficha directa por slug sí puede cargarlo desde Firestore. |
| Crear, editar o borrar una temporada | **Sí** | La ficha usa `temporadas.json`. Si cambia el número de temporadas, `seasonsCount` detecta la lista vieja y cae a Firestore; los cambios de título, portada o sinopsis no se ven hasta refrescar. |
| Cambiar disponibilidad de streaming | **Sí** | La web pública usa `streaming.json`; el panel ve el cambio al momento, pero la ficha pública lo verá al refrescar y desplegar. |
| Crear o editar un hilo/comentario | No | No está en el índice. |
| Cambiar usuarios, chats o notificaciones | No | No está en el índice. |
| Cambiar solo código o documentación | No | No cambia el catálogo. |
| Crear una categoría sin asignarla a un anime | No | Solo afecta si cambias la categoría de un anime. |

## 4. Flujo para refrescar

Desde la raíz del proyecto:

```bash
npm run index:buscar
```

Eso:

- lee Firestore una vez (197 animes + 489 temporadas + 8.514 episodios + 5.051 personajes + 7.824 filas de streaming ≈ 22.075 documentos),
- actualiza `public/busqueda/indice.json`,
- actualiza `public/busqueda/indice.json.gz`,
- actualiza `public/busqueda/animes.json` con la lista ligera,
- actualiza `public/busqueda/temporadas.json` con las temporadas agrupadas por anime,
- actualiza `public/busqueda/streaming.json` con la disponibilidad agrupada por anime y región.

Después:

```bash
git add public/busqueda/indice.json.gz
git commit -m "Actualiza el indice de busqueda"
git push origin main
```

No se commitean `public/busqueda/indice.json`, `public/busqueda/animes.json`, `public/busqueda/temporadas.json` ni `public/busqueda/streaming.json`: están ignorados. Solo el `.gz`.

## 5. Qué pasa si no lo refrescas

- La ficha normal, el panel y las páginas que leen Firestore **sí** pueden mostrar el cambio, tras su TTL de 5–30 minutos.
- El buscador, la rejilla de la Wiki/Perfil, el sitemap y las páginas estáticas seguirán usando el índice anterior.
- Un anime nuevo puede abrirse por su slug (la ficha lee su documento), pero no aparecerá en la rejilla de la Wiki/Perfil ni en el sitemap, y no tendrá página estática hasta el refresco.
- Un anime/episodio/personaje borrado puede seguir saliendo en el buscador y en la rejilla de la Wiki hasta el refresco.
- La ficha puede seguir enseñando el título, la portada o la sinopsis antigua de una temporada hasta el refresco. Si se crea o borra una temporada, el contador `seasonsCount` no coincidirá y la ficha pedirá la lista real a Firestore.
- La disponibilidad pública de streaming puede seguir mostrando la plataforma o el estado anterior hasta el refresco. El panel de administración lee Firestore y ve el cambio al momento.
- Si el `.gz` supera los 7 días, el build avisa; no lo regenera automáticamente.

## 6. Caché del navegador

El cliente guarda en IndexedDB:

- el índice del buscador, clave `search:index:v1`, durante **1 hora**;
- la lista ligera de animes, clave `search:animes:v1`, durante **1 hora**;
- las temporadas por anime, clave `search:temporadas:v1`, durante **1 hora**;
- la disponibilidad de streaming, clave `search:streaming:v1`, durante **1 hora**;
- la ficha completa de un anime abierto, clave `anime-doc:<id>`, durante **2 minutos**.

Después de desplegar un índice nuevo:

- un navegador que ya había buscado puede seguir usando la copia anterior hasta 1 hora;
- para verlo antes, hay que borrar los datos del sitio o la entrada de IndexedDB `geekapoo-public-firestore-cache`.

Si se quiere invalidación inmediata en cada despliegue, habría que incluir el SHA del build en la clave de caché. No está hecho para no acumular copias de ~6 MB en IndexedDB.

## 7. Coste

| Operación | Lecturas |
|---|---:|
| `npm run index:buscar` (refresco manual) | ≈22.075 |
| Push normal con índice cacheado | ≈7 (solo plataformas; streaming sale del índice) |
| Push normal antes de cachear el índice (medición anterior) | ≈14.469 |
| Primera carga de Wiki/Perfil | **0** lecturas (solo `animes.json`, ~261 KB) |
| Abrir una ficha | **1** lectura del documento del anime; temporadas **0** y streaming **0** (solo `temporadas.json` y `streaming.json`) |

El refresco manual se hace solo cuando cambia el catálogo. Los pushes de código o documentación no leen el catálogo.

## 8. Archivos implicados

| Archivo | Papel |
|---|---|
| `scripts/generar-indice-busqueda.mjs` | Genera el JSON, el `.gz`, `animes.json`, `temporadas.json` y `streaming.json`; usa el cache si existe. |
| `public/busqueda/indice.json.gz` | Índice comprimido versionado. |
| `public/busqueda/indice.json` | Índice descomprimido para el build/dev; ignorado por Git. |
| `public/busqueda/animes.json` | Lista ligera de animes para Wiki/Perfiles; ignorada por Git. |
| `public/busqueda/temporadas.json` | Temporadas agrupadas por anime para la ficha; ignoradas por Git. |
| `public/busqueda/streaming.json` | Disponibilidad agrupada por anime y región; ignorada por Git. |
| `src/services/searchIndex.ts` | Descarga y cachea el índice, animes, temporadas y streaming. |
| `src/hooks/useAnimeDoc.ts` | Lee solo el documento completo de la ficha abierta. |
| `src/hooks/useStreamingAvailability.ts` | Usa `streaming.json` en la web y Firestore en el panel. |
| `scripts/generar-sitemap.mjs` | Reutiliza los animes del índice. |
| `scripts/generar-paginas-anime.mjs` | Reutiliza animes, episodios, personajes y streaming del índice. |
| `package.json` | `predev`, `prebuild` e `index:buscar`. |

## 9. Comandos útiles

```bash
# Refrescar el índice tras cambios de catálogo
npm run index:buscar

# Comprobar que el build usa el cache (no debe leer el catálogo)
npm run build

# Ver el tamaño del índice comprimido
Get-Item public/busqueda/indice.json.gz | Select-Object Length
```

En el log del build deberías ver:

```text
indice-busqueda: usa cache local (... animes, ... temporadas, ... filas de streaming, ... episodios, ... personajes)
sitemap: reutiliza el indice de busqueda
streaming ES: reutiliza el indice (144 animes)
```

## 10. Automatización futura

Opciones si no quieres acordarte del refresco manual:

1. **GitHub Action programada** que ejecute `npm run index:buscar` y commitee el `.gz` una vez al día o a la semana.
2. **Cloud Function** que mantenga el índice en Firestore/Storage al editar animes, episodios o personajes. Sería instantáneo, pero añade escrituras y mantenimiento.
3. **Aviso en el panel** recordando refrescar el índice después de cambios de catálogo.

La opción 1 es la más sencilla para mantener el coste bajo: el build normal sigue en ~7 lecturas y el refresco ocurre una vez por periodo, no en cada push.

## 11. Checklist rápido

- [ ] ¿He cambiado un anime, temporada, episodio, personaje o disponibilidad de streaming? → `npm run index:buscar`.
- [ ] ¿He añadido un anime? → refrescar antes de desplegar para la rejilla de la Wiki/Perfil, el sitemap y la página estática.
- [ ] ¿Solo he cambiado foro, usuarios o código? → no hace falta.
- [ ] ¿He commiteado `public/busqueda/indice.json.gz`? → comprobar antes del push.
- [ ] ¿El build dice `usa cache local`? → correcto.
- [ ] ¿El buscador o la disponibilidad siguen viendo lo antiguo? → esperar 1 h o borrar la caché del sitio.
