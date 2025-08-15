var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/models/kvm.model.ts
var kvm_model_exports = {};
__export(kvm_model_exports, {
  KVM_DB_DIR: () => KVM_DB_DIR,
  KVM_DB_PATH: () => KVM_DB_PATH,
  KvmDeviceConnector: () => KvmDeviceConnector,
  KvmDeviceModel: () => KvmDeviceModel,
  connectKvm: () => connectKvm,
  deleteKvmDevicesFromDb: () => deleteKvmDevicesFromDb,
  getCookiesById: () => getCookiesById,
  getDbData: () => getDbData,
  getKvmDeviceById: () => getKvmDeviceById,
  getKvmDevicesFromDb: () => getKvmDevicesFromDb,
  initDb: () => initDb,
  saveCookiesToDb: () => saveCookiesToDb,
  saveKvmDevicesToDb: () => saveKvmDevicesToDb,
  setDbData: () => setDbData
});
module.exports = __toCommonJS(kvm_model_exports);
var import_axios = require("axios");
var import_promises = require("fs/promises");
var import_path = require("path");
var import_https = __toESM(require("https"));
var KvmDeviceModel = /* @__PURE__ */ ((KvmDeviceModel2) => {
  KvmDeviceModel2["RM1"] = "RM1";
  KvmDeviceModel2["RM1PE"] = "RM1PE";
  KvmDeviceModel2["RM10"] = "RM10";
  return KvmDeviceModel2;
})(KvmDeviceModel || {});
var KVM_DB_DIR = (0, import_path.resolve)(__dirname, "../db");
var KVM_DB_PATH = (0, import_path.resolve)(__dirname, "../db/kvm.json");
var agent = new import_https.default.Agent({
  rejectUnauthorized: false
  // 忽略证书验证
});
async function ensureDir(dirPath) {
  const absolutePath = (0, import_path.resolve)(dirPath);
  try {
    await (0, import_promises.access)(absolutePath);
    console.log(`\u76EE\u5F55\u5DF2\u5B58\u5728: ${absolutePath}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      await (0, import_promises.mkdir)(absolutePath, { recursive: true });
      console.log(`\u76EE\u5F55\u521B\u5EFA\u6210\u529F: ${absolutePath}`);
    } else {
      throw error;
    }
  }
}
var initDb = async () => {
  try {
    await ensureDir(KVM_DB_DIR);
    await (0, import_promises.access)(KVM_DB_PATH);
  } catch (error) {
    await (0, import_promises.writeFile)(KVM_DB_PATH, JSON.stringify({ kvmList: [], cookies: [] }));
    console.log(error);
  }
};
var getDbData = async () => {
  try {
    const res = await (0, import_promises.readFile)(KVM_DB_PATH, "utf-8");
    return JSON.parse(res);
  } catch (error) {
    return {};
  }
};
var setDbData = async (data) => {
  try {
    await (0, import_promises.writeFile)(KVM_DB_PATH, JSON.stringify(data));
    return true;
  } catch (error) {
    return false;
  }
};
var getKvmDevicesFromDb = async () => {
  try {
    const db = await getDbData();
    db.kvmList = db.kvmList.map((item) => {
      var _a, _b;
      item.cookie = (_b = (_a = db.cookies) == null ? void 0 : _a.find(
        (cookie) => cookie.id === item.id
      )) == null ? void 0 : _b.cookies;
      return item;
    });
    return db.kvmList || [];
  } catch (error) {
    return [];
  }
};
var getKvmDeviceById = async (id) => {
  try {
    const db = await getDbData();
    return (db.kvmList || []).find((item) => item.id === id);
  } catch (error) {
    return null;
  }
};
var getCookiesById = async (id) => {
  var _a;
  try {
    const db = await getDbData();
    return ((_a = (db.cookies || []).find((item) => item.id === id)) == null ? void 0 : _a.cookies) || "";
  } catch (error) {
    return "";
  }
};
var saveCookiesToDb = async (id, cookies) => {
  try {
    const db = await getDbData();
    const cookiesList = db.cookies || [];
    const index = cookiesList.findIndex((item) => item.id === id);
    if (index > -1) {
      cookiesList[index].cookies = cookies;
    } else {
      cookiesList.push({
        id,
        cookies
      });
    }
    await setDbData({ ...db, cookies: cookiesList });
    console.log("Save Cookies Success");
  } catch (error) {
    console.log("Save Cookies Error");
  }
};
var saveKvmDevicesToDb = async (data) => {
  try {
    const db = await getDbData();
    const res = await setDbData({
      ...db,
      kvmList: [...db.kvmList || [], data]
    });
    return res;
  } catch (error) {
    console.log("Save Kvm Error: ", error);
    return false;
  }
};
var deleteKvmDevicesFromDb = async (id) => {
  var _a;
  try {
    const db = await getDbData();
    const res = await setDbData({
      ...db,
      kvmList: db.kvmList.filter((item) => item.id !== id),
      cookies: db.cookies.filter((item) => item.id !== id)
    });
    return res;
  } catch (error) {
    console.log("Delete Kvm Error: ", (_a = error == null ? void 0 : error.toString) == null ? void 0 : _a.call(error));
    return false;
  }
};
var KvmDeviceConnector = class _KvmDeviceConnector {
  constructor(id, onConnect) {
    this.id = id;
    this.onConnect = onConnect;
    this.init();
  }
  kvm = null;
  static LoginUser = "admin";
  axios = new import_axios.Axios();
  cookies = "";
  async init() {
    var _a;
    this.kvm = await getKvmDeviceById(this.id);
    console.log("Init Kvm Device: ", this.id, this.kvm);
    const cookies = await getCookiesById(this.id);
    this.cookies = cookies;
    this.configAxios();
    const res = await this.connect();
    (_a = this.onConnect) == null ? void 0 : _a.call(this, res);
  }
  genUrl(url) {
    return `https://${this.kvm.ip}/api` + url;
  }
  configAxios() {
    const that = this;
    this.axios.defaults.timeout = 1e4;
    this.axios.interceptors.request.use((config) => {
      console.log("config: ", config.headers.Cookie, that.cookies);
      config.headers.Cookie = that.cookies;
      return config;
    });
  }
  async checkAuth() {
    try {
      console.log("Check auth: ", this.kvm, this.id);
      const res = await this.axios.get(this.genUrl("/auth/check"), {
        httpsAgent: agent
      });
      const data = JSON.parse(res.data);
      if (data.ok) {
        console.log("Check auth success", res.data);
        return true;
      }
      console.log("Check auth UnAuthorized");
      return false;
    } catch (error) {
      console.log("Check auth error");
      return false;
    }
  }
  async connect() {
    const res = await this.checkAuth();
    if (res) {
      return true;
    } else {
      const loginSuccess = await this.loginKvm();
      console.log("loginSuccess", loginSuccess);
      if (loginSuccess) {
        return await this.checkAuth();
      }
      return false;
    }
  }
  async loginKvm() {
    var _a, _b;
    const password = this.kvm.password;
    try {
      const data = new FormData();
      data.append("user", _KvmDeviceConnector.LoginUser);
      data.append("passwd", password);
      console.log("Login Kvm: ", this.kvm.ip, this.genUrl("/auth/login"), data);
      const res = await this.axios.post(this.genUrl("/auth/login"), data, {
        httpsAgent: agent,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      console.log("Login Kvm result: ");
      this.cookies = ((_a = res.headers["set-cookie"][0]) == null ? void 0 : _a.split(";")[0]) || "";
      console.log("Login Kvm Success: ", this.id, this.cookies);
      await saveCookiesToDb(this.id, this.cookies);
      return true;
    } catch (error) {
      console.log("Login Kvm Error: ", (_b = error == null ? void 0 : error.toString) == null ? void 0 : _b.call(error));
      return false;
    }
  }
  // public connectWs() {
  //     const ip = this.kvm.ip
  //     console.log('connectWs', ip);
  //     app.use(`/api/ws/${ip}`, createProxyMiddleware({
  //         target: `wss://${ip}/api/ws`,
  //         changeOrigin: true,
  //         ws: true,
  //         secure: false,
  //         headers: { Cookie: this.cookies }
  //     }));
  // }
};
var connectKvm = (id) => {
  return new Promise(async (resolve2, reject) => {
    const instance = new KvmDeviceConnector(id, (res) => {
      console.log("Connect KVM Result: ", res);
      if (res) {
        resolve2(res);
      } else {
        reject();
      }
    });
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KVM_DB_DIR,
  KVM_DB_PATH,
  KvmDeviceConnector,
  KvmDeviceModel,
  connectKvm,
  deleteKvmDevicesFromDb,
  getCookiesById,
  getDbData,
  getKvmDeviceById,
  getKvmDevicesFromDb,
  initDb,
  saveCookiesToDb,
  saveKvmDevicesToDb,
  setDbData
});
