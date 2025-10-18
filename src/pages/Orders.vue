<template>
  <div class="container">
    <div class="width">
      <!-- Таблица-->
      <div class="tabl">
        <h1>Заказы</h1>

        <!-- Фильтры -->
        <div class="filters">
          <label class="filters__label" for="warehouse">Склад:</label>
          <input
            v-model="filters.warehouse"
            id="warehouse"
            placeholder="Введите склад"
            class="filters__input"
          />
          <label class="filters__label" for="oblast">Область:</label>
          <input
            v-model="filters.oblast"
            id="oblast"
            placeholder="Введите область"
            class="filters__input"
          />
          <button @click="applyFilters" class="filters__button">
            Применить фильтры
          </button>
        </div>

        <!-- Таблица данных -->
        <div>
          <div v-if="loading" class="loading">Загрузка данных...</div>
          <div v-else-if="error" class="error">{{ error }}</div>

          <div v-else class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Номер заказа</th>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Скидка (%)</th>
                  <th>Склад</th>
                  <th>Область</th>
                  <th>Товар</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in paginatedOrders"
                  :key="(item.odid || index) + '-' + index"
                >
                  <td>{{ item.g_number }}</td>
                  <td>{{ item.date }}</td>
                  <td>{{ item.total_price }}</td>
                  <td>{{ item.discount_percent }}</td>
                  <td>{{ item.warehouse_name }}</td>
                  <td>{{ item.oblast }}</td>
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
      </div>
      <!-- График -->
      <div
        v-if="!loading && !error && filteredOrders.length"
        class="chart-wrapper"
      >
        <BarChart :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { getOrders } from "../api/wbApi";

// Chart.js и vue-chartjs
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Bar } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);
const BarChart = Bar;

// фильтры
const filters = ref({ warehouse: "", oblast: "" });

// данные
const orders = ref([]);
const filteredOrders = ref([]);
const loading = ref(true);
const error = ref(null);

// график
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: "Количество заказов по складам",
      data: [],
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
    },
  ],
});
const chartOptions = {
  responsive: true,
  plugins: { legend: { display: true, position: "top" } },
};

// пагинация
const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredOrders.value.length / itemsPerPage))
);
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
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredOrders.value.slice(start, end);
});

// обновляем график по складам
function updateChart() {
  const counts = {};
  filteredOrders.value.forEach((item) => {
    const w = item.warehouse_name || "Не указан";
    counts[w] = (counts[w] || 0) + 1;
  });
  const labels = Object.keys(counts);
  chartData.value.labels = labels;
  chartData.value.datasets[0].data = labels.map((l) => counts[l]);
}

// загрузка данных
onMounted(async () => {
  try {
    const response = await getOrders({
      dateFrom: "2025-10-01",
      dateTo: "2025-10-17",
      page: 1,
      limit: 100,
    });
    orders.value = Array.isArray(response.data)
      ? response.data
      : response.data?.data ?? [];
    filteredOrders.value = orders.value.slice();
    currentPage.value = 1;
    updateChart();
  } catch (e) {
    console.error(e);
    error.value = "Ошибка при загрузке данных";
  } finally {
    loading.value = false;
  }
});

const applyFilters = () => {
  filteredOrders.value = orders.value.filter((item) => {
    const warehouseMatch =
      !filters.value.warehouse ||
      (item.warehouse_name || "")
        .toLowerCase()
        .includes(filters.value.warehouse.toLowerCase());
    const oblastMatch =
      !filters.value.oblast ||
      (item.oblast || "")
        .toLowerCase()
        .includes(filters.value.oblast.toLowerCase());
    return warehouseMatch && oblastMatch;
  });
  currentPage.value = 1;
  updateChart();
};

function goToPage(page) {
  if (page < 1) page = 1;
  if (page > totalPages.value) page = totalPages.value;
  currentPage.value = page;
}
</script>

<style scoped>
.tabl {
  width: 50%;
}
.chart-wrapper {
  width: 50%;
}
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Arial, sans-serif;
  color: #333;
  padding: 20px;
}
.width {
  max-width: 1920px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Arial, sans-serif;
  color: #333;
  gap: 2%
  ;
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
  overflow-x: visible;
}

.data-table {
  width: 90%;
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
