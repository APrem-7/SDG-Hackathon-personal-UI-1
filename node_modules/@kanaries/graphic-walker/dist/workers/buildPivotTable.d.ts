import { INestNode } from '../components/pivotTable/inteface';
import { IViewField, IRow } from '../interfaces';
export declare function buildPivotTable(dimsInRow: IViewField[], dimsInColumn: IViewField[], allData: IRow[], aggData: IRow[], collapsedKeyList: string[], showTableSummary: boolean, sort?: {
    fid: string;
    type: 'ascending' | 'descending';
    mode: 'row' | 'column';
}): {
    lt: INestNode;
    tt: INestNode;
    metric: (IRow | null)[][];
};
