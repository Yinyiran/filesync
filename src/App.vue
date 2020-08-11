<template>
  <ul>
    <li>最近同步的文件</li>
    <li>所占空间大小</li>
    <li>设置同步的文件夹</li>
    <li>本地文件管理 https://ourcodeworld.com/articles/read/106/how-to-choose-read-save-delete-or-create-a-file-with-electron-framework</li>
  </ul>
  <button @click="setSyncDir">选择同步的文件夹</button>
  <ul class="file-list">
    <li class="file-item" v-for="(item,index) in files" :key="index">{{item.Name}}</li>
  </ul>
</template>

<script>
  const { BrowserWindow, dialog } = require("electron").remote;
  const Fs = require("fs");
  const Path = require("path");
  const process = require("process");

  export default {
    name: "App",
    data() {
      return {
        files: [],
      };
    },
    mounted() {
      let syncPath = localStorage.getItem("sync_dir_path");
      console.log(syncPath);
      file.watch
    },
    methods: {
      setSyncDir() {
        // 选择文件
        let res = dialog.showOpenDialogSync({ properties: ["openDirectory"] });
        if (res) {
          localStorage.setItem("sync_dir_path", res[0]);
          res.forEach((dirPath) => {
            let infos = Fs.readdirSync(res[0]);
            this.files = infos.map((item) => {
              let res = Fs.statSync(Path.join(dirPath, item));
              if (res) {
                res.isFile = res.isFile();
                res.isDir = res.isDirectory();
                res.Name = item;
              }
              return res;
            });
          });
        }
      },
    },
  };
</script>
<style lang="less">
  .file-list {
    padding: 0;
    margin: 0;
    .file-item {
      list-style: none;
    }
  }
</style>