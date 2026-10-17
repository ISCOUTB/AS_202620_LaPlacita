// Cola de escrituras por clave (tienda, pedido): garantiza que las escrituras
// de UN pedido se persistan en el orden en que se mutó, aunque el pool de
// conexiones solape consultas.
//
// Defecto que motiva este módulo (auditoría de deriva del cierre S10, D2):
// la versión anterior lanzaba cada UPSERT inmediatamente y solo reasignaba
// `ultimaEscritura` — tres mutaciones seguidas (crear → confirmarPago →
// asignarPin) corren en paralelo y la fila puede quedar con el estado de la
// primera escritura en terminar, no de la última mutación.
//
// La prueba `tests/cola-escrituras.test.js` reproduce la reordenación con
// una escritura lenta y una rápida sobre la misma clave: sin la cola, la
// rápida termina primero y el estado final es el viejo.
//
// Claves distintas corren en paralelo (no se bloquean entre sí): la cola es
// POR pedido, no global.
//
// Robustez: un fallo en un eslabón NO rompe la cadena — el siguiente trabajo
// de la clave corre igual (lo demostró la propia prueba), mientras el error
// sigue siendo observable por quien encoló (la promesa devuelta rechaza).

export function crearColaEscrituras() {
  const colas = new Map();

  return {
    /**
     * Encadena `trabajo()` a la promesa anterior de la clave. Devuelve la
     * promesa de ESTA tarea (puede rechazar: quien encola observa el error);
     * la cadena interna continúa aunque esta tarea falle.
     */
    encolar(clave, trabajo) {
      const anterior = colas.get(clave) ?? Promise.resolve();
      const tarea = anterior.then(() => trabajo());
      // La cadena continúa aunque esta tarea falle: el siguiente trabajo de
      // la clave corre igual (el error queda para quien observe `tarea`).
      colas.set(clave, tarea.catch(() => {}));
      return tarea;
    },

    /**
     * Libera la entrada de la clave si la última tarea sigue siendo `tarea`
     * (la cola vacía no acumula). Si se encadenó un trabajo posterior, la
     * entrada se conserva para ese trabajo.
     */
    liberar(clave, tarea) {
      if (colas.get(clave) === tarea) {
        colas.delete(clave);
      }
    },
  };
}
