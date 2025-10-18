<template>
  <div class="container">
    <div class="width">
      <!-- Таблица данных -->
      <div class="tabl">
        <h1>Акции</h1>

        <!-- Фильтры -->
        <div class="filters">
          <label class="filters__label" for="warehouse">Склад:</label>
          <input
            v-model="filters.warehouse"
            id="warehouse"
            placeholder="Введите склад"
            class="filters__input"
          />
          <button @click="applyFilters" class="filters__button">
            Применить фильтр
          </button>
        </div>

        <!-- Сообщение о загрузке / ошибка -->
        <div v-if="loading" class="loading">Загрузка данных...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Дата изменения</th>
                <th>Артикул поставщика</th>
                <th>Размер</th>
                <th>Штрихкод</th>
                <th>Количество</th>
                <th>Поставка</th>
                <th>Реализация</th>
                <th>Общее количество</th>
                <th>Склад</th>
                <th>В пути к клиенту</th>
                <th>В пути от клиента</th>
                <th>ID товара</th>
                <th>Товар</th>
                <th>Категория</th>
                <th>Бренд</th>
                <th>SC код</th>
                <th>Цена</th>
                <th>Скидка</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in paginatedStocks"
                :key="item.nm_id + '-' + (item.barcode ?? '')"
              >
                <td>{{ item.date }}</td>
                <td>{{ item.last_change_date }}</td>
                <td>{{ item.supplier_article }}</td>
                <td>{{ item.tech_size }}</td>
                <td>{{ item.barcode }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.is_supply }}</td>
                <td>{{ item.is_realization }}</td>
                <td>{{ item.quantity_full }}</td>
                <td>{{ item.warehouse_name }}</td>
                <td>{{ item.in_way_to_client }}</td>
                <td>{{ item.in_way_from_client }}</td>
                <td>{{ item.nm_id }}</td>
                <td>{{ item.subject }}</td>
                <td>{{ item.category }}</td>
                <td>{{ item.brand }}</td>
                <td>{{ item.sc_code }}</td>
                <td>{{ item.price }}</td>
                <td>{{ item.discount }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div v-if="!loading && !error && totalPages > 1" class="pagination">
          <button
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="pagination__button"
          >
            1
          </button>
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination__button"
          >
            &lt;
          </button>

          <button
            v-for="p in pagesToShow"
            :key="p"
            @click="goToPage(p)"
            :class="[
              'pagination__button',
              { 'pagination__button--active': p === currentPage },
            ]"
          >
            {{ p }}
          </button>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination__button"
          >
            &gt;
          </button>
          <button
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="pagination__button"
          >
            {{ totalPages }}
          </button>
        </div>
      </div>
      <!-- График -->
      <div
        v-if="!loading && !error && filteredStocks.length"
        class="chart-wrapper"
      >
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { getStocks } from "../api/wbApi";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Bar } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

// состояние фильтра/данных/ошибок
const filters = ref({ warehouse: "" });
const stocks = ref([]); // исходный массив
const filteredStocks = ref([]); // отфильтрованный
const loading = ref(true);
const error = ref(null);

// --- пагинация ---
const currentPage = ref(1);
const itemsPerPage = 10; // можно менять
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredStocks.value.length / itemsPerPage))
);

// показываем соседние страницы (range = 1: одна слева/справа)
const pagesToShow = computed(() => {
  const range = 1;
  let start = currentPage.value - range;
  let end = currentPage.value + range;
  if (start < 1) start = 1;
  if (end > totalPages.value) end = totalPages.value;
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
});

const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredStocks.value.slice(start, start + itemsPerPage);
});

function goToPage(page) {
  if (!page || isNaN(page)) return;
  if (page < 1) page = 1;
  if (page > totalPages.value) page = totalPages.value;
  currentPage.value = page;
}

// --- график ---
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: "Количество товара на складе",
      data: [],
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
    },
  ],
});
const chartOptions = {
  responsive: true,
  scales: { y: { beginAtZero: true } },
};

const updateChartData = () => {
  // используем filteredStocks
  const labels = filteredStocks.value.map(
    (it) => it.subject ?? it.nm_id ?? "unknown"
  );
  const data = filteredStocks.value.map((it) => Number(it.quantity) || 0);
  chartData.value.labels = labels;
  chartData.value.datasets[0].data = data;
};

// --- загрузка данных ---
onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    const response = await getStocks({
      dateFrom: formattedDate,
      page: 1,
      limit: 100,
    });

    const dataArray = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
      ? response.data
      : [];

    stocks.value = dataArray;
    filteredStocks.value = stocks.value.slice();
    currentPage.value = 1;
    updateChartData();
  } catch (e) {
    console.error(e);
    const serverMsg =
      e?.response?.data || e?.message || "Ошибка при загрузке данных";
    error.value =
      typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg);
  } finally {
    loading.value = false;
  }
});

// --- фильтр ---
const applyFilters = () => {
  filteredStocks.value = stocks.value.filter((item) => {
    return (
      !filters.value.warehouse ||
      (item.warehouse_name || "")
        .toLowerCase()
        .includes(filters.value.warehouse.toLowerCase())
    );
  });
  currentPage.value = 1;
  updateChartData();
};
</script>

<style scoped>
.tabl {
  width: 49%;
}
.chart-wrapper {
  width: 49%;
}
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Arial, sans-serif;
  color: #333;
}
.width {
  max-width: 1800px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Arial, sans-serif;
  color: #333;
  gap: 2%;
  padding: 20px;
}
.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #2d3748;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filters__label {
  font-weight: bold;
  color: #e53e3e;
}

.filters__input {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

.filters__input:focus {
  border-color: #3182ce;
  box-shadow: 0 0 3px rgba(49, 130, 206, 0.5);
}

.filters__button {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  background-color: #3182ce;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}

.filters__button:hover {
  background-color: #2c5282;
}

.chart-wrapper {
  margin-bottom: 20px;
  max-width: 800px;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #f7fafc;
  border-radius: 6px;
  overflow: hidden;
}

.data-table thead tr {
  background-color: #edf2f7;
}

.data-table th,
.data-table td {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  text-align: left;
}

.data-table tbody tr:hover {
  background-color: #e2e8f0;
}

.loading {
  font-style: italic;
  color: #718096;
}

.error {
  color: #e53e3e;
}

.pagination {
  margin-top: 20px;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination__button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #3182ce;
  color: #fff;
  cursor: pointer;
}

.pagination__button:hover:not(:disabled) {
  background-color: #2c5282;
}

.pagination__button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.pagination__button--active {
  background-color: #63b3ed;
  font-weight: bold;
  color: #1a202c;
}
</style>
