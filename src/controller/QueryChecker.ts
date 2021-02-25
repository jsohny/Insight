import { InsightError, InsightDataset } from "./IInsightFacade";

export default class QueryChecker {

    private static mfields: string[] = ["avg", "pass", "fail", "audit", "year"];
    private static sfields: string[] = ["dept", "id", "instructor", "title", "uuid"];
    private static filters: string[] = ["AND", "OR", "LT", "GT", "EQ", "IS", "NOT"];

    public checkQueryValidity(query: any, datasetsInIF: InsightDataset[]): Promise<void> {

        // Check query and its main keys are good
        let checkMainPromise = this.checkMainKeys(query);

        // Check everything in OPTIONS are good
        let checkOPTIONSPromise = checkMainPromise.then(() => {
            return this.checkOPTIONS(query["OPTIONS"], datasetsInIF);
        }).catch((err) => {
            return Promise.reject(err);
        });

        // Check everything in WHERE is good
        return checkOPTIONSPromise.then((currDatasetID) => {
            return this.checkWHERE(query["WHERE"], currDatasetID);
        }).catch((err) => {
            return Promise.reject(err);
        });

    }

    // Checks main keys for right one
    private checkMainKeys(query: any): Promise<void> {

        // Check if object
        if (typeof(query) !== "object") { return Promise.reject(new InsightError("Query not an object")); }

        // Check if has the right main keys
        let keys = Object.keys(query);
        if (!keys.includes("WHERE")) { return Promise.reject(new InsightError("Missing WHERE")); }
        if (!keys.includes("OPTIONS")) { return Promise.reject(new InsightError("Missing OPTIONS")); }
        if (keys.length > 2) { return Promise.reject(new InsightError("Too many keys")); }

        // Check if they are objects
        if (typeof(query["WHERE"]) !== "object") {
            return Promise.reject(new InsightError("WHERE value must be object"));
        }
        if (typeof(query["OPTIONS"]) !== "object") {
            return Promise.reject(new InsightError("OPTIONS value not an object"));
        }

        return Promise.resolve();

    }

    // Checks everything in OPTIONS is good
    private checkOPTIONS(options: any, datasetsInIF: InsightDataset[]): Promise<string> {

        // Check OPTIONS has right keys and check if has ORDER
        let optionsKeys = Object.keys(options);
        let hasORDER = false;
        if (!optionsKeys.includes("COLUMNS")) { return Promise.reject(new InsightError("Missing COLUMNS")); }
        if (optionsKeys.length > 1) {
            if (!optionsKeys.includes("ORDER")) {
                return Promise.reject(new InsightError("Additional key in OPTIONS must be ORDER"));
            }
            hasORDER = true;
        }
        if (optionsKeys.length > 2) { return Promise.reject(new InsightError("Too many keys in OPTIONS")); }

        // Check COLUMNS is an array
        if (!Array.isArray(options["COLUMNS"])) {
            return Promise.reject(new InsightError("COLUMNS value must be an array"));
        }

        // Check COLUMNS isn't empty
        let cols = options["COLUMNS"];
        if (cols.length === 0) { return Promise.reject(new InsightError("Can not have empty COLUMNS")); }

        // Extract and check dataset id from first column arg after checking it is valid
        if (!this.checkKeyFormat(cols[0])) { return Promise.reject(new InsightError("Invalid key in COLUMNS")); }
        let datasetID = cols[0].split("_")[0];

        // Check id to see if dataset with that id is added
        if (!this.checkID(datasetID, datasetsInIF)) {
            return Promise.reject(new InsightError("Dataset with given ID not added yet"));
        }

        // Check all keys in COLUMNS are of valid format and of same dataset
        for (let currcol of cols) {
            if (!this.checkKeyFormat(currcol)) { return Promise.reject(new InsightError("Invalid key in COLUMNS")); }
            if (datasetID !== currcol.split("_")[0]) {
                return Promise.reject(new InsightError("Can't query different datasets"));
            }
        }

        // If has ORDER check that the order string is in cols
        if (hasORDER && !cols.includes(options["ORDER"])) {
            return Promise.reject(new InsightError("ORDER key not in COLUMNS"));
        }

        return Promise.resolve(datasetID);

    }

    // Checks everything in WHERE is good, really a wrapper that just checks if its empty
    // because the WHERE value is actually a "filter object" itself
    private checkWHERE(where: any, datasetID: string): Promise<void> {

        // Check just return resolve if empty
        if (Object.keys(where).length === 0) {
            return Promise.resolve();
        } else {
            return this.checkFILTER(where, datasetID);
        }

    }

    // Checks a FILTER object to see if it is valid and for right dataset
    private checkFILTER(filterObj: any, datasetID: string): Promise<void> {

        // Check that FILTER object is a FILTER object
        if (typeof(filterObj) !== "object") { return Promise.reject(new InsightError("FILTER must be in object")); }

        // Check only one property and that property is a FILTER
        let filters = Object.keys(filterObj);
        if (filters.length !== 1) { return Promise.reject(new InsightError("FILTER must be alone in object")); }

        // Based on FILTER check the value to see if it is a valid value to give
        let currFilter = filters[0];
        let specificCheckProm: Promise<void>;
        if (["LT", "GT", "EQ"].includes(currFilter)) {
            specificCheckProm = this.checkMCOMPARISONFILTERarg(filterObj[currFilter], datasetID);
        } else if (currFilter === "IS") {
            specificCheckProm = this.checkSCOMPARISONFILTERarg(filterObj[currFilter], datasetID);
        } else if (currFilter === "NOT") {
            specificCheckProm = this.checkFILTER(filterObj[currFilter], datasetID);
        } else if (["AND", "OR"].includes(currFilter)) {
            if (!Array.isArray(filterObj[currFilter])) {
                return Promise.reject(new InsightError("AND/OR value must be an array"));
            }
            if (filterObj[currFilter].length === 0) {
                return Promise.reject(new InsightError("AND/OR array must be non-empty"));
            }
            // Pseudo recursively check every filter in array to ensure all check out
            specificCheckProm = this.checkANDORFILTERarg(filterObj[currFilter], 0, datasetID);
        } else {
            return Promise.reject(new InsightError("Invalid FILTER given"));
        }

        // Wait on filter check promise
        return specificCheckProm.then(() => {
            return Promise.resolve();
        }).catch((result) => { return Promise.reject(result); });

    }

    private checkANDORFILTERarg(arrToCheck: any, currIndex: number, datasetID: string): Promise<void> {
        let checkCurr = this.checkFILTER(arrToCheck[currIndex], datasetID);
        return checkCurr.then((result) => {
            // If next index isnt off list yet keep going
            if (currIndex + 1 < arrToCheck.length) {
                let checkNext = this.checkANDORFILTERarg(arrToCheck, currIndex + 1, datasetID);
                return checkNext.then(() => {
                    return Promise.resolve();
                }).catch((result2) => { return Promise.reject(result2); });
            // Else stop
            } else {
                return Promise.resolve(result);
            }
        }).catch((result) => { return Promise.reject(result); });
    }

    private checkMCOMPARISONFILTERarg(filterArg: any, datasetID: string): Promise<void> {

        // Check that MCOMPARISONFILTERarg is an object
        if (typeof(filterArg) !== "object") {
            return Promise.reject(new InsightError("MCOMPARISON must be an object"));
        }

        // Check only has one key and that key is valid
        let keys = Object.keys(filterArg);
        if (keys.length !== 1) {
            return Promise.reject(new InsightError("MCOMPARISON must only have one key"));
        }
        if (!this.checkKeyFormat(keys[0])) {
            return Promise.reject(new InsightError("MCOMPARISON has invalid key"));
        }

        // Check that id is for right dataset and key is in mfields
        let mkeyid = keys[0].split("_")[0];
        let mkeyfield = keys[0].split("_")[1];
        if (mkeyid !== datasetID) { return Promise.reject(new InsightError("In MCOMPAR cannot query 2nd dataset")); }
        if (!QueryChecker.mfields.includes(mkeyfield)) {
            return Promise.reject(new InsightError("MCOMPAR key has a non mfield"));
        }

        // Check that argument for field is a number
        if (typeof(filterArg[keys[0]]) !== "number") {
            return Promise.reject(new InsightError("MCOMPAR value must be a number"));
        }

        return Promise.resolve();

    }

    private checkSCOMPARISONFILTERarg(filterArg: any, datasetID: string): Promise<void> {

        // Check that SCOMPARISONFILTERarg is an object
        if (typeof(filterArg) !== "object") { return Promise.reject(new InsightError("SCOMPAR must be an object")); }

        // Check only has one key and that key is valid
        let keys = Object.keys(filterArg);
        if (keys.length !== 1) { return Promise.reject(new InsightError("SCOMPAR must only have one key")); }
        if (!this.checkKeyFormat(keys[0])) { return Promise.reject(new InsightError("SCOMPARISON has invalid key")); }

        // Check that id is for right dataset and key is in sfields
        let skeyid = keys[0].split("_")[0];
        let skeyfield = keys[0].split("_")[1];
        if (skeyid !== datasetID) {
            return Promise.reject(new InsightError("In SCOMPARISON cannot query second dataset"));
        }
        if (!QueryChecker.sfields.includes(skeyfield)) {
            return Promise.reject(new InsightError("SCOMPARISON key has a non mfield"));
        }

        // Check that argument for field is a string
        if (typeof(filterArg[keys[0]]) !== "string") {
            return Promise.reject(new InsightError("SCOMPARISON value must be a string"));
        }

        // Check that string doesn't contain asterisks in middle
        let astRegex = new RegExp("^\\*?[^*]*\\*?$");
        if (!astRegex.test(filterArg[keys[0]])) {
            return Promise.reject(new InsightError("SCOMPARISON value can't have * in middle"));
        }

        return Promise.resolve();
    }

    // Returns true if is in correct form of validID_validField
    private checkKeyFormat(s: string): boolean {
        let keyregex = new RegExp("^[^_]+_(avg|pass|fail|audit|year|dept|id|instructor|title|uuid)$");
        return (keyregex.test(s));
    }

    // Returns true if is an ID to an added dataset
    private checkID(ID: string, datasetsInIF: InsightDataset[]): boolean {
        for (let dataset of datasetsInIF) {
            if (ID === dataset.id) { return true; }
        }
        return false;
    }

}
