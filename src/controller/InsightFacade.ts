import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
} from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import QueryChecker from "./QueryChecker";
import Datasets from "./Datasets";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 */
export default class InsightFacade implements IInsightFacade {
    private queryChecker = new QueryChecker();
    private dataSet = new Datasets();

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (id === "") {
                return reject(new InsightError("Empty ID string - invalid ID"));
            }
            if (/^\s+$/.test(id)) {
                return reject(new InsightError("ID only contains whitespace - invalid ID"));
            }
            if (id.includes("_")) {
                return reject(new InsightError("ID contains underscore - invalid ID"));
            }

            return this.dataSet.insertDataset(id, content, kind).then(() => {
                return resolve(this.dataSet.getAllDatasetIDs());
            }).catch(() => {
                return reject(new InsightError("insertDatasetRejected"));
            });
        });
    }
    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (id === "") {
                return reject(new InsightError("Empty ID string - invalid ID"));
            }
            if (/^\s+$/.test(id)) {
                return reject(new InsightError("ID only contains whitespace - invalid ID"));
            }
            if (id.includes("_")) {
                return reject(new InsightError("ID contains underscore - invalid ID"));
            }
            return this.dataSet.remove(id).then(() => {
                /* eslint-disable no-console */
                console.log("why am i here");
                /* eslint-enable no-console */
                return resolve(id);
            }).catch(() => {
                /* eslint-disable no-console */
                console.log("i wanna be here");
                /* eslint-enable no-console */
                return reject(new NotFoundError());
            });
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.resolve(this.dataSet.listAllDatasets());
    }

    public performQuery(query: any): Promise<any[]> {

        // Check all parts of query will work
        let checkValid: Promise<void> = this.listDatasets().then((result) => {
            return this.queryChecker.checkQueryValidity(query, result);
        });
        return checkValid.then(() => {
            return Promise.reject("Not implemented.");
        }).catch((result) => {
            return Promise.reject(result);
        });

        // Retrieve an array of courses for this dataset

        // Filter dataset

        // Extract COLUMNS

        // Order Courses

        // return array of courses
    }
}
