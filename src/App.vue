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
      <span class="setting iconfont icon-reload" title="立即同步"></span>
      <span class="setting iconfont icon-shezhi" @click="showSetting =!showSetting" title="设置">
        <ul class="setting-menu" v-show="showSetting">
          <li class="setting-btn" @click="setSyncDir" title="设置需要同步的文件夹">设置同步文件夹</li>
          <li class="setting-btn">同步间隔时间</li>
          <li class="setting-btn">垃圾箱</li>
          <li class="setting-btn" @click="setListType()">{{isList?`缩略图显示`:`列表显示`}}</li>
        </ul>
      </span>
    </ul>
    <!-- 缩略图 -->
    <div class="file-thumb" v-if="files.length && !isList">
      <div class="file-item" v-for="(item,index) in files" :key="index" :title="item.title">
        <div class="file-content" @dblclick="fileClick(item)">
          <img class="file-icon" :src="item.fileIcon" />
          <span class="file-name">{{item.FileName}}</span>
        </div>
      </div>
    </div>
    <!-- 列表 -->
    <div class="file-list" v-if="files.length && isList">
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
            <span class="file-name" :title="item.FileName">{{item.FileName}}</span>
          </span>
          <span class="cell size">{{item.fileSize}}</span>
          <span class="cell modify">{{item.ModifyTime}}</span>
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
      <li>4.删除线上时询问是否同时删除本地文件</li>
      <li>5.isDelete的文件检测本地是否有，如果有就删除</li>
      <li>6.记录电脑登录日志，电脑唯一uid，区分电脑</li>
      <li>7.设计版本记录时间间隔，时间段内有文件就替换，超出时间就产生新版本</li>
    </ul>
  </div>
</template>

<script>
  const Chokidar = require("chokidar");
  const { BrowserWindow, dialog } = require("electron").remote;
  const Fs = require("fs");
  const Path = require("path");
  import { FileIcon } from "./Enum";
  import { Util, HTTP } from "./service";
  export default {
    name: "App",
    data() {
      return {
        files: [],
        crumbs: [],
        isList: false,
        showSetting: false,
      };
    },
    mounted() {
      this.upload(this.filesList());
      HTTP.get("/getSyncData", { DirID: 0 }).then((res) => {
        console.log(res);
      });
      // let dirData = {
      //   ParentID: 0,
      //   DirName: "测试文件夹A",
      //   ModifyTime: "2020-8-12 23:08:55",
      // };
      // HTTP.post("/saveDir", dirData).then((res) => {
      //   console.log(res);
      // });
      let cacheType = localStorage.getItem("sync_dir_list");
      this.isList = cacheType === "true" ? true : false;

      let syncPath = localStorage.getItem("sync_dir_path");
      if (syncPath) {
        this.crumbs.push({
          dirName: syncPath.slice(syncPath.lastIndexOf("\\") + 1),
          dirPath: syncPath,
        });
        this.getDirAndFile(syncPath);

        // var watcher = Chokidar.watch(syncPath, {
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
      setListType() {
        this.isList = !this.isList;
        localStorage.setItem("sync_dir_list", this.isList);
      },
      fileClick(item) {
        if (item.isDir) {
          let path = Path.join(item.path, item.FileName);
          this.getDirAndFile(path);
          this.crumbs.push({
            dirName: item.FileName,
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
              res.FileName = name;
              res.ModifyTime = Util.DateFormat(res.mtime);
              // 文件夹
              if (res.isDir) {
                res.path = dirPath;
                res.fileIcon = `./src/assets/img/dir.svg`;
                res.title = `名称：${name}\n修改日期：${res.ModifyTime}`;
                dirArr.push(res);
              } else if (res.isFile) {
                // 文件   只有符合条件的文件才能显示
                res.extName = name.slice(name.lastIndexOf(".") + 1);
                let extObj = FileIcon.find((item) =>
                  item.data.includes(res.extName)
                );
                if (extObj) {
                  res.path = Path.join(dirPath, name);
                  res.fileSize = Util.FileSize(res.size);
                  res.title = `名称：${name}\n大小：${res.fileSize}\n修改日期：${res.ModifyTime}`;
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
        let hashs = Util.GetFileHash(list.map((item) => item.path));
        list.forEach((item, index) => {
          item.FileHash = hashs[index];
        });
        // let { data } = await HTTP.post("/fileExist", hashs);
        // let upFile = [];

        // let uplen = upFile.length;
        // if (uplen) {
        let res = await Util.UpLoadFile(list);
        console.log(res);
        // }
      },
      filesList() {
        return [
          {
            dev: 2354241344,
            mode: 33206,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            blksize: 4096,
            ino: 5066549581616972,
            size: 5,
            blocks: 0,
            atimeMs: 1597377060017.2466,
            mtimeMs: 1597377059397.383,
            ctimeMs: 1597377059397.383,
            birthtimeMs: 1597377031112.276,
            atime: "2020-08-14T03:51:00.017Z",
            mtime: "2020-08-14T03:50:59.397Z",
            ctime: "2020-08-14T03:50:59.397Z",
            birthtime: "2020-08-14T03:50:31.112Z",
            isFile: true,
            isDir: false,
            FileName: "111.txt",
            ModifyTime: "2020-08-14 11:50:59",
            extName: "txt",
            path: "C:\\Users\\Chris\\Desktop\\pdm\\111.txt",
            fileSize: "5B",
            title: "名称：111.txt\n大小：5B\n修改日期：2020-08-14 11:50:59",
            fileIcon: "./src/assets/img/txt.svg",
          },
          {
            dev: 2354241344,
            mode: 33206,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            blksize: 4096,
            ino: 2533274790967496,
            size: 20992,
            blocks: 48,
            atimeMs: 1597377031172.26,
            mtimeMs: 1564230013788.047,
            ctimeMs: 1591589212749.7786,
            birthtimeMs: 1564230013756.0452,
            atime: "2020-08-14T03:50:31.172Z",
            mtime: "2019-07-27T12:20:13.788Z",
            ctime: "2020-06-08T04:06:52.750Z",
            birthtime: "2019-07-27T12:20:13.756Z",
            isFile: true,
            isDir: false,
            FileName: "ceshiceshi.ppt",
            ModifyTime: "2019-07-27 20:20:13",
            extName: "ppt",
            path: "C:\\Users\\Chris\\Desktop\\pdm\\ceshiceshi.ppt",
            fileSize: "21K",
            title:
              "名称：ceshiceshi.ppt\n大小：21K\n修改日期：2019-07-27 20:20:13",
            fileIcon: "./src/assets/img/ppt.svg",
          },
          {
            dev: 2354241344,
            mode: 33206,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            blksize: 4096,
            ino: 4785074604348146,
            size: 5,
            blocks: 0,
            atimeMs: 1597313703854.261,
            mtimeMs: 1563002591394.127,
            ctimeMs: 1591589212749.7786,
            birthtimeMs: 1563002586888.322,
            atime: "2020-08-13T10:15:03.854Z",
            mtime: "2019-07-13T07:23:11.394Z",
            ctime: "2020-06-08T04:06:52.750Z",
            birthtime: "2019-07-13T07:23:06.888Z",
            isFile: true,
            isDir: false,
            FileName: "dfSD.txt",
            ModifyTime: "2019-07-13 15:23:11",
            extName: "txt",
            path: "C:\\Users\\Chris\\Desktop\\pdm\\dfSD.txt",
            fileSize: "5B",
            title: "名称：dfSD.txt\n大小：5B\n修改日期：2019-07-13 15:23:11",
            fileIcon: "./src/assets/img/txt.svg",
          },
        ];
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