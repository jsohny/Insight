import { InsightError } from "./IInsightFacade";
import {
    InsightDataset,
    InsightDatasetKind,
} from "./IInsightFacade";
import { Course } from "./Course";
import * as JSZip from "jszip";
import { rejects } from "assert";

export default class Datasets {
    private datasetList: InsightDataset[] = [];
    private coursesByDatasetID: { [id: string]: Course[] } = {};

    public insertDataset(idToAdd: string, content: string, kind: InsightDatasetKind): Promise<void> {
        let coursesZip: JSZip = new JSZip();

        return coursesZip.loadAsync(content, {base64: true}).then((zip: JSZip) => {
            // need to change implemtentation for rooms
            if (kind === InsightDatasetKind.Courses && zip.folder(/courses/).length <= 0) {
                return Promise.reject(new InsightError("courses folder doesn't exist in zip file"));
            }

            if (!this.checkExists(idToAdd)) {
                if (kind === InsightDatasetKind.Courses) {

                    // numRows
                    let rowCount: number = 0;

                    // add course objects
                    let newCourseArr: Course[] = [];

                    // store the asynchronous data loaded from each file
                    let promises: Array<Promise<any>> = [];
                    zip.folder("courses").forEach(function (relativePath, file) {
                        promises.push(zip.file(file.name).async("string"));
                    });

                    // resolve the pending promise array to get an array containing contents of each file
                    Promise.all(promises).then(function (array) {
                        // iterate over each file in the dataset
                        for (let json of array) {
                            // if file is valid json, parse it and create a new course section
                            try {
                                let obj = JSON.parse(json);
                                for (let elt of obj.result) {
                                    let newSection = {
                                        avg: elt.Avg,
                                        pass: elt.Pass,
                                        fail: elt.Fail,
                                        audit: elt.Audit,
                                        year: elt.Courses === "overall" ? 1900 : elt.Year,
                                        dept: elt.Subject,
                                        id: elt.Course,
                                        instructor: elt.Professor,
                                        title: elt.Title,
                                        uuid: elt.id,
                                    };
                                    newCourseArr.push(newSection);
                                    rowCount += obj.result.length;
                                }
                            } catch (e) {
                                continue;
                            }
                        }

                        if (rowCount < 1) {
                            // zero valid course sections, so reject insertion of this dataset.
                            return Promise.reject();
                        }

                        // create the new dataset
                        let datasetToAdd: InsightDataset = {
                            id: idToAdd,
                            kind: InsightDatasetKind.Courses,
                            numRows: rowCount,
                        };

                        // push the created dataset to the list of datasets
                        this.datasetList.push(datasetToAdd);

                        // save the courses data
                        this.coursesByDatasetID[idToAdd] = newCourseArr;

                        // i want to return out of this entire function and resolve but
                        // its going to the catch statement below instead
                        return Promise.resolve();

                    }).catch(() => {
                        // WHY IS promise.all REJECTING

                        /* eslint-disable no-console */
                        console.log("dang");
                        /* eslint-enable no-console */
                    });

                } else {
                    // change below code for rooms datasets
                    return Promise.reject();
                }
            } else {
                // id already exists in dataset, use a different id
                return Promise.reject();
            }
        }).catch(() => {
            // load Async function for zip file rejected for some reason
            return Promise.reject(new InsightError("error loading zip"));
        });
    }

    public getAllDatasetIDs (): string[] {
        let arr: string[] = [];
        for (let elt of this.datasetList) {
            arr.push(elt.id);
        }
        return arr;
    }

    public remove(idToRemove: string): Promise<void> {
        if (!this.checkExists(idToRemove)) {
            return Promise.reject();
        }
        for (let elt of this.datasetList) {
            if (idToRemove === elt.id) {
                this.datasetList.splice(this.datasetList.indexOf(elt), 1);
                break;
            }
        }
        return Promise.resolve();
    }

    public listAllDatasets (): InsightDataset[] {
        return this.datasetList;
    }

    private checkExists(idToAdd: string): boolean {
        for (let elt of this.datasetList) {
            if (idToAdd === elt.id) {
                return true;
            }
        }
        return false;
    }
}
