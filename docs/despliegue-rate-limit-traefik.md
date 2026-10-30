# Rate limit por IP con middleware de Traefik (P-1, evidencias-s13 §7.6)

Guía de aplicación para el panel de Dokploy — **amenaza A-17** (credencial
stuffing por IP que A-07 no cubre: hoy el límite de login es por CORREO, y
`POST /pedidos` solo con cuenta). Fecha comprometida: **04/11/2026**, antes de
la medición de carga de S14 (el `medir-carga.js` marcará explícitamente que no
se corre la fase `escritura` sin esta defensa).

**Quién lo aplica:** Mateo (panel). **Qué mide la corrección:** 429 devuelto
por Traefik cuando una IP rebase el tope; **por qué nivel**: 1 (borde), no en
el backend — así el backend sigue intacto y el borde absorbe las peticiones
del abuso.

## 1. Crear los dos middleware (Dokploy, una sola vez)

Dokploy → menú **Traefik** (Settings del servidor) → **File / Advanced**:
agregar el middleware como definición en el sistema de archivos de Traefik
(un "middleware" de tipo `http.middlewares`). Nombres EXACTOS (van a casar con
los dominios):

```yaml
http:
  middlewares:
    laplacita-rate-limit:
      rateLimit:
        average: 5          # 5 peticiones/seg sostenidas por IP
        burst: 25           # ráfaga permitida (recarga positiva de la cubeta)
        sourceCriterion:
          ipStrategy:
            depth: 1        # tomar el primer salto de X-Forwarded-For: tras
                            # 1 proxy (Cloudflare) es la IP real del cliente
    laplacita-max-body:
      buffering:
        maxRequestBodyBytes: 1048576   # 1 MiB: deja subir imágenes de 512 KB
                                       # + overhead del multipart (ESC-02)
```

Notas de afinación (para no romper nada que exista):
- La app real cargaba el catálogo cada 3 s (seguimiento) + panel consultando
  pedidos: `average: 5` por IP deja una app abierta con margen; el burst 25
  absorbe el carrito y los cambios de pantalla.
- El push del PWA no toca endpoints de escritura masivos: el que se protege
  sobre todo es `POST /auth/sesion` (combinación credential stuffing) y
  `POST /pedidos` sin cuenta (pedidos basura). El rate limit de borde es por
  IP: un NAT compartido (aula de la universidad) comparte su IP — es una
  limitación ACEPTADA y declarada (si pasa, subir `average` a 10 en el aula
  de la demo).

## 2. Aplicar a los dominios de los dos servicios

En Dokploy, dominio de **backend** (`laplacita-test.iscoutb.dev`) y de **PWA**
(`laplacita-app.iscoutb.dev`) → la forma de editar el dominio permite agregar
middleware (`Advanced / Middleware`): añadir los dos nombres

```
laplacita-rate-limit@file
laplacita-max-body@file
```

(el sufijo `@file` es el proveedor de Traefik donde viven las definiciones que
se crearon en el paso 1). Aplicar los dos nombres a AMBOS dominios — así el
abuso se detiene en el borde del proxy, no separadamente en cada contenedor.

## 3. Verificación (después de aplicar, ~2 min)

1. **El abuso da 429 de borde** (no JSON del backend):
   ```bash
   for i in $(seq 1 40); do
     curl -s -o /dev/null -w '%{http_code} ' -X POST \
       https://laplacita-test.iscoutb.dev/api/v1/auth/sesion \
       -H 'content-type: application/json' -d '{"correo":"x","contrasena":"x"}'
   done
   ```
   Esperado: una cadena con algunos `200/400/401/429` del backend y 429
   adicionales en la cola del extremo hacia al final (mientras Traefik corta
   la ráfaga). Si aparecen 429 con cuerpo **JSON** `error`, pueden ser del
   PROPIO backend (5 fallos → 429, A-07): la diferencia es el cuerpo —
   el del borde NO trae JSON.
2. **La app sigue viva**: abrir la PWA en el celular, navegar 3 pantallas, y
   el panel carga el menú (o una cuenta de tienda loggeada entra sin 429 en
   el flujo normal).
3. **La subida de imagen sigue funcionando** (para no haber roto ESC-02):
   subir una foto de producto < 512 KB desde el panel → 201.

## 4. Registro al día (cierre del P-1)

- `correcciones.md`: fecha de aplicación, valores usados (`average`, `burst`,
  `maxRequestBodyBytes`), el output del paso 3.1 y la limitación del NAT.
- `evidencias-s13.md` §7: fila A-17 pasa de `🟡 Pendiente (P-1)` a `✅ Mitigada
  (dia/mes)`, y la fila P-1 de §7.6 marca HECHO — punto de partida honesto de
  la medición de carga en S14.
