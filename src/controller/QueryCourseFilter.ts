import { Course } from "./Course";

export default class QueryCourseFilter {

    // Given an array of courses and a query, filter out courses
    // TODO change to arr of course
    public FilterCourseArray(courseArr: Course[], query: any): Course[] {
        let retArr: Course[] = [];
        for (let c of courseArr) {
            if (this.matchesQuery(c, query)) {
                retArr.push(c);
            }
        }
        return retArr;
    }

    private matchesQuery(c: Course, query: any): boolean {
        return null;
    }

    private mCOMPARISON(c: Course, comparison: string, field: string, value: number): boolean {
        let mkey = field.split("_")[1];
        let courseval;
        // Load course value
        if (mkey === "avg") {
            courseval = c.avg;
        } else if (mkey === "pass") {
            courseval = c.pass;
        } else if (mkey === "fail") {
            courseval = c.fail;
        } else if (mkey === "audit") {
            courseval = c.audit;
        } else if (mkey === "year") {
            courseval = c.year;
        }

        // Compare with corresponding operator to value
        if (comparison === "EQ") {
            return (courseval === value);
        } else if (comparison === "LT") {
            return (courseval < value);
        } else { // Implicit GT can't be anything else
            return (courseval > value);
        }
    }

    private ISCOMPARISON(c: Course, field: string, value: string): boolean {
        // let re = new RegExp();
        return null;
    }

    private ANDOR(): boolean {
        return null;
    }

}
