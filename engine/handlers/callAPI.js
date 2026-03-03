export default async function callAPI({ config }) {
  const { url, method = 'GET', headers = {}, body } = config;
  if (!url) throw new Error('CallAPI: missing "url" in documentation config');

  const options = { method, headers };
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (!headers['Content-Type']) options.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let responseBody;
  try {
    responseBody = JSON.parse(text);
  } catch {
    responseBody = text;
  }

  return {
    status: response.status,
    statusText: response.statusText,
    body: responseBody,
  };
}
