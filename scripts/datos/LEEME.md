# Los datos del catálogo

Cada anime del catálogo es un grupo de ficheros en esta carpeta, con el
prefijo como nombre: `chb-meta.mjs`, `chb-t1.mjs`, `chb-personajes.mjs`,
`chb-tags.mjs`... El prefijo es corto (`chb`) y no tiene que coincidir con
el id de Firestore, que es el slug del título (`love-chunibyo-and-other-delusions`).

Los cargan `scripts/crear-anime.mjs` (la ficha) y `scripts/cargar-anime.mjs`
(temporadas, capítulos y reparto), y los comprueba
`scripts/comprobar-datos.mjs` antes de nada.

## `-meta.mjs`: la ficha de la serie

| Export | Qué es |
| :--- | :--- |
| `ANIME` | Título, título japonés, sinopsis, año, estado, estudio, categorías y géneros. |
| `ANIME_ID` | El slug de la serie. Tiene que ser el del título normalizado. |
| `ALIASES` | **Los otros nombres por los que se busca la obra.** Ver abajo. |
| `RATING_SERIE` | La nota de la serie (IMDb). |
| `EPISODIOS_TOTAL` | Cuántos capítulos tiene la serie en total. |
| `STREAMING` | Dónde se emite en España. |
| `TEMPORADAS` | Una por temporada, con su sinopsis y su año. |

## `ALIASES`: los títulos alternativos

**Generar los alias es parte de añadir un anime, no un extra.** Una obra
tiene varios nombres y la gente busca con el que conoce: "Ataque a los
Titanes", "Attack on Titan", "Shingeki no Kyojin" son la misma serie. Si
la ficha solo guarda el título principal, quien busca por cualquiera de
los otros no encuentra nada.

```js
export const ALIASES = [
  'Attack on Titan',
  'Shingeki no Kyojin',
];
```

Los escribe **a mano** quien añade el anime, con lo que sabe de esa obra.
No hay ninguna API detrás: ni AniList, ni un proveedor de metadatos, ni
una clave que rotar. Los datos de cada anime se escriben una vez y se
quedan.

Van al campo `alternativeTitles` del documento de Firestore, que es
justo lo que la búsqueda inteligente ya lee (`src/utils/busqueda.ts`): el
alias exacto puntúa por debajo del título principal y por encima del
título japonés, y las erratas se siguen tolerando.

### Reglas

- **Solo títulos de ESTA obra.** Nada que pertenezca a otra serie:
  "Fullmetal Alchemist" a secas es la serie de 2003, no *Brotherhood*;
  "Naruto Shippuden" y "Boruto" son otras obras.
- **Los que la gente usa de verdad**, no variaciones inventadas. Es
  preferible guardar dos alias correctos que cinco dudosos.
- **Sin repetir el título principal ni el japonés**: los dos ya se
  guardan aparte (`ANIME.titulo` y `ANIME.japaneseTitle`) y el buscador
  los encuentra igual.
- **Sin repetirse entre ellos.** El buscador normaliza (minúsculas, sin
  tildes, sin puntuación, y unifica la romanización), así que
  "Hunter x Hunter" y "HUNTER×HUNTER" son el mismo texto: sobra el
  segundo. Lo comprueba `comprobar-datos.mjs`.
- **Un anime puede no tener ninguno.** Si no se conoce ningún otro
  nombre, se deja la lista vacía con un comentario explicando por qué
  (es el caso de *Naruto*: "Shippuden" y "Boruto" son otras series).
  Las fichas sin alias siguen encontrándose por su título principal.

### Comprobarlo

- `node scripts/comprobar-datos.mjs <prefijo>`: avisa de alias vacíos,
  rotos, repetidos o que repiten el título principal o el japonés.
- `npx tsx tests/logica.alias-datos.ts`: comprueba, sin red y contra la
  lógica real del buscador, que cada alias encuentra **su** ficha y solo
  la suya, que un alias no puede ser el nombre de otra obra y que las
  fichas sin alias siguen encontrándose.
