import React from 'react';
import { INestNode } from './inteface';
import { IField } from '../../interfaces';
export interface TreeProps {
    data: INestNode;
    dimsInRow: IField[];
    measInRow: IField[];
    onHeaderCollapse: (node: INestNode) => void;
    enableCollapse: boolean;
    displayOffset?: number;
}
declare const LeftTree: React.FC<TreeProps>;
export default LeftTree;
