<template>
  <div class="container">
    <div class="graf-tabl">
      <!-- Таблица данных -->

      <div class="container-tabl">
        <h1 class="page-title">Доходы</h1>
        <!-- Фильтры -->
        <div class="filters">
          <label class="filters__label" for="warehouse">Склад:</label>
          <input
            v-model="filters.warehouse"
            type="text"
            id="warehouse"
            placeholder="Введите название склада"
            class="filters__input"
          />
          <button @click="applyFilters" class="filters__button">
            Применить фильтры
          </button>
        </div>

        <div v-if="loading" class="loading">Загрузка данных...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID дохода</th>
                <th>Номер</th>
                <th>Дата</th>
                <th>Дата изменения</th>
                <th>Артикул поставщика</th>
                <th>Склад</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in paginatedIncomes"
                :key="item.income_id + '-' + index"
              >
                <td>{{ item.income_id }}</td>
                <td>{{ item.number }}</td>
                <td>{{ item.date }}</td>
                <td>{{ item.last_change_date }}</td>
                <td>{{ item.supplier_article }}</td>
                <td>{{ item.warehouse_name }}</td>
                <td>{{ item.total_price }}</td>
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

      <!-- График по датам -->
      <div v-if="!loading && !error" class="chart-wrapper">
        <LineChart :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { getIncomes } from "../api/wbApi";

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

// Компонент графика
const LineChart = Line;

const filters = ref({
  warehouse: "",
});

const allIncomes = ref([]); // оригинальный массив
const incomes = ref([]); // данные для отображения
const loading = ref(true);
const error = ref(null);

// Данные для графика
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: "Количество доходов",
      data: [],
      fill: false,
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1,
    },
  ],
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "top",
    },
  },
};

// Пагинация
const currentPage = ref(1);
const itemsPerPage = 10;

// Считаем количество страниц
const totalPages = computed(() => {
  return Math.ceil(incomes.value.length / itemsPerPage);
});

// Генерация массива страниц для отображения
const pagesToShow = computed(() => {
  const range = 1; // Показывать по 2 страницы до и после текущей
  const pagesArray = [];
  let start = currentPage.value - range;
  let end = currentPage.value + range;

  // Проверка, чтобы страницы не выходили за границы
  if (start < 1) start = 1;
  if (end > totalPages.value) end = totalPages.value;

  for (let i = start; i <= end; i++) {
    pagesArray.push(i);
  }

  return pagesArray;
});

// Функция для получения отображаемых данных на текущей странице
const paginatedIncomes = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return incomes.value.slice(startIndex, endIndex);
});

// Функция обновления графика
function updateChart() {
  const counts = {};
  incomes.value.forEach((item) => {
    if (!counts[item.date]) counts[item.date] = 0;
    counts[item.date]++;
  });
  chartData.value.labels = Object.keys(counts).sort();
  chartData.value.datasets[0].data = Object.keys(counts)
    .sort()
    .map((date) => counts[date]);
}

// Загружаем данные при монтировании
onMounted(async () => {
  try {
    const response = await getIncomes({
      dateFrom: "2025-10-01",
      dateTo: "2025-10-17",
      page: 1,
      limit: 100,
    });
    allIncomes.value = response.data;
    incomes.value = response.data;
    updateChart();
  } catch (e) {
    error.value = "Ошибка при загрузке данных";
  } finally {
    loading.value = false;
  }
});

// Функция применения фильтров
function applyFilters() {
  incomes.value = allIncomes.value.filter((item) => {
    return (
      !filters.value.warehouse ||
      item.warehouse_name
        .toLowerCase()
        .includes(filters.value.warehouse.toLowerCase())
    );
  });
  updateChart(); // обновляем график после фильтрации
}

// Функция для перехода на страницу
function goToPage(page) {
  if (page < 1 || page > totalPages.value) return; // проверяем границы
  currentPage.value = page;
}
</script>

<style scoped>
.container-tabl {
}
canvas {
  width: 1000px;
  margin-bottom: 0.5%;
}
.graf-tabl {
  display: flex;
  align-items: flex-end;
  gap: 3%;
  justify-content: center;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Arial, sans-serif;
  color: #333;
  padding: 20px;
}
.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
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
}
.chart-wrapper canvas {
  height: 300px;
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
  padding: 5px 12px;
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
