import _ from 'lodash';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import AntDesign from 'react-native-vector-icons/dist/AntDesign';
import Entypo from 'react-native-vector-icons/dist/Entypo';
import { ResizableBox } from 'react-resizable';
import storage from '../../utils/storage';

export default class DataSheetHeader extends React.PureComponent {

  constructor(props) {
    super(props);

    const columnSetting = storage.getItem('columnSetting') ?? {};

    this.state = {
      token: uuidv4(),
      columnSetting: columnSetting[props.columnSettingKey] ?? {},
    };
  }

  updateColumnSetting(setting) {

    const columnSetting = storage.getItem('columnSetting') ?? {};
    columnSetting[this.props.columnSettingKey] = setting;
    storage.setItem('columnSetting', columnSetting);

    this.setState({ columnSetting: setting });
  }

  renderHeaderCell(col, i) {

    const { tableInfo, sortedBy, onSortPressed } = this.props;
    const { primaryKey, columns: columnInfos } = tableInfo ?? {};

    const columnInfo = _.isArray(columnInfos) ? columnInfos.find(x => x.name == col) : null;
    const _columnInfo = !_.isNil(columnInfo) && <Text style={{ color: 'lightgray', fontSize: 12 }}> {columnInfo.isOptional ? 'Optional<' : ''}{columnInfo.type}{columnInfo.isOptional ? '>' : ''}</Text>;

    const _key = _.isArray(primaryKey) && primaryKey.includes(col) && <Text><Entypo name='key' color='#B4B43C' /> </Text>;

    const _sortedBy = _.isArray(sortedBy) ? sortedBy.find(x => x.column == col) : null;

    return <th 
      key={`${this.state.token}-col-header-${i}`} 
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
          width={this.state.columnSetting[col]?.width ?? 96}
          height={24}
          onResize={(e, {size}) => this.updateColumnSetting({ ...this.state.columnSetting, [col]: { width: size.width } })}>
          <Pressable onPress={() => onSortPressed && onSortPressed(col, _sortedBy?.isAscending != true)}>
            <View style={{ flexDirection: 'row', padding: 4, paddingRight: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'monospace' }} numberOfLines={1}>{_key}{col}{_columnInfo}</Text>
              {_sortedBy?.isAscending == true && <AntDesign name='caretup' style={{ marginLeft: 4 }} />}
              {_sortedBy?.isAscending == false && <AntDesign name='caretdown' style={{ marginLeft: 4 }} />}
            </View>
          </Pressable>
        </ResizableBox>
      </th>;
  }

  render() {
    return <thead style={{
      position: 'sticky',
      tableLayout: 'fixed',
      top: 0,
      zIndex: 100,
    }}>
      <tr style={{ backgroundColor: '#F6F8FF' }}>
        <th />
        {this.props.columns.map((col, i) => this.renderHeaderCell(col, i))}
        </tr>
    </thead>;
  }
}
