<template>
  <header class="header">
    <span class="span">
      <span>—</span>
      <span>O</span>
      <span>x</span>
    </span>
  </header>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3.0 + Vite" />
  <mark>npm-run-all -p main serve</mark>
  <button @click="openWin">open new window</button>
</template>

<script>
  import HelloWorld from "./components/HelloWorld.vue";

  export default {
    name: "App",
    components: {
      HelloWorld,
    },
    mounted(){
      // const { BrowserWindow } = require("electron")
    },
    methods: {
      openWin() {
        const { BrowserWindow } = require("electron").remote;
        const win = new BrowserWindow({
          height: 600,
          width: 800,
        });
        win.setMenu(null);
        win.loadURL("https://baidu.com");
      },
    },
  };
</script>
<style scoped>
  .header {
    -webkit-user-select: none;
    -webkit-app-region: drag;
    height: 30px;
    background-color: #e8e8e8;
  }
</style>