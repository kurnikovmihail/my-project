<template>
  <div id="app">
    <div class="hat">
      <nav>
        <router-link to="/incomes">Доходы</router-link>
        <router-link to="/orders">Заказы</router-link>
        <router-link to="/sales">Продажи</router-link>
        <router-link to="/stocks">Акции</router-link>
      </nav>
    </div>

    <router-view />
    <!-- сюда подгружается текущая страница -->
  </div>
</template>

<script setup>
// Ничего не нужно импортировать, кроме стилей, если надо
</script>

<style scoped>
.hat{
  display: flex;
  justify-content: center;
}
nav {
  padding: 1em;
  max-width: 1920px;
  width: 100%;
  background-color: #f5f5f5;
  margin-bottom: 1em;
}
nav a {
  margin-right: 1em;
  text-decoration: none;
  color: #42b883;
}
nav a.router-link-active {
  font-weight: bold;
  color: #35495e;
}
</style>
