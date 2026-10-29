// El emparejamiento por titulo, con la comprobacion de posicion.
//
// ── POR QUE EL TITULO NO BASTA ──────────────────────────────────────
//
// El emparejado se hace por titulo japones, que es el dato mas fiable
// que hay. Pero el titulo solo, por si mismo, mete imagenes en el
// capitulo equivocado cuando en la serie de TVDB hay capitulos con el
// mismo titulo en sitios distintos, y hay dos formas de que pase:
//
//   · La serie tiene capitulos especiales. En Toradora hay cuatro
//     capitulos en la temporada 0 que no son de la serie, y hay un
//     capitulo suelto con un titulo parecido. Si un titulo aparece dos
//     veces y se coge el primero, un capitulo de T1 puede recibir la
//     imagen de un corto.
//
//   · Una serie partida en partes con la misma lista en TVDB. En Ataque
//     a los Titanes, TVDB repite los veinticinco capitulos de la primera
//     parte en todas las demas. Ahi el titulo es el mismo y la imagen es
//     la del primer capitulo de otra parte.
//
// Por eso, despues de encontrar el titulo, se comprueba que la
// temporada y el numero de TVDB sean los que tocaban. Y hay tres
// respuestas posibles:
//
//   · Esta donde toca: se usa.
//
//   · Hay varios con el mismo titulo y ninguno donde toca: no se pone
//     nada. No hay forma de saber cual es el bueno.
//
//   · Hay uno solo con ese titulo, pero en OTRA TEMPORADA, y nuestra
//     temporada si existe en TVDB: no se pone nada. Esto es lo que
//     detiene el caso de Ataque a los Titanes.
//
// ── EL CASO QUE SI SE ACEPTA ────────────────────────────────────────
//
// Nuestra temporada no existe en TVDB pero el titulo es tan especifico
// que solo puede ser de ese capitulo. Es el caso de la OVA de Toradora:
// el catalogo la tiene como temporada 2 y TVDB la tiene como un capitulo
// suelto de la temporada 0. Esa diferencia la dice `temporadas-tvdb.mjs`.
//
// ── POR QUE ES UN FICHERO APARTE ────────────────────────────────────
//
// Porque `revisar-titulos.mjs` necesita la misma comparacion de titulos,
// y duplicar la normalizacion en dos sitios es como se desincronizan.

import { limpiar, mismoTitulo } from './normalizar-titulo.mjs';
import { capituloEnTvdb, SIN_COMPROBAR_NUMERO, tituloEnTvdb } from './temporadas-tvdb.mjs';

/**
 * El capitulo de TVDB que corresponde a un capitulo del catalogo.
 *
 * @param {object} params
 * @param {string} params.animeId    id del anime, para saber el mapeo de temporadas
 * @param {object} params.nuestro    capitulo del catalogo, con `temporada`, `numero` y `japones`
 * @param {Array}  params.capitulos  los capitulos de TVDB de la serie
 * @param {Set}    params.usadas     URLs de imagen ya usadas en el catalogo
 * @returns {{url: string, ep: object, aviso?: string}|null}
 */
export function capituloDe({ animeId, nuestro, capitulos, usadas }) {
  // Los capitulos con numero decimal —el 0.5 de Mushoku, el 15.5 de su
  // primera temporada— no tienen temporada propia: van intercalados en la
  // serie. TVDB los mete en el cajon de la temporada 0, que es donde
  // acaba cualquier capitulo que no pertenece a una temporada concreta.
  //
  // Sin esto, `Number(e.number) === numero` compara 15 con 15.5 y no
  // cuadra, y el capitulo se queda sin imagen aunque este.
  const numero = Number(nuestro.numero);

  const esIntercalado = numero % 1 !== 0;

  // Hay series en las que TVDB numera los capitulos de otra manera y el
  // numero no sirve para emparejar. En Saekano la numeracion oficial
  // empieza en cero, con lo que cada capitulo del catalogo esta un
  // numero por delante del de TVDB. Ahi se empareja solo por titulo,
  // que es unico dentro de la serie.
  //
  // La lista esta en `temporadas-tvdb.mjs`, con la explicacion de por
  // que no se puede arreglar con un desfase.
  const sinNumero = SIN_COMPROBAR_NUMERO.has(animeId);
  if (!nuestro?.japones) return null;

  if (!limpiar(nuestro.japones)) return null;

  // Puede haber mas de uno: el mismo titulo en dos capitulos distintos no
  // es raro en series con cortos.
  //
  // `tituloEnTvdb` devuelve el titulo traducido en los pocos casos en que
  // TVDB lo escribe con otras palabras (ver `TITULO_TVDB`). La
  // comprobacion de temporada y numero de mas abajo sigue siendo la
  // misma: lo unico que cambia es el texto que se busca.
  const alias = tituloEnTvdb(animeId, nuestro.japones);

  const candidatos = alias
    ? capitulos.filter((e) => limpiar(e.name) === alias)
    : capitulos.filter((e) => mismoTitulo(e.name, nuestro.japones));

  if (!candidatos.length) return null;

  // Que temporada y que numero buscamos en TVDB.
  //
  // No siempre es la misma temporada con el mismo numero: hay series en
  // las que una temporada del catalogo es un trozo de una de TVDB. El
  // mapa esta en `temporadas-tvdb.mjs`, con la explicacion.
  const destino = capituloEnTvdb(animeId, Number(nuestro.temporada), numero);

  const temporada = destino.temporada;

  // Que numero se busca dentro de esa temporada.
  const numeroBuscado = esIntercalado ? numero : destino.numero;

  // ── LA TEMPORADA 0 DE TVDB NO ES UNA TEMPORADA ────────────────────
  //
  // Es el cajon donde TVDB mete los capitulos que no pertenecen a la
  // serie: los cortos, las OVAs, losIndexerivals. El numero que hay ahi
  // no es el numero del capitulo, es el orden en que los metieron, y
  // puede haber cuatro capitulos con el mismo numero en la misma
  // temporada. En Toradora, el season 0 tiene los cuatro "S.O.S" y la
  // OVA, y el OVA es el numero 5.
  //
  // Por eso, si lo que buscamos esta en el season 0, no se mira el
  // numero: se coge el capitulo con ese titulo, siempre que sea el
  // unico. Un titulo de OVA o de corto es lo bastante especifico para
  // que no pueda estar en dos capitulos de la misma serie.
  const enSeasonCajon = temporada === 0;

  const bienColocado =
    sinNumero || enSeasonCajon
      ? candidatos[0]
      : candidatos.find(
          (e) =>
              Number(e.seasonNumber) === temporada && Number(e.number) === numeroBuscado,
        );

  if (bienColocado) {
    const url = bienColocado.image || bienColocado.thumbnail;

    if (!url || usadas.has(url)) return null;

    return { url, ep: bienColocado };
  }

  // Varios con el mismo titulo y ninguno donde toca: no hay forma de
  // saber cual es el bueno, y el titulo solo ya ha demostrado que no
  // basta.
  if (candidatos.length > 1) return null;

  // Uno solo con ese titulo, pero en OTRA temporada.
  //
  // Si nuestra temporada existe en TVDB y este titulo no esta entre sus
  // capitulos, la imagen es de otra parte de la historia. Es el caso de
  // Ataque a los Titanes, donde TVDB repite la primera parte entera en
  // todas las demas.
  const existeNuestraTemporada = capitulos.some((e) => Number(e.seasonNumber) === temporada);

  if (existeNuestraTemporada) return null;

  // Nuestra temporada no existe en TVDB y este titulo es el unico que
  // tiene. Puede ser el caso legitimo de la OVA de Toradora, que esta
  // donde toca, y no queda otro camino.
  //
  // Pero solo si la temporada es creible. Si el catalogo tiene cuatro
  // temporadas y se pide una quinta, no es una OVA mal numerada: es una
  // temporada que no existe, y >el titulo unico que aparece en TVDB es
  // de otra parte. Sin este recorte, un numero de temporada equivocado
  // en el propio catalogo pasaria desapercibido.
  const temporadasTvdb = [...new Set(capitulos.map((e) => Number(e.seasonNumber)))].sort(
    (a, b) => a - b,
  );

  const masAlta = Math.max(...temporadasTvdb);

  if (temporada > masAlta) return null;

  const unico = candidatos[0];

  const url = unico.image || unico.thumbnail;

  if (!url || usadas.has(url)) return null;

  return {
    url,
    ep: unico,
    aviso: `TVDB lo tiene en S${unico.seasonNumber}E${unico.number}`,
  };
}