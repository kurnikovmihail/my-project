import express from 'express';
import path from 'path';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors()); // Разрешаем CORS

// API настройки
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie';
const API_BASE = 'http://109.73.206.144:6969/api';

// Прокси для всех запросов
app.get('/api/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  const params = new URLSearchParams({ key: API_KEY, ...req.query }).toString();
  const url = `${API_BASE}/${endpoint}?${params}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data); // Отправляем данные на фронт
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Указываем папку для статических файлов
app.use(express.static(path.join(__dirname, 'dist')));

// Все остальные запросы перенаправляем на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Запуск на порту 8080
app.listen(8080, () => {
  console.log('Proxy server running on port 8080');
});
