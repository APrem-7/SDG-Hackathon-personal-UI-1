import { BarsArrowDownIcon, BarsArrowUpIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNT_FIELD_ID, MEA_KEY_ID, MEA_VAL_ID } from '../../constants';
import { useVizStore } from '../../store';
import { Pill } from '../components';
import { GLOBAL_CONFIG } from '../../config';
import DropdownContext from '../../components/dropdownContext';
import SelectContext from '../../components/selectContext';
import { refMapper } from '../fieldsContext';
const OBPill = (props) => {
    const { provided, dkey, fIndex } = props;
    const vizStore = useVizStore();
    const { config, allFields } = vizStore;
    const field = vizStore.allEncodings[dkey.id][fIndex];
    const { t } = useTranslation('translation', { keyPrefix: 'constant.aggregator' });
    const aggregationOptions = useMemo(() => {
        return GLOBAL_CONFIG.AGGREGATOR_LIST.map((op) => ({
            value: op,
            label: t(op),
        }));
    }, []);
    const foldOptions = useMemo(() => {
        const validFoldBy = allFields.filter((f) => f.analyticType === 'measure' && f.fid !== MEA_VAL_ID);
        return validFoldBy.map((f) => ({
            key: f.fid,
            label: f.name,
        }));
    }, [allFields]);
    const folds = field.fid === MEA_KEY_ID ? config.folds ?? [] : null;
    return (React.createElement(Pill, { ref: refMapper(provided.innerRef), colType: field.analyticType === 'dimension' ? 'discrete' : 'continuous', className: `${field.aggName === 'expr' && !config.defaultAggregated ? '!opacity-50 touch-none' : 'touch-none'}`, ...provided.draggableProps, ...provided.dragHandleProps },
        folds && (React.createElement(SelectContext, { options: foldOptions, selectedKeys: folds, onSelect: (keys) => {
                vizStore.setVisualConfig('folds', keys);
            } },
            React.createElement("span", { className: "flex-1 truncate" }, field.name))),
        !folds && React.createElement("span", { className: "flex-1 truncate" }, field.name),
        "\u00A0",
        field.analyticType === 'measure' && field.fid !== COUNT_FIELD_ID && config.defaultAggregated && field.aggName !== 'expr' && (React.createElement(DropdownContext, { options: aggregationOptions, onSelect: (value) => {
                vizStore.setFieldAggregator(dkey.id, fIndex, value);
            } },
            React.createElement("span", { className: "bg-transparent float-right focus:outline-none focus: dark:focus: flex items-center ml-2" },
                field.aggName || '',
                React.createElement(ChevronUpDownIcon, { className: "w-3" })))),
        field.analyticType === 'dimension' && field.sort === 'ascending' && (React.createElement(BarsArrowUpIcon, { className: "float-right w-3", role: "status", "aria-label": "Sorted in ascending order" })),
        field.analyticType === 'dimension' && field.sort === 'descending' && (React.createElement(BarsArrowDownIcon, { className: "float-right w-3", role: "status", "aria-label": "Sorted in descending order" }))));
};
export default observer(OBPill);
//# sourceMappingURL=obPill.js.map