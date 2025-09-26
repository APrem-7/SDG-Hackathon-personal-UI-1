import React from 'react';
import { IField } from '../../interfaces';
interface MetricTableProps {
    matrix: any[][];
    meaInRows: IField[];
    meaInColumns: IField[];
    numberFormat: string;
}
declare const MetricTable: React.FC<MetricTableProps>;
export default MetricTable;
