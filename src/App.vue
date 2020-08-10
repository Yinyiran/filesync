<template>
  <ul>
    <li>最近同步的文件</li>
    <li>所占空间大小</li>
    <li>设置同步的文件夹</li>
    <li>本地文件管理 https://ourcodeworld.com/articles/read/106/how-to-choose-read-save-delete-or-create-a-file-with-electron-framework</li>
  </ul>
</template>

<script>
  const remote = require("electron").remote;
  const Win = remote.getCurrentWindow();

  export default {
    name: "App",
    mounted() {},
    methods: {
      openWin() {
        const win = new remote.BrowserWindow({
          height: 600,
          width: 800,
        });
        win.setMenu(null);
        win.loadURL("https://baidu.com");
      },
      minimize() {
        Win.minimize();
      },
      maximize() {
        if (!Win.isMaximized()) {
          Win.maximize();
        } else {
          Win.unmaximize();
        }
      },
      closeWin() {
        window.close();
      },
    },
  };
</script>
<style lang="less">
</style>