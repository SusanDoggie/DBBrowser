//
//  ResultTable.js
//
//  The MIT License
//  Copyright (c) 2015 - 2021 Susan Cheng. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

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