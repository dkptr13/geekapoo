# Índice de búsqueda: cuándo refrescarlo y cómo

Fecha: 2026-11-04  
Ámbito: Wiki, buscador, perfiles, editor de tier lists, sitemap y páginas estáticas de anime.  
Documento relacionado: [`docs/auditoria/firebase-costes.md`](auditoria/firebase-costes.md), sección 12.

## 1. Qué es el índice

Firestore no permite buscar subcadenas. Para que el buscador no tenga que descargar el catálogo completo, la aplicación usa un índice estático:

- **Archivo versionado:** `public/busqueda/indice.json.gz` (~1,28 MB).
- **Archivo generado en cada build/dev:** `public/busqueda/indice.json` (~5,98 MB, ignorado por Git).
- **Contenido:** 195 animes, 8.351 episodios y 4.935 personajes (última medición).
- **Campos:** título, japonés, romaji, alias, sinopsis/géneros/estudio, descripciones, imágenes, notas y claves de búsqueda.

El índice **no contiene**:

- temporadas,
- disponibilidad de streaming,
- hilos, comentarios, usuarios, chats o notificaciones.

Por eso cambiar una temporada o una plataforma no obliga a refrescarlo.

## 2. Cómo se usa en el build

`prebuild` y `predev` ejecutan:

```bash
node scripts/generar-indice-busqueda.mjs
```

Ese script:

1. Si existe `public/busqueda/indice.json.gz`, lo descomprime y termina.
2. Si no existe, lee Firestore y genera el JSON y el `.gz`.
3. Si el `.gz` tiene más de 7 días, avisa por consola, pero lo usa igual.

Después:

- `generar-sitemap.mjs` reutiliza los animes del índice.
- `generar-paginas-anime.mjs` reutiliza animes, episodios y personajes del índice.
- El cliente descarga `/busqueda/indice.json` y lo cachea en IndexedDB.

## 3. Cuándo ejecutar `npm run index:buscar`

Sí, cuando cambie algo que deba aparecer en la búsqueda o en los artefactos generados:

| Cambio | ¿Refrescar? | Motivo |
|---|---:|---|
| Crear, editar o borrar un anime | **Sí** | Búsqueda, sitemap, página estática y tier lists. |
| Crear, editar o borrar un episodio | **Sí** | Búsqueda de episodios; el título/descripción antigua seguiría en el índice. |
| Crear, editar o borrar un personaje | **Sí** | Búsqueda de personajes, perfiles y tier lists. |
| Cambiar título, alias, japonés o romaji | **Sí** | Es lo que usa el buscador. |
| Cambiar sinopsis, descripción, géneros, estudio, categoría, año o nota | **Sí** | Afecta a resultados y filtros de búsqueda. |
| Cambiar portada, banner, miniatura o imagen | **Sí** | Las tarjetas del buscador y el editor de tier lists usan la URL del índice. |
| Añadir un anime nuevo | **Sí, antes de desplegar** | Sin refrescar no entra en sitemap ni se genera su página estática. |
| Cambiar una temporada | No | No está en el índice; la ficha lee Firestore. |
| Cambiar disponibilidad de streaming | No | La ficha y el panel leen Firestore. |
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

- lee Firestore una vez (195 animes + 8.351 episodios + 4.935 personajes ≈ 13.481 documentos),
- actualiza `public/busqueda/indice.json`,
- actualiza `public/busqueda/indice.json.gz`.

Después:

```bash
git add public/busqueda/indice.json.gz
git commit -m "Actualiza el indice de busqueda"
git push origin main
```

No se commitea `public/busqueda/indice.json`: está ignorado. Solo el `.gz`.

## 5. Qué pasa si no lo refrescas

- La ficha normal, el panel y las páginas que leen Firestore **sí** pueden mostrar el cambio, tras su TTL de 5–30 minutos.
- El buscador, el sitemap y las páginas estáticas seguirán usando el índice anterior.
- Un anime nuevo puede funcionar en la Wiki por Firestore, pero no aparecerá en el sitemap ni tendrá página estática hasta el refresco.
- Un anime/episodio/personaje borrado puede seguir saliendo en el buscador hasta el refresco.
- Si el `.gz` supera los 7 días, el build avisa; no lo regenera automáticamente.

## 6. Caché del navegador

El cliente guarda el índice en IndexedDB con la clave `search:index:v1` durante **1 hora**. Después de desplegar un índice nuevo:

- un navegador que ya había buscado puede seguir usando la copia anterior hasta 1 hora;
- para verlo antes, hay que borrar los datos del sitio o la entrada de IndexedDB `geekapoo-public-firestore-cache`.

Si se quiere invalidación inmediata en cada despliegue, habría que incluir el SHA del build en la clave de caché. No está hecho para no acumular copias de ~6 MB en IndexedDB.

## 7. Coste

| Operación | Lecturas |
|---|---:|
| `npm run index:buscar` (refresco manual) | ≈13.481 |
| Push normal con índice cacheado | ≈214 (207 streaming + 7 plataformas) |
| Push normal antes de cachear el índice | ≈14.469 |

El refresco manual se hace solo cuando cambia el catálogo. Los pushes de código o documentación no leen el catálogo.

## 8. Archivos implicados

| Archivo | Papel |
|---|---|
| `scripts/generar-indice-busqueda.mjs` | Genera el JSON y el `.gz`; usa el cache si existe. |
| `public/busqueda/indice.json.gz` | Índice comprimido versionado. |
| `public/busqueda/indice.json` | Índice descomprimido para el build/dev; ignorado por Git. |
| `src/services/searchIndex.ts` | Lo descarga y lo cachea en el navegador. |
| `scripts/generar-sitemap.mjs` | Reutiliza los animes del índice. |
| `scripts/generar-paginas-anime.mjs` | Reutiliza animes, episodios y personajes del índice. |
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
indice-busqueda: usa cache local (...)
sitemap: reutiliza el indice de busqueda
streaming ES: 207 filas disponibles
```

## 10. Automatización futura

Opciones si no quieres acordarte del refresco manual:

1. **GitHub Action programada** que ejecute `npm run index:buscar` y commitee el `.gz` una vez al día o a la semana.
2. **Cloud Function** que mantenga el índice en Firestore/Storage al editar animes, episodios o personajes. Sería instantáneo, pero añade escrituras y mantenimiento.
3. **Aviso en el panel** recordando refrescar el índice después de cambios de catálogo.

La opción 1 es la más sencilla para mantener el coste bajo: el build normal sigue en ~214 lecturas y el refresco ocurre una vez por periodo, no en cada push.

## 11. Checklist rápido

- [ ] ¿He cambiado un anime, episodio o personaje? → `npm run index:buscar`.
- [ ] ¿He añadido un anime? → refrescar antes de desplegar para sitemap y página estática.
- [ ] ¿Solo he cambiado temporadas, streaming, foro o código? → no hace falta.
- [ ] ¿He commiteado `public/busqueda/indice.json.gz`? → comprobar antes del push.
- [ ] ¿El build dice `usa cache local`? → correcto.
- [ ] ¿El buscador sigue viendo lo antiguo? → esperar 1 h o borrar la caché del sitio.
