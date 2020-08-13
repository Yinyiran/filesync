<template>
  <div class="main">
    <ul class="header">
      <li
        class="iconfont icon-jiantou"
        :class="{disable:crumbs.length==1}"
        title="返回到上一级文件夹"
        @click="backdir"
      ></li>
      <li class="crumb-wrap" title="文件路径">
        <span
          class="crumb-item"
          v-for="(cru,index) in crumbs"
          :key="index"
          @click="crumbclick(index,cru)"
        >
          <span class="crumb-name">{{cru.dirName}}</span>
          <span v-show="index<crumbs.length-1" class="iconfont icon-right"></span>
        </span>
      </li>
      <!-- <li class="headbtn iconfont icon-ziyuan" title="搜索文件"></li> -->
      <span class="setting iconfont icon-shezhi" @click="showSetting =!showSetting ">
        <ul class="setting-menu" v-show="showSetting">
          <li class="setting-btn" @click="setSyncDir" title="设置需要同步的文件夹">设置同步文件夹</li>
          <li class="setting-btn">垃圾箱</li>
          <li class="setting-btn" v-if="listType !== 'list'" @click="setListType('list')">缩略图显示</li>
          <li class="setting-btn" v-else @click="setListType('thumb')">列表显示</li>
        </ul>
      </span>
      <!-- <li class="headbtn iconfont icon-lajixiang" title="垃圾箱，查看已经删除的文件"></li> -->
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
        <span class="cell operate">操作</span>
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
          <span class="cell operate">
            <span v-if="item.isDelete">恢复</span>
            <span v-else>删除</span>
          </span>
        </div>
      </div>
    </div>
    <div class="empty-tip" v-if="files.length===0">此文件夹为空</div>
    <ul style="padding:20px">
      <li>1.初始：保存文件夹，上传文件（递归），保存本地库（localPath,ID,LifeToken</li>
      <li>2.打开程序：检测所有文件是否都有本地库，没有本地库的文件和文件夹需要保存和上传</li>
      <li>3.打开程序：检测所有线上版本是否有本地库，没有就下载</li>
      <li>4.同时删除本地文件</li>
      <li>5.isDelete的文件检测本地是否有，如果有就删除</li>
      <li>6.记录电脑登录日志，只检测切换电脑期间所作的操作</li>
    </ul>
  </div>
</template>

<script>
  const chokidar = require("chokidar");
  const { BrowserWindow, dialog } = require("electron").remote;
  const Fs = require("fs");
  const Path = require("path");
  const process = require("process");
  import { FileIcon } from "./Enum";
  import { Util, HTTP } from "./service";
  export default {
    name: "App",
    data() {
      return {
        files: [],
        crumbs: [],
        listType: "",
        showSetting: false,
      };
    },
    mounted() {
      HTTP.get("/getFiles").then((res) => {
        console.log(res);
      });
      this.listType = localStorage.getItem("sync_dir_list") || "thumb";
      let syncPath = localStorage.getItem("sync_dir_path");
      if (syncPath) {
        this.crumbs.push({
          dirName: syncPath.slice(syncPath.lastIndexOf("\\") + 1),
          dirPath: syncPath,
        });
        this.getDirAndFile(syncPath);

        // var watcher = chokidar.watch(syncPath, {
        //   ignored: /[\/\\]\./,
        //   persistent: true,
        // });
        // var log = console.log.bind(console);

        // watcher.on("add", function (path) {
        //   log("File", path, "has been added");
        // });
        // watcher.on("addDir", function (path) {
        //   log("Directory", path, "has been added");
        // });
        // watcher.on("change", function (path) {
        //   log("File", path, "has been changed");
        // });
        // watcher.on("unlink", function (path) {
        //   log("File", path, "has been removed");
        // });
        // watcher.on("unlinkDir", function (path) {
        //   log("Directory", path, "has been removed");
        // });
        // watcher.on("error", function (error) {
        //   log("Error happened", error);
        // });
        // watcher.on("ready", function () {
        //   log("Initial scan complete. Ready for changes.");
        // });
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
              res.fileName = name;
              res.modifyTime = Util.DateFormat(res.mtime);
              // 文件夹
              if (res.isDir) {
                res.Path = dirPath;
                res.fileIcon = `./src/assets/img/DIR.svg`;
                res.title = `名称：${name}\n修改日期：${res.modifyTime}`;
                dirArr.push(res);
              } else if (res.isFile) {
                // 文件   只有符合条件的文件才能显示
                res.extName = name.slice(name.lastIndexOf(".") + 1);
                let extObj = FileIcon.find((item) =>
                  item.data.includes(res.extName)
                );
                if (extObj) {
                  res.Path = Path.join(dirPath, name);
                  res.fileSize = Util.FileSize(res.size);
                  res.title = `名称：${name}\n大小：${res.fileSize}\n修改日期：${res.modifyTime}`;
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
      async upload(list) {
        await UtilService.getFileHash(this.localfiles);
        let hashs = this.localfiles.map((item) => item.filehash);
        let { data } = await Data.post("/fileExist", hashs);
        let formData = new FormData();
        let upFile = [];
        this.localfiles.forEach((item, index) => {
          let existpath = data[item.filehash];
          if (existpath) {
            let index = this.imgList.indexOf(item.url);
            if (index > -1) {
              this.imgList.splice(index, 1, existpath);
            } else {
              this.imgList.push(existpath);
            }
          } else {
            // const file = {
            //   uri: url,
            //   name: _.replace(url, /\.[doc,docx,odt,]+$/, ""),
            //   type: "docx",
            // };
            formData.append(`file_${index}`, fs.createReadStream(filePath));
            formData.append(`file_${index}`, `${item.filehash}`);
            upFile.push(item);
          }
        });
        let uplen = upFile.length;
        if (uplen) {
          let res = await UtilService.UpLoadFile(formData);
          this.imgList = this.imgList.filter((url) => !url.startsWith("blob:"));
          this.imgList.push(...res.data);
        }
        return this.imgList;
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
    .setting {
      margin-left: 10px;
      font-size: 18px;
      color: #555;
      cursor: pointer;
      position: relative;
      user-select: none;
      .setting-menu {
        position: absolute;
        right: 0px;
        top: 34px;
        padding: 5px 0;
        background-color: #fff;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
      }
      .setting-btn {
        padding: 2px 20px;
        font-size: 14px;
        word-break: keep-all;
        &:hover {
          background-color: #f0f0f0;
          color: @color-active;
        }
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
      padding: 4px 0;
      border-bottom: 1px solid #e8e8e8;
      .cell {
        font-size: 14px;
      }
    }
    .list-wrap {
      flex: 1;
      overflow: overlay;
    }
    .cell {
      font-size: 12px;
      line-height: 30px;
      height: 30px;
      box-sizing: border-box;
      padding: 0px 10px;
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
    }
    .modify {
      width: 140px;
    }
    .operate {
      text-align: center;
      width: 80px;
      span {
        display: inline-block;
        padding: 0 4px;
        &:hover {
          color: red;
        }
      }
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