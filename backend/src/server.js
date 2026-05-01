"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./database/db");
const PORT = process.env.PORT || 3000;
(0, db_1.initDB)().then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`VisMu Backend running on port ${PORT}`);
    });
});
//# sourceMappingURL=server.js.map