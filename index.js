"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ResponseError = /** @class */ (function (_super) {
    __extends(ResponseError, _super);
    function ResponseError(message) {
        return _super.call(this, message) || this;
    }
    return ResponseError;
}(Error));
exports.ResponseError = ResponseError;
var SimpleApiClient = /** @class */ (function () {
    function SimpleApiClient(options) {
        this.options = options;
    }
    /** Fetches an url that returns one value */
    SimpleApiClient.prototype.fetchJson = function (url, method, data) {
        return this.fetch(url, method, data).then(function (response) { return response.json(); });
    };
    /** Fetches an url that returns nothing */
    SimpleApiClient.prototype.fetch = function (url, method, data) {
        var _this = this;
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
        return window.fetch(url, requestInit).then(function (response) {
            if (_this.options && _this.options.onQueryEnd)
                _this.options.onQueryEnd();
            if (response.status >= 300 || response.status < 200) {
                var error = new ResponseError(response.statusText);
                error.response = response;
                throw error;
            }
            return response;
        });
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
function parseErrors(error, showError, errorMessages) {
    if (errorMessages === void 0) { errorMessages = defaultErrorMessages; }
    if (!error.response) {
        showError(errorMessages.unknownError);
        return;
    }
    switch (error.response.status) {
        case 401:
            showError(errorMessages.unauthorized);
            break;
        case 404:
            showError(errorMessages.notFound);
            break;
        case 500:
            showError(errorMessages.internalServerError);
            break;
        default:
            if (!error.response.json) {
                showError(errorMessages.unknownError);
            }
            else {
                error.response.json().then(function (value) {
                    showError(value);
                });
            }
            break;
    }
}
exports.parseErrors = parseErrors;
