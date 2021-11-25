//
//  DataSheetHeader.js
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
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AntDesign from 'react-native-vector-icons/dist/AntDesign';
import Entypo from 'react-native-vector-icons/dist/Entypo';
import { ResizableBox } from 'react-resizable';
import storage from '../../utils/storage';

export default function DataSheetHeader({ columns, tableInfo, sortedBy, onSortPressed, columnSettingKey }) {

  const [columnSetting, setColumnSetting] = useState(storage.getItem('columnSetting') ?? {});

  function updateColumnSetting(setting) {

    const columnSetting = storage.getItem('columnSetting') ?? {};
    columnSetting[columnSettingKey] = setting;
    storage.setItem('columnSetting', columnSetting);

    setColumnSetting(setting);
  }

  return <thead style={{
    position: 'sticky',
    tableLayout: 'fixed',
    top: 0,
    zIndex: 100,
  }}>
    <tr style={{ backgroundColor: '#F6F8FF' }}>
      <th />
      {columns.map((col, i) => {

        const { primaryKey, columns: columnInfos } = tableInfo ?? {};

        const columnInfo = _.isArray(columnInfos) ? columnInfos.find(x => x.name == col) : null;
        const _columnInfo = !_.isNil(columnInfo) && <Text style={{ color: 'lightgray', fontSize: 12 }}> {columnInfo.isOptional ? 'Optional<' : ''}{columnInfo.type}{columnInfo.isOptional ? '>' : ''}</Text>;

        const _key = _.isArray(primaryKey) && primaryKey.includes(col) && <Text><Entypo name='key' color='#B4B43C' /> </Text>;

        const _sortedBy = _.isArray(sortedBy) ? sortedBy.find(x => x.column == col) : null;

        return <th
          style={{
            padding: 0,
            position: 'relative', 
            border: 1, 
            borderStyle: 'solid',
            borderColor: '#DDD',
          }}>
            <ResizableBox
              axis='x'
              handle={(handleAxis, ref) => <div 
                ref={ref} 
                style={{ 
                  display: 'flex',
                  position: 'absolute',
                  alignItems: 'center',
                  right: 0, 
                  top: 0, 
                  bottom: 0,
                }}>
                  <Entypo name='dots-three-vertical' color='gray' />
                </div>}
              resizeHandles={['e']}
              width={columnSetting[col]?.width ?? 96}
              height={24}
              onResize={(e, {size}) => updateColumnSetting({ ...columnSetting, [col]: { width: size.width } })}>
              <Pressable onPress={() => onSortPressed && onSortPressed(col, _sortedBy?.isAscending != true)}>
                <View style={{ flexDirection: 'row', padding: 4, paddingRight: 16, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'monospace' }} numberOfLines={1}>{_key}{col}{_columnInfo}</Text>
                  {_sortedBy?.isAscending == true && <AntDesign name='caretup' style={{ marginLeft: 4 }} />}
                  {_sortedBy?.isAscending == false && <AntDesign name='caretdown' style={{ marginLeft: 4 }} />}
                </View>
              </Pressable>
            </ResizableBox>
          </th>;
      })}
      </tr>
  </thead>;
}
