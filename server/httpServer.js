"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @Author: shufei.han
 * @Description: 修复WebSocket代理同时保留原有HTTP代理
 */
var express_1 = __importDefault(require("express"));
var http_proxy_middleware_1 = require("http-proxy-middleware");
var http_1 = __importDefault(require("http"));
var kvm_model_1 = require("./models/kvm.model");
var models_1 = require("./models");
var nanoid_1 = require("nanoid");
var HTTP_PORT = 4004;
var app = (0, express_1.default)();
// 中间件配置
app.use(express_1.default.json());
app.use(function (req, res, next) {
    console.log("[HTTP] ".concat(req.method, " ").concat(req.url));
    next();
});
// 存储设备代理配置
var deviceProxies = new Map();
app.post('/api/kvm/add', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, kvm, success;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = (0, nanoid_1.nanoid)();
                kvm = __assign(__assign({}, req.body), { id: id });
                return [4 /*yield*/, (0, kvm_model_1.saveKvmAppsToDb)(kvm)];
            case 1:
                success = _a.sent();
                console.log(success, kvm);
                if (!success) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, kvm_model_1.connectKvm)(id)];
            case 2:
                _a.sent();
                return [4 /*yield*/, initProxies()];
            case 3:
                _a.sent();
                return [2 /*return*/, res.send(new models_1.BaseResponse(true, req.body, 'Add kvm success!'))];
            case 4:
                res.status(500).send(new models_1.BaseResponse(false, req.body, 'Add kvm error!'));
                return [2 /*return*/];
        }
    });
}); });
app.post('/api/kvm/connect', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var success, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, kvm_model_1.connectKvm)(req.query.id)];
            case 1:
                success = _a.sent();
                if (success) {
                    res.send(new models_1.BaseResponse(true, 'Connect kvm success!'));
                }
                else {
                    throw new Error('Connect kvm error!');
                }
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).send(new models_1.BaseResponse(false, error_1, 'Connect kvm error!'));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// app.post('/api/login', async (req) => {
//   try {
//     const data = req.body
//     // res.cookie('user', user.username).send(new BaseResponse(true, user))
//     console.log(data)
//   } catch {
//     // res.status(500).send(new BaseResponse(false, error))
//   }
// })
app.get('/api/kvm/list', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, kvm_model_1.getKvmDevicesFromDb)()];
            case 1:
                list = _a.sent();
                res.send(new models_1.BaseResponse(true, list));
                return [2 /*return*/];
        }
    });
}); });
// 初始化代理
var initProxies = function () { return __awaiter(void 0, void 0, void 0, function () {
    var kvmList;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, kvm_model_1.getKvmDevicesFromDb)()];
            case 1:
                kvmList = _a.sent();
                kvmList.forEach(function (item) {
                    var proxyPath = "/kvm-api/".concat(item.id);
                    var target = "https://".concat(item.ip);
                    // 创建HTTP代理中间件
                    var proxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
                        target: target,
                        secure: false,
                        changeOrigin: true,
                        // @ts-ignore
                        logLevel: 'debug',
                        // pathRewrite: {
                        //   [`^${proxyPath}`]: '/api'  // 移除设备ID前缀
                        // },
                        pathRewrite: function (path, req) {
                            var originPath = path;
                            var newPath = path.replace(proxyPath, '');
                            console.log('path', { originPath: originPath, path: path, newPath: newPath, proxyPath: proxyPath });
                            return newPath;
                        },
                        headers: {
                            Cookie: item.cookie
                        }
                    });
                    // 注册代理中间件
                    app.use(proxyPath, proxy);
                    deviceProxies.set(item.id, proxy);
                    console.log("[Proxy] Registered ".concat(item.id, " -> ").concat(target));
                });
                return [2 /*return*/];
        }
    });
}); };
// 创建HTTP服务器
var server = http_1.default.createServer(app);
// 单独处理WebSocket升级请求
server.on('upgrade', function (req, socket, head) {
    var _a;
    try {
        var deviceId = (_a = req.url) === null || _a === void 0 ? void 0 : _a.split('/')[2]; // 从/kvm-api/DEVICE_ID/...提取
        var proxy = deviceId ? deviceProxies.get(deviceId) : null;
        if (!proxy) {
            console.error("[WS] Device ".concat(deviceId, " not found"));
            socket.destroy();
            return;
        }
        // 调用原始中间件的upgrade处理
        // @ts-ignore
        proxy.upgrade(req, socket, head);
    }
    catch (err) {
        console.error('[WS] Proxy error:', err);
        socket.destroy();
    }
});
// 启动服务
var start = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, initProxies()];
            case 1:
                _a.sent();
                server.listen(HTTP_PORT, function () {
                    console.log("\n      Server running on port ".concat(HTTP_PORT, "\n      HTTP Proxy: http://localhost:").concat(HTTP_PORT, "/kvm-api/:deviceId/...\n      WS Proxy:   ws://localhost:").concat(HTTP_PORT, "/kvm-api/:deviceId/ws\n    "));
                });
                return [2 /*return*/];
        }
    });
}); };
start();
