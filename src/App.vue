<template>
  <ul class="header">
    <li class="header-item">
      <button @click="setSyncDir">选择同步的文件夹</button>
    </li>
    <li class="header-item">111</li>
  </ul>
  <div class="breadcrumb">
    <span class="back-icon iconfont icon-arrowup" :class="{disable:crumbs.length==1}"></span>
    <span
      class="crumb-item"
      v-for="(cru,index) in crumbs"
      :key="index"
      @click="crumbclick(index,cru)"
    >
      <span class="crumb-name">{{cru.dirName}}</span>
      <span v-show="index<crumbs.length-1">></span>
    </span>
  </div>
  <div class="file-list">
    <div
      class="file-item"
      :class="{'dir-item':item.isDir,'file-item':item.isFile}"
      v-for="(item,index) in files"
      :key="index"
    >
      <div class="file-content" @dblclick="fileClick(item)">
        <img class="file-icon" v-if="item.fileIcon" :src="item.fileIcon" alt />
        <span class="file-name">{{item.fileName}}</span>
      </div>
    </div>
  </div>
  <div class="empty-tip" v-if="files.length===0">此文件夹为空</div>

  <ul>
    <li>1.切换样式</li>
    <li>2.面包屑</li>
    <li>3.垃圾箱</li>
    <li>4.文件属性：文件大小，创建日期，最近修改日期</li>
    <li>5.历史版本</li>
    <li>6.顶部搜索</li>
    <li>7.操作：删除，恢复</li>
  </ul>
</template>

<script>
  const { BrowserWindow, dialog } = require("electron").remote;
  const Fs = require("fs");
  const Path = require("path");
  const process = require("process");
  const Icon = ["xlsx", "gif", "jpg", "pdf", "png", "ppt", "txt", "word", "zip"];
  export default {
    name: "App",
    data() {
      return {
        files: [],
        crumbs: [],
      };
    },
    mounted() {
      let syncPath = localStorage.getItem("sync_dir_path");
      if (syncPath) {
        this.crumbs.push({
          dirName: syncPath.slice(syncPath.lastIndexOf("\\") + 1),
          dirPath: syncPath,
        });
        this.getDirAndFile(syncPath);
        Fs.watch(syncPath, { recursive: true }, (eventType, filename) => {
          console.log(`事件类型是: ${eventType}`);
          if (filename) {
            console.log(`提供的文件名: ${filename}`);
          } else {
            console.log("文件名未提供");
          }
        });
      }
    },
    methods: {
      fileClick(item) {
        if (item.isDir) {
          let path = Path.join(item.Path, item.fileName);
          this.getDirAndFile(path);
          this.crumbs.push({
            dirName: item.fileName,
            dirPath: path,
          });
        } else {
        }
      },
      crumbclick(index, cru) {
        this.getDirAndFile(cru.dirPath);
        this.crumbs.splice(index + 1, this.crumbs.length);
        // this.
      },
      setSyncDir() {
        // 选择文件
        let res = dialog.showOpenDialogSync({ properties: ["openDirectory"] });
        if (res) {
          localStorage.setItem("sync_dir_path", res[0]);
          this.getDirAndFile(res[0]);
        }
      },
      getDirAndFile(dirPath) {
        let infos = Fs.readdirSync(dirPath);
        this.files = infos.map((name) => {
          let res = Fs.statSync(Path.join(dirPath, name));
          if (res) {
            res.isFile = res.isFile();
            res.Path = dirPath;
            res.isDir = res.isDirectory();
            res.fileName = name;
            if (res.isFile) {
              res.extName = name.slice(name.lastIndexOf(".") + 1);
              if (Icon.includes(res.extName)) {
                res.fileIcon = `./src/assets/${res.extName.toUpperCase()}.svg`;
              }
            } else {
              res.fileIcon = `./src/assets/DIR.svg`;
            }
          }
          return res;
        });
        console.log(this.files);
      },
    },
  };
</script>
<style lang="less">
  .header {
    padding: 10px 15px;
    height: 24px;
    line-height: 24px;
    border: 1px solid #e8e8e8;
    display: flex;
    .header-item {
      margin-right: 10px;
    }
  }
  .breadcrumb {
    padding: 5px 15px;
    border-bottom: 1px solid #e8e8e8;
    .back-icon {
      vertical-align: top;
      cursor: pointer;
      font-size: 18px;
      padding: 10px 0;
      margin-right: 10px;
      &:hover {
        color: blue;
      }
    }
    .crumb-item {
      vertical-align: top;
      cursor: pointer;
      &:hover {
        font-weight: bold;
      }
    }
    .crumb-name {
      margin: 0 6px;
    }
  }
  .file-list {
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    .file-item {
      text-align: center;
      margin: 0 2px;
      cursor: pointer;
    }
    .file-content {
      padding: 10px 5px;
      &:hover {
        background-color: #f0f0f0;
      }
    }
    .file-icon {
      width: 34px;
    }
    .file-name {
      width: 65px;
      font-size: 12px;
      word-break: break-all;
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
    }
  }
  .empty-tip {
    text-align: center;
    padding: 30px;
    color: #888;
  }
</style>