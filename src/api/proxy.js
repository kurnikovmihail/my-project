import axios from 'axios';

const API_BASE = 'http://109.73.206.144:6969/api';
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie';

export default async function handler(req, res) {
  try {
    // Проброс query параметров от фронтенда
    const params = new URLSearchParams(req.query);
    params.append('key', API_KEY);

    const url = `${API_BASE}${req.url.replace(/^\/api\/proxy/, '')}?${params.toString()}`;
    const response = await axios.get(url);

    res.status(200).json(response.data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Proxy error' });
  }
}
