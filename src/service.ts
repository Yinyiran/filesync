var crypto = require('crypto');
var fs = require('fs');

export class Util {
  static GetCookie(name) {
    var arr,
      reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
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
    if (!date) {
      return date;
    }
    if (typeof date === "string" && !date.trim()) {
      return "";
    }
    if (!format) {
      format = 'yyyy-MM-dd';
    }
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
        // if (~date.indexOf("T")) {
        //    // date = date.replace("T", " ");
        //   //return new Date(Date.parse(date));
        // }
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
  static UpLoadFile(formData) {
    const config = {
      headers: { "content-type": "multipart/form-data" },
    };
    return HTTP.post("/uploadFile", formData, config);
  }
  /**
   * 获取文件hash
   * @param paths 文件本地路径集合
   */
  static async getFileHash(paths: string[]) {
    let promisArr = paths.map(path => {
      return new Promise((resolve) => {
        //读取一个Buffer
        var fsHash = crypto.createHash('md5');
        fs.readFile(path, (err, buffer) => {
          fsHash.update(buffer);
          var md5 = fsHash.digest('hex');
          resolve({ [path]: md5 })
        });
      })
    });
    return Promise.all(promisArr);
  }
}
// 数据获取
export class HTTP {
  /**
   * get请求
   * @param url api
   * @param params 参数
   */
  static get(url, params) {
    return fetch(`/api${url}?${new URLSearchParams(params)}`, {
      headers: {
        "x-csrf-token": Util.GetCookie("csrfToken"),
        'content-type': 'application/json'
      },
      mode: 'cors',
      credentials: "omit"
    })
  }
  /**
   * Post请求
   * @param url 接口
   * @param body 数据
   * @param config 配置
   */
  static post(url, body, config: any) {
    let headers = {
      "x-csrf-token": Util.GetCookie("csrfToken"),
      'content-type': 'application/json'
    }

    if (config.headers) Object.assign(headers, config.headers,);
    return fetch(`/api${url}`, { body, headers, method: 'POST', mode: 'cors', credentials: "omit" })
  }
}