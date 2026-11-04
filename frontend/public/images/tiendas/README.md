# Imágenes para el banner de tiendas

Coloca aquí las imágenes aprobadas para los perfiles de tienda. Cada perfil tiene un espacio
para cuando la tienda está abierta y otro para cuando está cerrada. Se recomienda usar imágenes
de 1200 × 750 px en WebP, optimizadas para web y con permiso de uso.

Rutas previstas (una imagen para cada estado):

| Tienda | Archivo sugerido | Campo en `frontend/lib/stores.ts` |
|---|---|---|
| El Mesón | `el-meson-abierta.webp`, `el-meson-cerrada.webp` | `openImage`, `closedImage` |
| El Asa'o | `el-asao-abierta.webp`, `el-asao-cerrada.webp` | `openImage`, `closedImage` |
| Punto Fit | `punto-fit-abierta.webp`, `punto-fit-cerrada.webp` | `openImage`, `closedImage` |
| Alegría | `alegria-abierta.webp`, `alegria-cerrada.webp` | `openImage`, `closedImage` |
| Antojos | `antojos-abierta.webp`, `antojos-cerrada.webp` | `openImage`, `closedImage` |

En `frontend/lib/stores.ts`, asigna cada ruta, por ejemplo:
`openImage: "/images/tiendas/el-meson-abierta.webp"`.
Mientras el campo esté en `null`, el perfil muestra el espacio reservado para esa imagen.
