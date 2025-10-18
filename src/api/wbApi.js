import axios from 'axios';

const API_BASE = 'http://109.73.206.144:6969/api';
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie';

const fetchData = async (endpoint, params = {}) => {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.append('key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.append(k, v);
  });
  const response = await axios.get(url.toString());
  return response.data;
};

export const getIncomes = (params) => axios.get('/api/proxy/incomes', { params }).then(r => r.data);
export const getOrders = (params) => axios.get('/api/proxy/orders', { params }).then(r => r.data);
export const getSales = (params) => axios.get('/api/proxy/sales', { params }).then(r => r.data);
export const getStocks = (params) => axios.get('/api/proxy/stocks', { params }).then(r => r.data);
