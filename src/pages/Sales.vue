<template>
  <div class="container">
    <div class="width">
      <!-- Таблица данных -->
      <div class="tabl">
        <h1>Продажи</h1>

        <!-- Фильтры -->
        <div class="filters">
          <label class="filters__label" for="warehouse">Склад:</label>
          <input
            v-model="filters.warehouse"
            id="warehouse"
            placeholder="Введите склад"
            class="filters__input"
          />

          <label class="filters__label" for="country">Страна:</label>
          <input
            v-model="filters.country"
            id="country"
            placeholder="Введите страну"
            class="filters__input"
          />

          <button @click="applyFilters" class="filters__button">
            Применить фильтры
          </button>
        </div>
        <!-- Сообщения о загрузке и ошибках -->
        <div v-if="loading" class="loading">Загрузка данных...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Номер продажи</th>
                <th>Дата</th>
                <th>Дата изменения</th>
                <th>Размер</th>
                <th>Сумма</th>
                <th>Скидка (%)</th>
                <th>Склад</th>
                <th>Страна</th>
                <th>Округ</th>
                <th>Регион</th>
                <th>К оплате</th>
                <th>Финишная цена</th>
                <th>Цена со скидкой</th>
                <th>Товар</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in paginatedSales"
                :key="item.sale_id || item.odid + index"
              >
                <td>{{ item.g_number }}</td>
                <td>{{ item.date }}</td>
                <td>{{ item.last_change_date }}</td>
                <td>{{ item.tech_size }}</td>
                <td>{{ item.total_price }}</td>
                <td>{{ item.discount_percent }}</td>
                <td>{{ item.warehouse_name }}</td>
                <td>{{ item.country_name }}</td>
                <td>{{ item.oblast_okrug_name }}</td>
                <td>{{ item.region_name }}</td>
                <td>{{ item.for_pay }}</td>
                <td>{{ item.finished_price }}</td>
                <td>{{ item.price_with_disc }}</td>
                <td>{{ item.subject }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div v-if="totalPages > 1" class="pagination">
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
            v-for="page in pagesToShow"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'pagination__button',
              { 'pagination__button--active': page === currentPage },
            ]"
          >
            {{ page }}
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
        v-if="!loading && !error && filteredSales.length"
        class="chart-wrapper"
      >
        <LineChart :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { getSales } from "../api/wbApi";

// Chart.js
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Line } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);
const LineChart = Line;

// Состояния
const loading = ref(true);
const error = ref(null);
const sales = ref([]);
const filteredSales = ref([]);

// Фильтры
const filters = ref({
  warehouse: "",
  country: "",
});

// Пагинация
const currentPage = ref(1);
const itemsPerPage = 10;

// Данные для графика
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: "Количество продаж",
      data: [],
      borderColor: "rgb(75, 192, 192)",
      fill: false,
      tension: 0.1,
    },
  ],
});

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: true, position: "top" } },
};

// Обновление графика
function updateChart() {
  if (!Array.isArray(filteredSales.value)) return;

  const counts = {};
  filteredSales.value.forEach((item) => {
    const date = item.date?.split("T")[0] || "Неизвестно";
    counts[date] = (counts[date] || 0) + 1;
  });

  chartData.value.labels = Object.keys(counts).sort();
  chartData.value.datasets[0].data = Object.values(counts);
}

// Загрузка данных
onMounted(async () => {
  try {
    const response = await getSales({
      dateFrom: "2025-10-01",
      dateTo: "2025-10-17",
    });

    // Проверяем — массив ли пришел
    sales.value = Array.isArray(response) ? response : response.data || [];
    filteredSales.value = [...sales.value];
    updateChart();
  } catch (e) {
    console.error(e);
    error.value = "Ошибка при загрузке данных";
  } finally {
    loading.value = false;
  }
});

// Применить фильтры
function applyFilters() {
  filteredSales.value = sales.value.filter((item) => {
    const warehouseMatch =
      !filters.value.warehouse ||
      item.warehouse_name
        ?.toLowerCase()
        .includes(filters.value.warehouse.toLowerCase());
    const countryMatch =
      !filters.value.country ||
      item.country_name
        ?.toLowerCase()
        .includes(filters.value.country.toLowerCase());
    return warehouseMatch && countryMatch;
  });

  currentPage.value = 1;
  updateChart();
}

// --- Пагинация ---
const totalPages = computed(() =>
  Math.ceil(filteredSales.value.length / itemsPerPage)
);

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredSales.value.slice(start, start + itemsPerPage);
});

const pagesToShow = computed(() => {
  const range = 1;
  const pages = [];
  let start = currentPage.value - range;
  let end = currentPage.value + range;

  if (start < 1) start = 1;
  if (end > totalPages.value) end = totalPages.value;

  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

function goToPage(page) {
  if (page < 1) page = totalPages.value;
  if (page > totalPages.value) page = 1;
  currentPage.value = page;
}
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
  padding: 5px 7px;
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
