import Axios from "axios"
const Crypto = require('crypto');
const Fs = require("fs");
// const FormData = require("form-data");

export class Util {
  static GetCookie(name) {
    let arr;
    let reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if ((arr = document.cookie.match(reg))) return unescape(arr[2]);
    else return null;
  }
  /**
 * 日期格式化
 * @param date              要格式化的日期
 * @param {string} format   日期转换格式
 * @returns {String}
 * @constructor
 */
  static DateFormat(date: any, format: string = "yyyy-MM-dd HH:mm:ss"): string | any {
    if (!date) return date;
    if (typeof date === "string" && !date.trim()) return "";
    //修改为支持字符串格式的日期或date对象
    date = this.DateParse(date);

    let formats: any = {
      "y+": date.getFullYear(),
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "H+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds(),
      "w+": ["日", "一", "二", "三", "四", "五", "六"][date.getDay()]
    };
    Object.keys(formats).forEach((key: string) => {
      const item = formats[key];
      format = format.replace(eval("/" + key + "/g"), function (exp) {
        return (exp.length === 1) ? (item) : (("0" + item).substr(("0" + item).length - exp.length));
      });
    });
    return format;
  }
  /**
   * 返回文件大小显示
   * @param {number} size
   * @returns {string}
   * @constructor
   */
  static FileSize(bytes: number): string {
    let size = "";
    if (bytes < 1024) {                            //小于1KB，则转化成B
      size = Math.ceil(bytes) + "B"
    } else if (bytes < 1024 * 1024) {            //小1MB，则转化成KB
      size = Math.ceil(bytes / 1024) + "K"
    } else if (bytes < 1024 * 1024 * 1024) {        //小于1GB，则转化成MB
      size = Math.ceil(bytes / (1024 * 1024)) + "M"
    } else {                                            //其他转化成GB
      size = Math.ceil(bytes / (1024 * 1024 * 1024)) + "G"
    }
    return size;
    // let sizeStr =
  }
  /**
 * 不同格式转换日期
 * @param date
 * @returns {Date}
 * @constructor
 */
  static DateParse(date: any): Date {
    if (!(date instanceof Date)) {
      if (typeof date === "number") {
        date = new Date(date);
      } else if (typeof date === "string" && date !== "") {
        date = date.replace(/\..+$/g, "");
        if ((/\d{4}[^\d]\d{1,2}$/).test(date)) {
          date = date + "/01";
        }
        if ((/\d{4}[^\d]\d{1,2}[^\d]\d{1,2}$/).test(date)) {
          date = date + " 00:00:00";
        }
        //加时区转换，底座中不带时区获取事件会有问题
        if ((/\d{4}[^\d]\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}$/).test(date)) {
          date = date + "+0800";
        }
        date = date.replace(/(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})[^\d](\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}(\+|\-)\d{4})$/, "$1T$2");
        //单数组前补充0
        date = date.replace(/(^|[^\d])(\d)(?=[^\d]|$)/ig, "$10$2");
        date = date.replace(/[^\d:+\-T ]/g, "-");
        date = new Date(date);
      }
    }
    return date;
  }
  /**
   * 上传文件
   * @param formData fileData
   */
  static UpLoadFile(list: [any]) {
    let form = new FormData();
    list.forEach((item) => {
      const stream = Fs.createReadStream(item.path);
      form.append('file', stream);
    });
    // const formHeaders = form.getHeaders();
    return Axios.post('/api/uploadFile', form, {
      // "Authorizition": Util.GetCookie("Authorizition")
      headers: {
        "Authorizition": Util.GetCookie("Authorizition"),
        'Content-Type': 'multipart/form-data',
        // ...formHeaders
      }
    });
    // https://zhuanlan.zhihu.com/p/120834588
    // https://www.cnblogs.com/tugenhua0707/p/10828869.html
    // https://github.com/request/request#multipartform-data-multipart-form-uploads
    // https://segmentfault.com/a/1190000020654277
    // return HTTP.post("/uploadFile", form, config);
  }
  /**
   * 获取文件hash
   * @param paths 文件本地路径集合
   */
  static async GetFileHash(paths: string[]) {
    let promisArr = paths.map(path => {
      return new Promise((resolve, reject) => {
        //读取一个Buffer
        const fsHash = Crypto.createHash('md5');
        Fs.readFile(path, (err, buffer) => {
          if (err) {
            reject(err);
          } else {
            fsHash.update(buffer);
            const md5 = fsHash.digest('hex');
            resolve(md5)
          }
        });
      })
    });
    return Promise.all(promisArr);
  }
  /**
   * 生成唯一ID（32位）
   */
  static GetUID() {
    return Crypto.randomBytes(16).toString("hex");
  }
}
// 数据获取服务
export class HTTP {
  /**
   * get请求
   * @param url api
   * @param params 参数
   */
  static async get(url, params) {
    return Axios.get(`/api${url}`, { params })
  }
  /**
   * Post请求
   * @param url 接口
   * @param body 数据
   */
  static async post(url, body, config: any = {}) {
    const headers = {
      "Authorizition": Util.GetCookie("Authorizition")
    }
    if (config.headers) Object.assign(config.headers, headers);
    else config.headers = headers;
    return Axios.post(`/api${url}`, body, config)
  }
}

// // 数据获取服务
// export class HTTP {
//   /**
//    * get请求
//    * @param url api
//    * @param params 参数
//    */
//   static async get(url: string, params: any) {
//     const headers = {
//       "Authorizition": Util.GetCookie("Authorizition"),
//     }
//     return fetch(`/api${url}?${new URLSearchParams(params)}`, { headers }).then(response => {
//       return response.json(); // responese.json() 是promise
//     })
//   }
//   /**
//    * Post请求
//    * @param url 接口
//    * @param body 数据
//    */
//   static async post(url: string, data: any) {
//     let config = {
//       method: 'POST',
//       body: JSON.stringify(data),
//       headers: {
//         "Authorizition": Util.GetCookie("Authorizition"),
//         'Content-Type': 'application/json'
//       },
//     };
//     return fetch(`/api${url}`, config).then(response => {
//       return response.json(); // responese.json() 是promise
//     })
//   }
//   /**
//    * Post请求
//    * @param url 接口
//    * @param body 数据
//    */
//   static async put(url: string, formdata: any) {
//     let config = {
//       method: 'POST',
//       body: formdata,
//       headers: {
//         "Authorizition": Util.GetCookie("Authorizition"),
//       },
//     };

//     return fetch(`/api${url}`, config).then(response => {
//       return response.json(); // responese.json() 是promise
//     })
//   }
// }