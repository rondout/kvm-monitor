var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/utils/index.ts
var utils_exports = {};
__export(utils_exports, {
  parseCookies: () => parseCookies,
  parseUrlQuery: () => parseUrlQuery
});
module.exports = __toCommonJS(utils_exports);
function parseCookies(cookies) {
  try {
    const cookieObj = {};
    const cookieArray = cookies.split("; ");
    for (const cookie of cookieArray) {
      const [key, value] = cookie.split("=");
      if (key && value) {
        cookieObj[key.trim()] = decodeURIComponent(value.trim());
      }
    }
    return cookieObj;
  } catch {
    return {};
  }
}
function parseUrlQuery(url = window.location.href) {
  try {
    const query = url.split("?")[1];
    const params = new URLSearchParams(query);
    console.log(query);
    const result = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } catch (error) {
    return {};
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseCookies,
  parseUrlQuery
});
