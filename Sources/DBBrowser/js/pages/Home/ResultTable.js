import _ from 'lodash';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

import JsonCode from './JsonCode';
import DataSheet from '../../components/DataSheet';

function ResultTable({ data, displayStyle, tableInfo, columnSettingKey, sortedBy, onSortPressed, handleDeleteRows, handleDeleteCells, handlePasteRows, handlePasteCells, ...props }, ref) {

  const datasheet = useRef();

  useImperativeHandle(ref, () => ({
    clearSelection: () => { datasheet.current?.clearSelection() }
  }));

  return <View {...props}>
    <div style={{ flex: 1, overflow: 'scroll' }}>
      {(() => {
    
        if (!_.isArray(data)) {
          return <JsonCode value={data} space={4} />;
        }

        switch (displayStyle) {

          case 'table':

            const columns = data.reduce((result, x) => _.uniq(result.concat(Object.keys(x))), []);
            const grid = data.map(x => columns.map(c => x[c]));

            return <DataSheet
              ref={datasheet}
              data={grid} 
              tableInfo={tableInfo}
              columns={columns}
              columnSettingKey={columnSettingKey}
              sortedBy={sortedBy}
              onSortPressed={onSortPressed}
              handleDeleteRows={(rows) => handleDeleteRows && handleDeleteRows(rows, columns)}
              handleDeleteCells={(cells) => handleDeleteCells && handleDeleteCells(cells, columns)}
              handlePasteRows={(rows) => handlePasteRows && handlePasteRows(rows, columns)}
              handlePasteCells={(cells) => handlePasteCells && handlePasteCells(cells, columns)} />;

          case 'raw':
            return <JsonCode value={data} space={4} />;
        }
      })()}
    </div>
  </View>;
}

export default forwardRef(ResultTable);