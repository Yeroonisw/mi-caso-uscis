
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 10000;
const dirname = path.dirname(fileURLToPath(import.meta.url));
const apiBase = process.env.USCIS_API_BASE || 'https://api-int.uscis.gov';
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const clientId = process.env.USCIS_CLIENT_ID;
  const clientSecret = process.env.USCIS_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Faltan las credenciales de USCIS en Render.');

  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret });
  const response = await fetch(`${apiBase}/oauth/accesstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data?.error_description || 'USCIS no pudo autorizar la consulta.');
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in || 1800) - 60) * 1000;
  return cachedToken;
}

app.get('/api/health', (_request, response) => response.json({ ok: true, mode: apiBase.includes('api-int') ? 'sandbox' : 'production' }));

app.get('/api/case-status/:receipt', async (request, response) => {
  const receipt = request.params.receipt.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z]{3}[0-9]{10}$/.test(receipt)) return response.status(400).json({ error: 'El nÃºmero de recibo no es vÃ¡lido.' });
  try {
    const token = await getAccessToken();
    const uscisResponse = await fetch(`${apiBase}/case-status/${receipt}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await uscisResponse.json();
    if (!uscisResponse.ok) return response.status(uscisResponse.status).json({ error: data?.errors?.[0]?.message || 'USCIS no pudo encontrar el caso.' });
    return response.json(data);
  } catch (error) {
    return response.status(502).json({ error: error.message || 'No se pudo conectar con USCIS.' });
  }
});

app.use(express.static(path.join(dirname, 'dist')));
app.use((_request, response) => response.sendFile(path.join(dirname, 'dist', 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`Mi Caso USCIS disponible en el puerto ${port}`));
