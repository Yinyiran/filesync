export default class Service {
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
}