import { buildMetricTableFromNestTree, buildNestTree } from '../components/pivotTable/utils';
const getFirsts = (item) => {
    if (item.children.length > 0) {
        return [item, ...getFirsts(item.children[0])];
    }
    return [item];
};
export function buildPivotTable(dimsInRow, dimsInColumn, allData, aggData, collapsedKeyList, showTableSummary, sort) {
    let lt;
    let tt;
    if (sort?.mode === 'row') {
        tt = buildNestTree(dimsInColumn.map((d) => d.fid), allData, collapsedKeyList, showTableSummary);
        if (dimsInColumn.length > 0) {
            const ks = dimsInColumn.map((x) => x.fid);
            const vs = getFirsts(tt.children[0]).map((x) => x.value);
            // move data of First column to first
            const mentioned = [];
            const rest = [];
            allData.forEach((x) => (ks.every((k, i) => x[k] === vs[i]) ? mentioned.push(x) : rest.push(x)));
            lt = buildNestTree(dimsInRow.map((d) => d.fid), mentioned, collapsedKeyList, showTableSummary, sort, rest);
        }
        else {
            lt = buildNestTree(dimsInRow.map((d) => d.fid), allData, collapsedKeyList, showTableSummary, sort);
        }
    }
    else {
        lt = buildNestTree(dimsInRow.map((d) => d.fid), allData, collapsedKeyList, showTableSummary);
        if (sort && dimsInRow.length > 0) {
            const ks = dimsInRow.map((x) => x.fid);
            const vs = getFirsts(lt.children[0]).map((x) => x.value);
            // move data of First row to first
            const mentioned = [];
            const rest = [];
            allData.forEach((x) => (ks.every((k, i) => x[k] === vs[i]) ? mentioned.push(x) : rest.push(x)));
            tt = buildNestTree(dimsInColumn.map((d) => d.fid), mentioned, collapsedKeyList, showTableSummary, sort, rest);
        }
        else {
            tt = buildNestTree(dimsInColumn.map((d) => d.fid), allData, collapsedKeyList, showTableSummary, sort);
        }
    }
    const metric = buildMetricTableFromNestTree(lt, tt, [...allData, ...aggData]);
    return { lt, tt, metric };
}
//# sourceMappingURL=buildPivotTable.js.map