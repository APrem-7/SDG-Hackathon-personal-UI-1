import { IRow } from '../../interfaces';
import { INestNode } from './inteface';
export declare function buildNestTree(layerKeys: string[], data: IRow[], collapsedKeyList: string[], showSummary: boolean, sort?: {
    fid: string;
    type: 'ascending' | 'descending';
}, dataWithoutSort?: IRow[]): INestNode;
export declare function buildMetricTableFromNestTree(leftTree: INestNode, topTree: INestNode, data: IRow[]): (IRow | null)[][];
export declare function getAllChildrenSize(node: INestNode, depth: number): number;
