#!/usr/bin/env bash
# Laboratorio local de seguridad (S14) — PostgreSQL en Podman + backend/PWA en Next.
# Uso: ./infra/lab/lab.sh {preparar|arrancar|parar|estado|reset|logs|pruebas|pentesting}
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB="$RAIZ/infra/lab"
LOGS="$LAB/.logs"
ENVFILE="$LAB/.env.local"
CONTENEDOR="laplacita-lab-pg"
VOLUMEN="laplacita-lab-pgdata"

cargar_env() {
  if [ ! -f "$ENVFILE" ]; then
    echo "Falta $ENVFILE. Ejecuta: $0 preparar"
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  . "$ENVFILE"
  set +a
}

preparar() {
  mkdir -p "$LOGS" "$LAB/pruebas"
  if [ -f "$ENVFILE" ] && [ "${1:-}" != "--forzar" ]; then
    echo "$ENVFILE ya existe (usa --forzar para regenerarlo)"
    return 0
  fi
  node -e '
    const c = require("crypto");
    const r = () => c.randomBytes(18).toString("base64url");
    const pg = r(), jwt = c.randomBytes(48).toString("base64url"), adm = r(), cli = r();
    const lineas = [
      "# Laboratorio local de seguridad — generado automáticamente. NO versionar.",
      "POSTGRES_DB=laplacita",
      "POSTGRES_USER=laplacita",
      `POSTGRES_PASSWORD=${pg}`,
      `DATABASE_URL=postgres://laplacita:${pg}@127.0.0.1:5433/laplacita`,
      `JWT_SECRET=${jwt}`,
      "DOMINIOS_CORREO=lab.test",
      `CUENTAS_TIENDA="tienda-01|admin|admin.meson@lab.test|${adm}|Admin Meson;tienda-01|trabajador|caja.meson@lab.test|${adm}|Caja Meson;tienda-02|admin|admin.asa@lab.test|${adm}|Admin Asao"`,
      "ADMINS_GENERALES=superadmin@lab.test",
      "LAB_ADMIN_EMAIL=superadmin@lab.test",
      `LAB_ADMIN_PASSWORD=${adm}`,
      "LAB_CLIENTE_EMAIL=cliente.lab@lab.test",
      `LAB_CLIENTE_PASSWORD=${cli}`,
      "LAB_TIENDA01_EMAIL=admin.meson@lab.test",
      `LAB_TIENDA01_PASSWORD=${adm}`,
      "LAB_TIENDA02_EMAIL=admin.asa@lab.test",
      `LAB_TIENDA02_PASSWORD=${adm}`,
      "PORT_BACKEND=3100",
      "PORT_FRONTEND=3200",
      "BACKEND_URL=http://127.0.0.1:3100",
      "LAB_BACKEND=http://127.0.0.1:3100",
      "LAB_FRONTEND=http://127.0.0.1:3200",
    ];
    require("fs").writeFileSync(process.argv[1], lineas.join("\n") + "\n", { mode: 0o600 });
  ' "$ENVFILE"
  echo "Secretos de laboratorio generados en $ENVFILE"
}

pg_arrancar() {
  cargar_env
  if podman container exists "$CONTENEDOR" >/dev/null 2>&1; then
    podman start "$CONTENEDOR" >/dev/null 2>&1 || true
  else
    podman run -d --name "$CONTENEDOR" \
      -e POSTGRES_DB="$POSTGRES_DB" \
      -e POSTGRES_USER="$POSTGRES_USER" \
      -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
      -p 127.0.0.1:5433:5432 \
      -v "$VOLUMEN":/var/lib/postgresql/data \
      docker.io/library/postgres:16 >/dev/null
  fi
  for _ in $(seq 1 60); do
    if podman exec "$CONTENEDOR" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      echo "PostgreSQL listo en 127.0.0.1:5433"
      return 0
    fi
    sleep 0.5
  done
  echo "PostgreSQL no respondió. Revisa: podman logs $CONTENEDOR"
  return 1
}

pg_parar() {
  if podman container exists "$CONTENEDOR" >/dev/null 2>&1; then
    podman stop "$CONTENEDOR" >/dev/null 2>&1 || true
  fi
}

app_arrancar() {
  local nombre="$1" dir="$2" puerto="$3"
  local pidfile="$LOGS/$nombre.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "$nombre ya corre (pid $(cat "$pidfile"))"
    return 0
  fi
  mkdir -p "$LOGS"
  (
    cd "$RAIZ/$dir"
    NEXT_TELEMETRY_DISABLED=1 nohup npm run dev -- -p "$puerto" \
      >"$LOGS/$nombre.log" 2>&1 </dev/null &
    echo $! >"$pidfile"
  )
  echo "$nombre arrancando en :$puerto (log $LOGS/$nombre.log)"
}

app_parar() {
  local nombre="$1" puerto="$2"
  local pidfile="$LOGS/$nombre.pid"
  if [ -f "$pidfile" ]; then
    kill "$(cat "$pidfile")" 2>/dev/null || true
    rm -f "$pidfile"
  fi
  pkill -f "next dev.*-p $puerto" 2>/dev/null || true
  echo "$nombre detenido"
}

esperar_http() {
  local url="$1" nombre="$2"
  for _ in $(seq 1 120); do
    if curl -fsS -o /dev/null --max-time 2 "$url"; then
      echo "$nombre responde"
      return 0
    fi
    sleep 1
  done
  echo "$nombre no respondió. Revisa $LOGS/$nombre.log"
  return 1
}

arrancar() {
  cargar_env
  pg_arrancar
  app_arrancar backend backend "$PORT_BACKEND"
  esperar_http "$LAB_BACKEND/api/v1/health" "backend"
  app_arrancar frontend frontend "$PORT_FRONTEND"
  esperar_http "$LAB_FRONTEND/api/version" "frontend"
  echo "Laboratorio listo: backend $LAB_BACKEND · PWA $LAB_FRONTEND"
}

parar() {
  cargar_env
  app_parar frontend "$PORT_FRONTEND"
  app_parar backend "$PORT_BACKEND"
  pg_parar
  echo "Laboratorio detenido (los datos siguen en el volumen $VOLUMEN)"
}

estado() {
  cargar_env
  echo "── PostgreSQL"
  podman ps --filter "name=$CONTENEDOR" --format '{{.Names}}  {{.Status}}  {{.Ports}}' || true
  echo "── procesos"
  for nombre in backend frontend; do
    local pidfile="$LOGS/$nombre.pid"
    if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
      echo "$nombre  corriendo (pid $(cat "$pidfile"))"
    else
      echo "$nombre  detenido"
    fi
  done
  echo "── HTTP"
  curl -sS -o /dev/null -w "backend  %{http_code}  %{time_total}s\n" --max-time 4 "$LAB_BACKEND/api/v1/health" || true
  curl -sS -o /dev/null -w "frontend %{http_code}  %{time_total}s\n" --max-time 4 "$LAB_FRONTEND/" || true
}

reiniciar() {
  parar
  arrancar
}

reset() {
  parar
  podman rm -f "$CONTENEDOR" >/dev/null 2>&1 || true
  podman volume rm -f "$VOLUMEN" >/dev/null 2>&1 || true
  echo "Base de datos del laboratorio borrada"
  arrancar
}

logs() {
  local nombre="${1:-backend}"
  tail -n 80 "$LOGS/$nombre.log"
}

pruebas() {
  arrancar
  node "$LAB/pruebas/seguridad-http.mjs"
}

pentesting() {
  arrancar
  node "$LAB/pruebas/pentesting.mjs"
}

case "${1:-}" in
  preparar) preparar "${2:-}" ;;
  arrancar|start) arrancar ;;
  parar|stop) parar ;;
  estado|status) estado ;;
  reiniciar|restart) reiniciar ;;
  reset) reset ;;
  logs) logs "${2:-backend}" ;;
  pruebas|test) pruebas ;;
  pentesting|pentest) pentesting ;;
  *) echo "Uso: $0 {preparar|arrancar|parar|estado|reiniciar|reset|logs [backend|frontend]|pruebas|pentesting}" ; exit 1 ;;
esac
