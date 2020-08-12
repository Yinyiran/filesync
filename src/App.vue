<template>
  <div class="main">
    <ul class="header">
      <span
        class="iconfont icon-jiantou"
        :class="{disable:crumbs.length==1}"
        title="返回到上一级文件夹"
        @click="backdir"
      ></span>
      <div class="crumb-wrap" title="文件路径">
        <span
          class="crumb-item"
          v-for="(cru,index) in crumbs"
          :key="index"
          @click="crumbclick(index,cru)"
        >
          <span class="crumb-name">{{cru.dirName}}</span>
          <span v-show="index<crumbs.length-1" class="iconfont icon-right"></span>
        </span>
      </div>
      <!-- <li class="headbtn iconfont icon-ziyuan" title="搜索文件"></li> -->
      <li class="headbtn iconfont icon-shezhi" @click="setSyncDir" title="设置需要同步的文件夹"></li>
      <!-- <li class="headbtn iconfont icon-lajixiang" title="垃圾箱，查看已经删除的文件"></li> -->
      <span
        class="headbtn iconfont icon-liebiao"
        v-if="listType === 'list'"
        title="使用缩略图展示（当前为列表展示）"
        @click="setListType('thumb')"
      ></span>
      <span
        class="headbtn iconfont icon-fangkuai"
        v-else
        title="使用列表展示（当前为缩略图展示）"
        @click="setListType('list')"
      ></span>
    </ul>
    <!-- 缩略图 -->
    <div class="file-thumb" v-if="files.length && listType == 'thumb'">
      <div class="file-item" v-for="(item,index) in files" :key="index" :title="item.title">
        <div class="file-content" @dblclick="fileClick(item)">
          <img class="file-icon" :src="item.fileIcon" />
          <span class="file-name">{{item.fileName}}</span>
        </div>
      </div>
    </div>
    <!-- 列表 -->
    <div class="file-list" v-if="files.length && listType=='list'">
      <div class="list-header">
        <span class="cell name">名称</span>
        <span class="cell size">大小</span>
        <span class="cell modify">上次修改日期</span>
      </div>
      <div class="list-wrap">
        <div
          class="list-item"
          v-for="(item,index) in files"
          :key="index"
          @dblclick="fileClick(item)"
        >
          <span class="cell name">
            <img class="file-icon" :src="item.fileIcon" />
            <span class="file-name" :title="item.fileName">{{item.fileName}}</span>
          </span>
          <span class="cell size">{{item.fileSize}}</span>
          <span class="cell modify">{{item.modifyTime}}</span>
        </div>
      </div>
    </div>
    <div class="empty-tip" v-if="files.length===0">此文件夹为空</div>
    <!-- <ul>
      <li>1.切换样式</li>
      <li>3.垃圾箱</li>
      <li>4.文件属性：文件大小，创建日期，最近修改日期</li>
      <li>5.历史版本</li>
      <li>7.操作：删除，恢复</li>
    </ul>-->
  </div>
</template>

<script>
  const chokidar = require("chokidar");
  const { BrowserWindow, dialog } = require("electron").remote;
  const Fs = require("fs");
  const Path = require("path");
  const process = require("process");
  import { FileIcon } from "./Enum";
  import Service from "./service";
  export default {
    name: "App",
    data() {
      return {
        files: [],
        crumbs: [],
        listType: "",
      };
    },
    mounted() {
      this.listType = localStorage.getItem("sync_dir_list") || "thumb";
      let syncPath = localStorage.getItem("sync_dir_path");
      if (syncPath) {
        this.crumbs.push({
          dirName: syncPath.slice(syncPath.lastIndexOf("\\") + 1),
          dirPath: syncPath,
        });
        this.getDirAndFile(syncPath);

        var watcher = chokidar.watch(syncPath, {
          ignored: /[\/\\]\./,
          persistent: true,
        });
        var log = console.log.bind(console);

        watcher.on("add", function (path) {
          log("File", path, "has been added");
        });
        watcher.on("addDir", function (path) {
          log("Directory", path, "has been added");
        });
        watcher.on("change", function (path) {
          log("File", path, "has been changed");
        });
        watcher.on("unlink", function (path) {
          log("File", path, "has been removed");
        });
        watcher.on("unlinkDir", function (path) {
          log("Directory", path, "has been removed");
        });
        watcher.on("error", function (error) {
          log("Error happened", error);
        });
        watcher.on("ready", function () {
          log("Initial scan complete. Ready for changes.");
        });
      }
    },
    methods: {
      backdir() {
        if (this.crumbs.length == 1) return;
        let crumbObj = this.crumbs[this.crumbs.length - 2];
        this.crumbs.splice(-1);
        this.getDirAndFile(crumbObj.dirPath);
      },
      setListType(type) {
        localStorage.setItem("sync_dir_list", type);
        this.listType = type;
      },
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
        if (index === this.crumbs.length - 1) return;
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
        Fs.readdir(dirPath, (err, infos) => {
          if (err)
            return dialog.showMessageBox({
              type: "error",
              title: "出错啦！",
              message: `同步的文件找不到了，请选择新的文件夹！ \n${err}`,
            });
          let dirArr = [];
          let fileArr = [];
          infos.forEach((name) => {
            let res = Fs.statSync(Path.join(dirPath, name));
            if (res) {
              res.isFile = res.isFile();
              res.isDir = res.isDirectory();
              res.Path = dirPath;
              res.fileName = name;
              res.modifyTime = Service.DateFormat(res.mtime);
              // 文件夹
              if (res.isDir) {
                res.fileIcon = `./src/assets/img/DIR.svg`;
                dirArr.push(res);
                res.title = `名称：${name}\n 修改日期：${res.modifyTime}`;
              } else if (res.isFile) {
                // 文件
                res.fileSize = Service.FileSize(res.size);
                res.extName = name.slice(name.lastIndexOf(".") + 1);
                let extObj = FileIcon.find((item) =>
                  item.data.includes(res.extName)
                );
                res.title = `名称：${name}\n大小：${res.fileSize}\n修改日期：${res.modifyTime}`;
                if (extObj) {
                  res.fileIcon = `./src/assets/img/${extObj.type}.svg`;
                  fileArr.push(res);
                }
              }
            }
          });
          this.files = [].concat(dirArr, fileArr);
          // console.log(this.files);
        });
      },
    },
  };
</script>

<style lang="less">
  @import url("./assets/less/color.less");
  .main {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
  }
  .header {
    padding: 8px 15px;
    line-height: 30px;
    height: 30px;
    border: 1px solid #e8e8e8;
    display: flex;
    .icon-jiantou {
      cursor: pointer;
      font-size: 16px;
      margin-right: 8px;
      &:hover {
        color: @color-active;
      }
      &.disable {
        color: #c0c4cc;
        cursor: not-allowed;
      }
    }
    .crumb-wrap {
      flex: 1;
      font-size: 14px;
      border: 1px solid #e8e8e8;
      padding: 0 4px;
      border-radius: 4px;
      line-height: 28px;
      display: flex;
      overflow: hidden;
      .crumb-item {
        cursor: pointer;
        &:hover {
          background-color: #f0f0f0;
        }
      }
      .crumb-name {
        vertical-align: top;
        padding: 0 4px;
        display: inline-block;
        height: 100%;
      }
      .icon-right {
        font-size: 12px;
        padding-right: 2px;
        vertical-align: top;
        display: inline-block;
        height: 100%;
        color: #c1c1c1;
      }
    }
    .header-item {
      margin-left: 10px;
    }
    .headbtn {
      margin-left: 10px;
      font-size: 18px;
      color: #555;
      cursor: pointer;
      &:hover {
        color: @color-active;
      }
    }
  }
  .file-thumb {
    padding: 10px;
    flex: 1;
    display: flex;
    align-content: flex-start;
    flex-wrap: wrap;
    overflow: auto;
    .file-item {
      text-align: center;
      margin: 0 2px;
      cursor: pointer;
      .file-content {
        padding: 10px 4px;
        transition: all 0.1s;
        &:hover {
          background-color: #f0f0f0;
        }
      }
      .file-icon {
        width: 34px;
        height: 34px;
      }
      .file-name {
        width: 65px;
        font-size: 12px;
        word-break: break-all;
        display: -webkit-box;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }
    }
  }
  .file-list {
    flex: 1;
    height: 0;
    display: flex;
    flex-direction: column;
    .list-header {
      display: flex;
      font-size: 15px;
      padding: 4px 0;
      border-bottom: 1px solid #e8e8e8;
    }
    .list-wrap {
      flex: 1;
      overflow: overlay;
    }
    .cell {
      padding: 4px 10px;
    }
    .name {
      flex: 1;
      vertical-align: top;
      padding-left: 24px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .size {
      text-align: center;
      width: 50px;
      font-size: 12px;
    }
    .modify {
      width: 140px;
      font-size: 12px;
    }
    .list-item {
      cursor: pointer;
      display: flex;
      padding: 5px 0;
      border-bottom: 1px solid #f1f1f1;
      transition: all 0.1s;
      &:hover {
        background-color: #f1f1f1;
      }
      .file-icon {
        width: 16px;
        height: 16px;
        margin-right: 10px;
        vertical-align: middle;
      }
      .file-name {
        font-size: 14px;
        vertical-align: middle;
      }
    }
  }
  .empty-tip {
    text-align: center;
    padding: 50px 0;
    color: #999;
    flex: 1;
  }
</style>