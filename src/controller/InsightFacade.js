"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
class InsightFacade {
    constructor() {
        Util_1.default.trace("InsightFacadeImpl::init()");
    }
    addDataset(id, content, kind) {
        return Promise.reject("Not implemented.");
    }
    removeDataset(id) {
        return Promise.reject("Not implemented.");
    }
    performQuery(query) {
        return Promise.reject("Not implemented.");
    }
    listDatasets() {
        return Promise.reject("Not implemented.");
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map