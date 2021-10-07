"use strict";
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
exports.__esModule = true;
var web_1 = require("sip.js/lib/platform/web");
// Helper function to get an HTML audio element
function getAudioElement(id) {
    var el = document.getElementById(id);
    if (!(el instanceof HTMLAudioElement)) {
        throw new Error("Element \"" + id + "\" not found or not an audio element.");
    }
    return el;
}
// Helper function to wait
function wait(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    setTimeout(resolve, ms);
                })];
        });
    });
}
// Main function
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var server, destination, aor, authorizationUsername, authorizationPassword, options, simpleUser;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    server = "wss://192.168.178.11:5066";
                    destination = "sip:101@192.168.178.11";
                    aor = "sip:103@192.168.178.11";
                    authorizationUsername = '103';
                    authorizationPassword = '1234';
                    options = {
                        aor: aor,
                        media: {
                            remote: {
                                audio: getAudioElement("remoteAudio")
                            }
                        },
                        userAgentOptions: {
                            authorizationPassword: authorizationPassword,
                            authorizationUsername: authorizationUsername
                        }
                    };
                    simpleUser = new web_1.SimpleUser(server, options);
                    // Supply delegate to handle inbound calls (optional)
                    simpleUser.delegate = {
                        onCallReceived: function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, simpleUser.answer()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }
                    };
                    // Connect to server
                    return [4 /*yield*/, simpleUser.connect()];
                case 1:
                    // Connect to server
                    _a.sent();
                    // Register to receive inbound calls (optional)
                    return [4 /*yield*/, simpleUser.register()];
                case 2:
                    // Register to receive inbound calls (optional)
                    _a.sent();
                    // Place call to the destination
                    return [4 /*yield*/, simpleUser.call(destination)];
                case 3:
                    // Place call to the destination
                    _a.sent();
                    // Wait some number of milliseconds
                    return [4 /*yield*/, wait(5000)];
                case 4:
                    // Wait some number of milliseconds
                    _a.sent();
                    // Hangup call
                    return [4 /*yield*/, simpleUser.hangup()];
                case 5:
                    // Hangup call
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Run it
main()
    .then(function () { return console.log("Success"); })["catch"](function (error) { return console.error("Failure", error); });
