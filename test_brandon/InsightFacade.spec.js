"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai = require("chai");
const fs = require("fs-extra");
const chaiAsPromised = require("chai-as-promised");
const IInsightFacade_1 = require("../src/controller/IInsightFacade");
const InsightFacade_1 = require("../src/controller/InsightFacade");
const IInsightFacade_2 = require("../src/controller/IInsightFacade");
const IInsightFacade_3 = require("../src/controller/IInsightFacade");
const Util_1 = require("../src/Util");
const TestUtil_1 = require("./TestUtil");
chai.use(chaiAsPromised);
describe("InsightFacade Add/Remove/List Dataset", function () {
    const datasetsToLoad = {
        courses: "./test_brandon/data/courses.zip",
        coursesfirsthalf: "./test_brandon/data/coursesfirsthalf.zip",
        coursessecondhalf: "./test_brandon/data/coursessecondhalf.zip",
        empty: "./test_brandon/data/empty.zip",
        nocoursesfolder: "./test_brandon/data/nocoursesfolder.zip",
        novalidcourse: "./test_brandon/data/novalidcourse.zip",
        onevalidnosec: "./test_brandon/data/onevalidnosec.zip",
        onevalidonesec: "./test_brandon/data/onevalidonesec.zip",
        onevalidmultsec: "./test_brandon/data/onevalidmultsec.zip",
        onevalidonenonvalid: "./test_brandon/data/onevalidonenonvalid.zip",
        notazipfile: "./test_brandon/data/notazipfile.txt"
    };
    let datasets = {};
    let insightFacade;
    const cacheDir = __dirname + "/../data";
    before(function () {
        Util_1.default.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade_1.default();
        }
        catch (err) {
            Util_1.default.error(err);
        }
    });
    it("Should add a valid dataset", function () {
        const id = "courses";
        const expected = [id];
        const futureResult = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should multiple valid datasets", function () {
        const expected = ["coursesfirsthalf", "coursessecondhalf"];
        const shouldResolve = insightFacade.addDataset(expected[0], datasets[expected[0]], IInsightFacade_1.InsightDatasetKind.Courses);
        return shouldResolve.then(function () {
            const futureResult = insightFacade.addDataset(expected[1], datasets[expected[1]], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(futureResult).to.eventually.deep.equal(expected);
        }).catch(function () {
            return chai_1.expect.fail();
        });
    });
    it("Should InsightError second same id dataset", function () {
        const id = "courses";
        const expected = [id];
        const shouldResolve = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
        return shouldResolve.then(function () {
            const shouldReject = insightFacade.addDataset(id, datasets[id], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
        }).catch(function () {
            return chai_1.expect.fail("first addDataset shouldn't have rejected");
        });
    });
    it("Same test as before but after adding another dataset", function () {
        const id1 = "coursesfirsthalf";
        const id2 = "coursessecondhalf";
        const expected = [id1, id2];
        const shouldResolve1 = insightFacade.addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldResolve2 = shouldResolve1.then(function () {
            insightFacade.addDataset(id2, datasets[id2], IInsightFacade_1.InsightDatasetKind.Courses);
        }).catch(function () {
            return chai_1.expect.fail("first addDataset shouldn't have rejected");
        });
        return shouldResolve2.then(function () {
            const shouldReject = insightFacade.addDataset(id1, datasets[id1], IInsightFacade_1.InsightDatasetKind.Courses);
            return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
        }).catch(function () {
            return chai_1.expect.fail("second addDataset shouldn't have rejected");
        });
    });
    it("Should InsightError on attempt to add text file dataset", function () {
        const expected = ["notazipfile"];
        const shouldReject = insightFacade.addDataset(expected[0], datasets[expected[0]], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to add empty courses folder", function () {
        const shouldReject = insightFacade.addDataset("empty", datasets["empty"], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to add with no courses folder", function () {
        const shouldReject = insightFacade.addDataset("nocoursesfolder", datasets["nocoursesfolder"], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to add with only invalid json course", function () {
        const shouldReject = insightFacade.addDataset("novalidcourse", datasets["novalidcourse"], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should add valid dataset, with one valid JSON course no sections", function () {
        const expected = ["onevalidnosec"];
        const shouldResolve = insightFacade.addDataset(expected[0], datasets[expected[0]], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });
    it("Should add valid dataset, with one valid JSON course one section", function () {
        const expected = ["onevalidonesec"];
        const shouldResolve = insightFacade.addDataset(expected[0], datasets[expected[0]], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });
    it("Should add valid dataset, with one valid JSON course multiple sections", function () {
        const expected = ["onevalidmultsec"];
        const shouldResolve = insightFacade.addDataset(expected[0], datasets[expected[0]], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });
    it("Should add valid dataset, skipping invalid JSON course", function () {
        const expected = ["onevalidonenonvalid"];
        const shouldResolve = insightFacade.addDataset(expected[0], datasets[expected[0]], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldResolve).to.eventually.be.deep.equal(expected);
    });
    it("Should InsightError on attempting to add empty id", function () {
        const shouldReject = insightFacade.addDataset("", datasets["courses"], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to add id with underscores", function () {
        const shouldReject = insightFacade.addDataset("invalid_id_name", datasets["courses"], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to add id with only whitespace", function () {
        const shouldReject = insightFacade.addDataset("    ", datasets["courses"], IInsightFacade_1.InsightDatasetKind.Courses);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to add a InsightDatasetKind.Rooms kind", function () {
        const datasetID = "courses";
        const shouldReject = insightFacade.addDataset(datasetID, datasets[datasetID], IInsightFacade_1.InsightDatasetKind.Rooms);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Same test as before but after good add", function () {
        const datasetID = "courses";
        const datasetID2 = "failmeplease";
        const shouldAdd = insightFacade.addDataset(datasetID, datasets[datasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldReject = shouldAdd.then(function () {
            return insightFacade.addDataset(datasetID2, datasets[datasetID], IInsightFacade_1.InsightDatasetKind.Rooms);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should remove only added dataset", function () {
        const idToDelete = "courses";
        const shouldResolve = insightFacade.addDataset(idToDelete, datasets[idToDelete], IInsightFacade_1.InsightDatasetKind.Courses);
        return shouldResolve.then(function () {
            const shouldDelete = insightFacade.removeDataset(idToDelete);
            return chai_1.expect(shouldDelete).to.eventually.be.deep.equal(idToDelete);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
    });
    it("Should remove both added datasets", function () {
        const idToDelete1 = "coursesfirsthalf";
        const idToDelete2 = "coursessecondhalf";
        const shouldAdd1 = insightFacade.addDataset(idToDelete1, datasets[idToDelete1], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldAdd2 = shouldAdd1.then(function () {
            return insightFacade.addDataset(idToDelete2, datasets[idToDelete2], IInsightFacade_1.InsightDatasetKind.Courses);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove1 = shouldAdd2.then(function () {
            return insightFacade.removeDataset(idToDelete1);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove2 = shouldRemove1.then(function () {
            chai_1.expect(shouldRemove1).to.deep.equal(idToDelete1);
            return insightFacade.removeDataset(idToDelete2);
        });
        return chai_1.expect(shouldRemove2).to.eventually.be.deep.equal(idToDelete2);
    });
    it("Should remove both added datasets opposite order deletion", function () {
        const idToDelete1 = "coursesfirsthalf";
        const idToDelete2 = "coursessecondhalf";
        const shouldAdd1 = insightFacade.addDataset(idToDelete1, datasets[idToDelete1], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldAdd2 = shouldAdd1.then(function () {
            return insightFacade.addDataset(idToDelete2, datasets[idToDelete2], IInsightFacade_1.InsightDatasetKind.Courses);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove2 = shouldAdd2.then(function () {
            return insightFacade.removeDataset(idToDelete2);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        const shouldRemove1 = shouldRemove2.then(function () {
            chai_1.expect(shouldRemove2).to.deep.equal(idToDelete2);
            return insightFacade.removeDataset(idToDelete1);
        });
        return chai_1.expect(shouldRemove1).to.eventually.be.deep.equal(idToDelete1);
    });
    it("Should NotFoundError when attempting to remove with no datasets", function () {
        const shouldReject = insightFacade.removeDataset("a");
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_3.NotFoundError);
    });
    it("Should NotFoundError, removing from no datasets, after a good removal", function () {
        const correctID = "courses";
        const shouldAdd = insightFacade.addDataset(correctID, datasets[correctID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldRemove = shouldAdd.then(function () {
            return insightFacade.removeDataset(correctID);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        const shouldReject = shouldRemove.then(function () {
            return insightFacade.removeDataset(correctID);
        }).catch(function () {
            return chai_1.expect.fail("first removeDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_3.NotFoundError);
    });
    it("Should NotFoundError when attempting to remove without matching id of anyone in", function () {
        const correctID = "courses";
        const noMatchID = "wowidontmatch";
        const shouldAdd = insightFacade.addDataset(correctID, datasets[correctID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldReject = shouldAdd.then(function () {
            return insightFacade.removeDataset(noMatchID);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_3.NotFoundError);
    });
    it("Should InsightError on attempting to remove invalid id, which is just empty str", function () {
        const badID = "";
        const shouldReject = insightFacade.removeDataset(badID);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to remove invalid id with underscores", function () {
        const badID = "waffles_waffles_";
        const shouldReject = insightFacade.removeDataset(badID);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should InsightError on attempting to remove invalid with just whitespace", function () {
        const badID = "waffles_waffles_";
        const shouldReject = insightFacade.removeDataset(badID);
        return chai_1.expect(shouldReject).to.eventually.be.rejectedWith(IInsightFacade_2.InsightError);
    });
    it("Should return empty InsightDataset[] since nothing added", function () {
        const expectation = [];
        const shouldBeEmpty = insightFacade.listDatasets();
        return chai_1.expect(shouldBeEmpty).to.eventually.be.deep.equal(expectation);
    });
    it("Should list single known InsightDataset since only one added", function () {
        const singleDatasetID = "onevalidonesec";
        const singleDataset = {
            id: singleDatasetID,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation = [singleDataset];
        const shouldAdd = insightFacade.addDataset(singleDatasetID, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldHaveOne = shouldAdd.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldHaveOne).to.eventually.be.deep.equal(expectation);
    });
    it("Should list 2 known InsightDatasets since only 2 added", function () {
        const singleDatasetID = "onevalidonesec";
        const datasetID1 = "onevalidonesec1";
        const datasetID2 = "onevalidonesec2";
        const dataset1 = {
            id: datasetID1,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 1
        };
        const dataset2 = {
            id: datasetID2,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation = [dataset1, dataset2];
        const shouldAdd1 = insightFacade.addDataset(datasetID1, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldAdd2 = shouldAdd1.then(function () {
            return insightFacade.addDataset(datasetID2, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        }).catch(function () {
            return chai_1.expect.fail("first addDataset shouldn't have rejected");
        });
        const shouldHaveTwo = shouldAdd2.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return chai_1.expect.fail("second addDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldHaveTwo).to.eventually.be.deep.equal(expectation);
    });
    it("Should list 0 InsightDatasets since removed the only one", function () {
        const singleDatasetID = "onevalidonesec";
        const expectation = [];
        const shouldAdd = insightFacade.addDataset(singleDatasetID, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldRemove = shouldAdd.then(function () {
            return insightFacade.removeDataset(singleDatasetID);
        }).catch(function () {
            return chai_1.expect.fail("addDataset shouldn't have rejected");
        });
        const shouldBeEmpty = shouldRemove.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return chai_1.expect.fail("removeDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldBeEmpty).to.eventually.be.deep.equal(expectation);
    });
    it("Should list 1 known InsightDatasets since only 2 added but 1 removed", function () {
        const singleDatasetID = "onevalidonesec";
        const datasetID1 = "onevalidonesec1";
        const datasetID2 = "onevalidonesec2";
        const dataset1 = {
            id: datasetID1,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 1
        };
        const dataset2 = {
            id: datasetID2,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation = [dataset1];
        const shouldAdd1 = insightFacade.addDataset(datasetID1, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldAdd2 = shouldAdd1.then(function () {
            return insightFacade.addDataset(datasetID2, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        }).catch(function () {
            return chai_1.expect.fail("first addDataset shouldn't have rejected");
        });
        const shouldRemove = shouldAdd2.then(function () {
            return insightFacade.removeDataset(datasetID2);
        }).catch(function () {
            return chai_1.expect.fail("second addDataset shouldn't have rejected");
        });
        const shouldHaveOne = shouldRemove.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return chai_1.expect.fail("removeDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldHaveOne).to.eventually.be.deep.equal(expectation);
    });
    it("Same test as before but removing 1st dataset instead", function () {
        const singleDatasetID = "onevalidonesec";
        const datasetID1 = "onevalidonesec1";
        const datasetID2 = "onevalidonesec2";
        const dataset1 = {
            id: datasetID1,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 1
        };
        const dataset2 = {
            id: datasetID2,
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 1
        };
        const expectation = [dataset2];
        const shouldAdd1 = insightFacade.addDataset(datasetID1, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        const shouldAdd2 = shouldAdd1.then(function () {
            return insightFacade.addDataset(datasetID2, datasets[singleDatasetID], IInsightFacade_1.InsightDatasetKind.Courses);
        }).catch(function () {
            return chai_1.expect.fail("first addDataset shouldn't have rejected");
        });
        const shouldRemove = shouldAdd2.then(function () {
            return insightFacade.removeDataset(datasetID1);
        }).catch(function () {
            return chai_1.expect.fail("second addDataset shouldn't have rejected");
        });
        const shouldHaveOne = shouldRemove.then(function () {
            return insightFacade.listDatasets();
        }).catch(function () {
            return chai_1.expect.fail("removeDataset shouldn't have rejected");
        });
        return chai_1.expect(shouldHaveOne).to.eventually.be.deep.equal(expectation);
    });
});
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery = {
        courses: {
            path: "./test_brandon/data/courses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
        othercourses: {
            path: "./test_brandon/data/courses.zip",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
        },
    };
    let insightFacade;
    let testQueries = [];
    before(function () {
        Util_1.default.test(`Before: ${this.test.parent.title}`);
        try {
            testQueries = TestUtil_1.default.readTestQueries();
        }
        catch (err) {
            chai_1.expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }
        const loadDatasetPromises = [];
        insightFacade = new InsightFacade_1.default();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });
    beforeEach(function () {
        Util_1.default.test(`BeforeTest: ${this.currentTest.title}`);
    });
    after(function () {
        Util_1.default.test(`After: ${this.test.parent.title}`);
    });
    afterEach(function () {
        Util_1.default.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult = insightFacade.performQuery(test.query);
                    return TestUtil_1.default.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map