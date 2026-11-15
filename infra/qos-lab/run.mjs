import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = join(ROOT, 'infra', 'qos-lab');
const command = process.argv[2] ?? 'ejecutar';
const stamp = new Date().toISOString().replaceAll(':', '').replaceAll('-', '').replace(/\.\d{3}Z$/, 'Z');
const output = resolve(process.env.QOS_OUTPUT_DIR ?? join(ROOT, 'docs', 'evidencias', 'mediciones', `qos-lab-${stamp}`));
const container = { network: 'laplacita-qos-net', db: 'laplacita-qos-postgres', app: 'laplacita-qos-backend', client: 'laplacita-qos-client' };
const image = { base: 'laplacita-qos-backend:base', app: 'laplacita-qos-backend:test', client: 'laplacita-qos-client:test' };
const limit = {
  clientCpu: process.env.QOS_CLIENT_CPUS ?? '1', clientMem: process.env.QOS_CLIENT_MEMORY ?? '768m',
  appCpu: process.env.QOS_APP_CPUS ?? '2', appMem: process.env.QOS_APP_MEMORY ?? '2g',
  dbCpu: process.env.QOS_DB_CPUS ?? '1', dbMem: process.env.QOS_DB_MEMORY ?? '1g',
  appPort: process.env.QOS_APP_PORT ?? '3105', cooldown: Number(process.env.QOS_COOLDOWN_SECONDS ?? 10),
  failureAfter: Number(process.env.QOS_FAILURE_AFTER_SECONDS ?? 2), outageSeconds: Number(process.env.QOS_DB_OUTAGE_SECONDS ?? 3),
};

const dbName = 'laplacita_qos';
const dbUser = 'laplacita_qos';
const dbPassword = randomBytes(24).toString('hex');
const jwtSecret = randomBytes(48).toString('base64url');
const loadEmail = `qos.${stamp}@utb.edu.co`;
const loadPassword = randomBytes(24).toString('base64url');
const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${container.db}:5432/${dbName}`;
const cpuInfo = cpus();
const hostHardware = `${cpuInfo[0]?.model ?? 'CPU no identificada'}; ${cpuInfo.length} núcleos lógicos; ${(totalmem() / (1024 ** 3)).toFixed(1)} GiB RAM detectada por Node`;
let statsTimer;
let statsFile;
let failedProfiles = 0;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    if (statsTimer) clearInterval(statsTimer);
    cleanResources();
    process.exit(128 + (signal === 'SIGINT' ? 2 : 15));
  });
}

function podman(args, options = {}) {
  const result = spawnSync('podman', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error) return { ok: false, code: -1, stdout: '', stderr: result.error.message };
  return { ok: result.status === 0, code: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function checked(args, label) {
  const result = podman(args, { stdio: 'inherit' });
  if (!result.ok) throw new Error(`${label} falló (código ${result.code}).`);
}

function capture(args) {
  const result = podman(args);
  return result.ok ? result.stdout.trim() : '';
}

function gitCapture(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return result.status === 0 ? (result.stdout ?? '').trim() : '';
}

function cleanResources() {
  for (const item of [container.client, container.app, container.db]) podman(['rm', '-f', item]);
  podman(['network', 'rm', container.network]);
}

function prerequisites() {
  const version = podman(['--version']);
  if (!version.ok) throw new Error('Podman no está instalado o no responde. Instala Podman e inicia su máquina. Este equipo tampoco tiene Docker disponible.');
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Se requiere Node.js 22 o posterior.');
  if (!existsSync(join(ROOT, 'backend', 'node_modules', 'pg', 'package.json'))) throw new Error('No se encontró backend/node_modules/pg. Ejecuta npm ci en backend/.');
  return version.stdout.trim();
}

function writeProtocol(podmanVersion) {
  const lines = [
    'LaPlacita · protocolo reproducible de rendimiento y QoS',
    `Fecha UTC: ${new Date().toISOString()}`,
    `Commit: ${gitCapture(['rev-parse', 'HEAD']) || 'desconocido'}`,
    `Rama: ${gitCapture(['branch', '--show-current']) || 'desconocida'}`,
    `Host: ${process.platform}; arquitectura ${process.arch}; ${hostHardware}; Node ${process.version}; ${podmanVersion}`,
    'Aislamiento: red privada Podman; PostgreSQL 18.6 sin volumen persistente; backend construido desde el commit indicado.',
    `Topes: generador ${limit.clientCpu} CPU/${limit.clientMem}; backend ${limit.appCpu} CPU/${limit.appMem}; PostgreSQL ${limit.dbCpu} CPU/${limit.dbMem}.`,
    `Calentamiento: 20 lecturas por proceso; pausa entre perfiles ${limit.cooldown} s.`,
    'La cuenta y la base son desechables. No se contacta Dokploy ni la base del equipo.',
    `Imagen PostgreSQL solicitada: postgres:18.6-alpine; digest observado: ${capture(['image', 'inspect', '--format', '{{.Digest}}', 'docker.io/library/postgres:18.6-alpine']) || 'pendiente de descarga'}.`,
    '',
  ];
  writeFileSync(join(output, 'protocolo.txt'), lines.join('\n'), 'utf8');
  process.stdout.write(`${lines.join('\n')}\n`);
}

async function sleep(ms) {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForContainer(name, check, seconds, description) {
  for (let i = 0; i < seconds; i += 1) {
    if (podman(['exec', name, ...check]).ok) return;
    await sleep(1000);
  }
  throw new Error(`${description} no respondió en ${seconds} segundos.`);
}

function startResourceSampling() {
  statsFile = join(output, 'recursos.csv');
  writeFileSync(statsFile, 'fecha_utc;contenedor;cpu_pct;memoria_uso_limite;red_io\n', 'utf8');
  statsTimer = setInterval(() => {
    const stats = podman(['stats', '--no-stream', '--format', '{{.Name}};{{.CPUPerc}};{{.MemUsage}};{{.NetIO}}', container.client, container.app, container.db]);
    if (!stats.ok) return;
    const timestamp = new Date().toISOString();
    for (const row of stats.stdout.trim().split(/\r?\n/)) if (row) appendFileSync(statsFile, `${timestamp};${row}\n`);
  }, 1000);
}

function reportHeader(profile, configuration) {
  return [
    'LaPlacita · laboratorio local de rendimiento/QoS',
    `Perfil: ${profile}`,
    `Fecha UTC: ${new Date().toISOString()}`,
    `Commit medido: ${gitCapture(['rev-parse', 'HEAD']) || 'desconocido'}`,
    `Configuración: ${configuration}`,
    `Host: ${process.platform}; ${process.arch}; ${hostHardware}; Node ${process.version}`,
    `Topes: generador ${limit.clientCpu} CPU/${limit.clientMem}; backend ${limit.appCpu} CPU/${limit.appMem}; PostgreSQL ${limit.dbCpu} CPU/${limit.dbMem}.`,
    'Cliente, backend y base comparten el mismo host; no equivale a una medición de producción.',
    '',
  ].join('\n');
}

function captureToFile(args, filePath) {
  return new Promise((resolveRun, rejectRun) => {
    const fd = openSync(filePath, 'a');
    let fdClosed = false;
    const closeLog = () => {
      if (!fdClosed) {
        closeSync(fd);
        fdClosed = true;
      }
    };
    const child = spawn('podman', args, { cwd: ROOT, stdio: ['ignore', fd, fd] });
    child.once('error', (error) => { closeLog(); rejectRun(error); });
    child.once('close', (code) => { closeLog(); resolveRun(code ?? 1); });
  });
}

async function measure(profile, { phase, count, concurrency, repetitions, retries }) {
  const txt = join(output, `${profile}.txt`);
  const jsonPath = `/tmp/${profile}.json`;
  const json = join(output, `${profile}.json`);
  const args = ['exec', container.client, 'node', '/app/medir-carga.js', '--url', `http://${container.app}:3000`, '--fase', phase,
    '--peticiones', String(count), '--concurrencia', String(concurrency), '--repeticiones', String(repetitions),
    '--reintentos', String(retries), '--salida', jsonPath];
  if (phase === 'escritura') args.push('--tiendas', 'tienda-01,tienda-02,tienda-03,tienda-04,tienda-05', '--bd', '--registrar');
  let netem = '';
  if (profile === 'E-red-degradada') {
    netem = 'delay 50 ms ±10 ms; pérdida 0,5 %; tasa 5 Mbit/s, aplicado a la salida del cliente y backend';
  }
  const notes = netem ? `Perfil de red artificial: ${netem}\nqdisc generador antes:\n${capture(['exec', container.client, 'tc', '-s', 'qdisc', 'show', 'dev', 'eth0'])}\nqdisc backend antes:\n${capture(['exec', '--user', '0', container.app, 'tc', '-s', 'qdisc', 'show', 'dev', 'eth0'])}\n\n` : '';
  writeFileSync(txt, reportHeader(profile, `${phase}; ${count} solicitudes; ${concurrency} clientes; ${repetitions} repeticiones; ${retries}% reintentos`) + notes, 'utf8');
  process.stdout.write(`Ejecutando ${profile}…\n`);
  const status = await captureToFile(args, txt);
  const copied = podman(['cp', `${container.client}:${jsonPath}`, json]);
  appendFileSync(txt, `\nCódigo de salida del medidor: ${status}\n`);
  if (profile === 'E-red-degradada') {
    appendFileSync(txt, `\nqdisc generador posterior:\n${capture(['exec', container.client, 'tc', '-s', 'qdisc', 'show', 'dev', 'eth0'])}\n`);
    appendFileSync(txt, `qdisc backend posterior:\n${capture(['exec', '--user', '0', container.app, 'tc', '-s', 'qdisc', 'show', 'dev', 'eth0'])}\n`);
  }
  if (status !== 0 || !copied.ok) failedProfiles += 1;
  process.stdout.write(readFileSync(txt, 'utf8'));
  await sleep(limit.cooldown * 1000);
}

async function measureDatabaseFailure() {
  const profile = 'C-fallo-recuperacion-bd';
  const txt = join(output, `${profile}.txt`);
  const json = join(output, `${profile}.json`);
  const jsonPath = `/tmp/${profile}.json`;
  const shell = `node /app/medir-carga.js --url http://${container.app}:3000 --fase escritura --peticiones 600 --concurrencia 25 --repeticiones 1 --reintentos 10 --tiendas tienda-01,tienda-02,tienda-03,tienda-04,tienda-05 --bd --salida ${jsonPath} > /tmp/${profile}.raw.txt 2>&1; code=$?; echo $code > /tmp/${profile}.exit`;
  writeFileSync(txt, reportHeader(profile, 'escritura; 600 pedidos; 25 clientes; PostgreSQL interrumpido por unos segundos') + `Caída programada: +${limit.failureAfter} s durante ${limit.outageSeconds} s.\n`, 'utf8');
  const started = podman(['exec', '-d', container.client, 'sh', '-c', shell]);
  if (!started.ok) throw new Error(`No se pudo iniciar el perfil C: ${started.stderr}`);
  await sleep(limit.failureAfter * 1000);
  appendFileSync(txt, `PostgreSQL detenido UTC: ${new Date().toISOString()}\n`);
  podman(['stop', '--time', '0', container.db]);
  await sleep(limit.outageSeconds * 1000);
  appendFileSync(txt, `PostgreSQL iniciado UTC: ${new Date().toISOString()}\n`);
  checked(['start', container.db], 'reinicio de PostgreSQL');
  await waitForContainer(container.db, ['pg_isready', '-U', dbUser, '-d', dbName], 90, 'PostgreSQL recuperado');
  let code = '';
  for (let i = 0; i < 120; i += 1) {
    code = capture(['exec', container.client, 'cat', `/tmp/${profile}.exit`]);
    if (code) break;
    await sleep(1000);
  }
  const raw = capture(['exec', container.client, 'cat', `/tmp/${profile}.raw.txt`]);
  appendFileSync(txt, `\n${raw}\nCódigo de salida del medidor: ${code || 'sin resultado/tiempo agotado'}\n`);
  const copied = podman(['cp', `${container.client}:${jsonPath}`, json]);
  if (code !== '0' || !copied.ok) failedProfiles += 1;
  process.stdout.write(readFileSync(txt, 'utf8'));
}

async function run() {
  const podmanVersion = prerequisites();
  mkdirSync(output, { recursive: true });
  cleanResources();
  writeProtocol(podmanVersion);
  checked(['build', '-t', image.base, join(ROOT, 'backend')], 'construcción del backend');
  checked(['build', '-f', join(LAB, 'Backend.Dockerfile'), '-t', image.app, ROOT], 'preparación de backend para el perfil de red');
  checked(['build', '-f', join(LAB, 'Cliente.Dockerfile'), '-t', image.client, ROOT], 'construcción del generador');
  checked(['network', 'create', container.network], 'creación de red privada');
  checked(['run', '-d', '--name', container.db, '--network', container.network, `--cpus=${limit.dbCpu}`, `--memory=${limit.dbMem}`,
    '-e', `POSTGRES_DB=${dbName}`, '-e', `POSTGRES_USER=${dbUser}`, '-e', `POSTGRES_PASSWORD=${dbPassword}`, 'docker.io/library/postgres:18.6-alpine'], 'inicio PostgreSQL');
  await waitForContainer(container.db, ['pg_isready', '-U', dbUser, '-d', dbName], 90, 'PostgreSQL');
  checked(['run', '-d', '--name', container.app, '--network', container.network, `--cpus=${limit.appCpu}`, `--memory=${limit.appMem}`,
    '--cap-add=NET_ADMIN', '-e', 'NODE_ENV=production', '-e', 'PORT=3000', '-e', 'HOSTNAME=0.0.0.0', '-e', `DATABASE_URL=${databaseUrl}`, '-e', `JWT_SECRET=${jwtSecret}`,
    '-e', 'DOMINIOS_CORREO=utb.edu.co', '-p', `127.0.0.1:${limit.appPort}:3000`, image.app], 'inicio backend');
  await waitForContainer(container.app, ['node', '-e', "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"], 120, 'backend');
  checked(['run', '-d', '--name', container.client, '--network', container.network, `--cpus=${limit.clientCpu}`, `--memory=${limit.clientMem}`,
    '--cap-add=NET_ADMIN', '-e', `DATABASE_URL=${databaseUrl}`, '-e', `JWT_SECRET=${jwtSecret}`, '-e', `CARGA_CORREO=${loadEmail}`,
    '-e', `CARGA_CONTRASENA=${loadPassword}`, image.client], 'inicio generador');
  appendFileSync(join(output, 'protocolo.txt'), `Generador Node: ${capture(['exec', container.client, 'node', '--version'])}\n`);
  appendFileSync(join(output, 'protocolo.txt'), `Imagen backend de prueba: ${capture(['image', 'inspect', '--format', '{{.Digest}}', image.app]) || 'digest no disponible'}\n`);
  appendFileSync(join(output, 'protocolo.txt'), `Imagen PostgreSQL: ${capture(['image', 'inspect', '--format', '{{.Digest}}', 'docker.io/library/postgres:18.6-alpine']) || 'digest no disponible'}\n`);
  startResourceSampling();
  await sleep(10_000);

  await measure('D-lectura-catalogo', { phase: 'lectura', count: 200, concurrency: 10, repetitions: 3, retries: 0 });
  checked(['exec', container.client, 'tc', 'qdisc', 'replace', 'dev', 'eth0', 'root', 'netem', 'delay', '50ms', '10ms', 'distribution', 'normal', 'loss', '0.5%', 'rate', '5mbit'], 'inyección de red en generador');
  checked(['exec', '--user', '0', container.app, 'tc', 'qdisc', 'replace', 'dev', 'eth0', 'root', 'netem', 'delay', '50ms', '10ms', 'distribution', 'normal', 'loss', '0.5%', 'rate', '5mbit'], 'inyección de red en backend');
  await measure('E-red-degradada', { phase: 'lectura', count: 200, concurrency: 10, repetitions: 3, retries: 0 });
  checked(['exec', container.client, 'tc', 'qdisc', 'del', 'dev', 'eth0', 'root'], 'retiro de perfil de red del generador');
  checked(['exec', '--user', '0', container.app, 'tc', 'qdisc', 'del', 'dev', 'eth0', 'root'], 'retiro de perfil de red del backend');
  await measure('A-carga-pedidos', { phase: 'escritura', count: 300, concurrency: 25, repetitions: 5, retries: 10 });
  await measure('B-estres-pedidos', { phase: 'escritura', count: 1000, concurrency: 100, repetitions: 3, retries: 10 });
  await measureDatabaseFailure();
  clearInterval(statsTimer);
  statsTimer = undefined;

  const resourceReport = spawnSync(process.execPath, [join(LAB, 'resumir-recursos.mjs'), join(output, 'recursos.csv')], { encoding: 'utf8' });
  const files = readdirSync(output).sort();
  const summary = [
    'LaPlacita · resumen de rendimiento/QoS',
    `Fecha UTC: ${new Date().toISOString()}`,
    `Commit: ${gitCapture(['rev-parse', 'HEAD']) || 'desconocido'}`,
    `Perfiles con código de medidor no cero o JSON ausente: ${failedProfiles}`,
    'Los códigos del medidor se interpretan junto con los umbrales de cada JSON; no equivalen a aprobación global.',
    'E es una degradación artificial; no representa la red real de Dokploy o la universidad.',
    'No se midió priorización DSCP/clases de servicio: no existe una política diferenciada declarada.',
    'Máximos de CPU y memoria observados:', resourceReport.stdout.trim() || resourceReport.stderr.trim() || 'No se pudo resumir recursos.csv.',
    '', 'Archivos generados:', ...files.map((file) => `- ${file}`), '- resumen.txt', '',
  ].join('\n');
  writeFileSync(join(output, 'resumen.txt'), summary, 'utf8');
  process.stdout.write(summary);
  cleanResources();
  process.exitCode = failedProfiles ? 1 : 0;
}

async function main() {
  if (command === 'limpiar' || command === 'clean') {
    prerequisites();
    cleanResources();
    console.log('Contenedores y red del laboratorio QoS eliminados; los informes se conservaron.');
    return;
  }
  if (command !== 'ejecutar' && command !== 'run') {
    console.error('Uso: node infra/qos-lab/run.mjs {ejecutar|limpiar}');
    process.exitCode = 2;
    return;
  }
  try {
    await run();
  } catch (error) {
    if (statsTimer) clearInterval(statsTimer);
    if (existsSync(output)) writeFileSync(join(output, 'ejecucion-incompleta.txt'), `La ejecución no completó todos los perfiles.\nFecha UTC: ${new Date().toISOString()}\nDetalle: ${error.stack ?? error.message}\n`, 'utf8');
    cleanResources();
    console.error(`Laboratorio detenido: ${error.message}`);
    process.exitCode = 2;
  }
}

await main();
