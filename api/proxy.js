import axios from "axios";

const API_BASE = "http://109.73.206.144:6969/api";
const API_KEY = "E6kUTYrYwZq2tN4QEtyzsbEBk3ie";

export default async function handler(req, res) {
  try {
    const { endpoint, ...query } = req.query; // endpoint + остальные параметры
    if (!endpoint) {
      return res.status(400).json({ error: "Missing endpoint" });
    }

    // Добавляем ключ
    query.key = API_KEY;

    // Строим URL
    const url = `${API_BASE}/${endpoint}`;
    const response = await axios.get(url, { params: query });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Proxy failed" });
  }
}
