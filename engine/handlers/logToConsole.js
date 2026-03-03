export default async function logToConsole({ taskId, name, config }) {
  const timestamp = new Date().toISOString();
  const message = config.message || '(no message)';
  const log = `[${timestamp}] [${taskId}] ${name}: ${message}`;
  console.log(log);
  return { status: 'ok', log, timestamp };
}
