"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var SimpleApiClient = /** @class */ (function () {
    function SimpleApiClient(options) {
        this.options = options;
    }
    /** Fetches an url that returns one value */
    SimpleApiClient.prototype.fetchJson = function (url, method, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, json, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetch(url, method, data)];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        json = _a.sent();
                        return [2 /*return*/, { ok: true, value: json, response: response }];
                    case 3: return [4 /*yield*/, response.text()];
                    case 4:
                        text = _a.sent();
                        return [2 /*return*/, { response: response, ok: false, message: text }];
                }
            });
        });
    };
    /** Fetches an url that returns nothing */
    SimpleApiClient.prototype.fetch = function (url, method, data) {
        if (this.options && this.options.onQueryStart)
            this.options.onQueryStart();
        var headers = new Headers();
        headers.append("Accept", "application/json");
        headers.append('Content-Type', 'application/json');
        var requestInit = {
            method: method,
            credentials: 'same-origin',
            headers: headers
        };
        if (data != undefined)
            requestInit.body = data;
        return window.fetch(url, requestInit);
    };
    return SimpleApiClient;
}());
exports.SimpleApiClient = SimpleApiClient;
/** Creates a guery string from a list of parameters. Starts with a ? */
function getQueryString(parameters) {
    var parametersList = [];
    if (parameters) {
        for (var key in parameters) {
            var value = parameters[key];
            if (value == undefined)
                continue;
            if (value instanceof Date)
                value = value.toISOString();
            parametersList.push(key + '=' + encodeURIComponent(value));
        }
    }
    var ret;
    if (parametersList.length > 0) {
        ret = '?' + parametersList.join('&');
    }
    else {
        ret = '';
    }
    return ret;
}
exports.getQueryString = getQueryString;
var defaultErrorMessages = {
    unauthorized: "Unauthorized access",
    internalServerError: "Internal server error",
    notFound: "Resource not found",
    unknownError: "Unknown error"
};
function parseErrors(error, errorMessages) {
    if (errorMessages === void 0) { errorMessages = defaultErrorMessages; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (error.status) {
                case 401:
                    return [2 /*return*/, errorMessages.unauthorized];
                case 404:
                    return [2 /*return*/, errorMessages.notFound];
                case 500:
                    return [2 /*return*/, errorMessages.internalServerError];
                default:
                    return [2 /*return*/, errorMessages.unknownError];
            }
            return [2 /*return*/];
        });
    });
}
exports.parseErrors = parseErrors;
