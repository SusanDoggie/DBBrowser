import _ from 'lodash';
import React from 'react';
import { View, Text } from 'react-native';
import ReactDataSheet from 'react-datasheet';
import { v4 as uuidv4 } from 'uuid';
import { Binary, UUID, EJSON } from 'bson';
import Entypo from 'react-native-vector-icons/dist/Entypo';
import { ResizableBox } from 'react-resizable';
import storage from '../../utils/storage';

import Button from '../../components/Button';
import JsonCode from './JsonCode';

class ValueViewer extends React.PureComponent {

  render() {
    
    const { value } = this.props.value;
    
    if (_.isNull(value)) {
      return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }} numberOfLines={1}>(null)</Text>;
    }
    
    if (_.isUndefined(value)) {
      return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }} numberOfLines={1}>(undefined)</Text>;
    }
    
    if (_.isBoolean(value)) {
      return <Text style={{ color: 'darkblue', fontFamily: 'monospace' }} numberOfLines={1}>{value}</Text>;
    }
    
    if (_.isNumber(value)) {
      return <Text style={{ color: 'mediumblue', fontFamily: 'monospace' }} numberOfLines={1}>{value}</Text>;
    }
    
    if (_.isDate(value)) {
      return <Text style={{ color: 'darkslateblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.toLocaleString('en', { timeZoneName: 'short' })}</Text>;
    }

    if (_.isString(value)) {
      return <Text style={{ color: 'darkred', fontFamily: 'monospace' }} numberOfLines={1}>{EJSON.stringify(value)}</Text>;
    }

    switch (value._bsontype) {

      case 'Binary':

      switch (value.sub_type) {

        case Binary.SUBTYPE_UUID:

          let uuid = new UUID(value.buffer);
          return <Text style={{ color: 'darkblue', fontFamily: 'monospace' }} numberOfLines={1}>{uuid.toHexString(true)}</Text>;

        case Binary.SUBTYPE_MD5:

          return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>MD5(<Text style={{ color: 'darkred' }}>"{value.buffer.toString('hex')}"</Text>)</Text>;
  
        default: return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }} numberOfLines={1}>({value.length()} bytes)</Text>;
      }

      case 'BSONRegExp':

        return <Text style={{ color: 'darkred', fontFamily: 'monospace' }} numberOfLines={1}>/{value.pattern}/{value.options}</Text>;

      case 'Symbol':

        return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>Symbol(<Text style={{ color: 'darkred' }}>{JSON.stringify(value.valueOf())}</Text>)</Text>;

      case 'Double':
      case 'Int32':

        return <Text style={{ color: 'mediumblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.valueOf()}</Text>;

      case 'Decimal128':
      case 'Long':

        return <Text style={{ color: 'mediumblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.toString()}</Text>;

      case 'MaxKey':

        return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>MaxKey</Text>;

      case 'MinKey':

        return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>MinKey</Text>;

      case 'ObjectId':
      case 'ObjectID':

        return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>ObjectId(<Text style={{ color: 'darkred' }}>"{value.toHexString()}"</Text>)</Text>;

      case 'UUID':

        return <Text style={{ color: 'darkblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.toHexString(true)}</Text>;

      default: return <Text style={{ fontFamily: 'monospace' }} numberOfLines={1}>{EJSON.stringify(value)}</Text>;
    }
  }
}

class DataSheetHeader extends React.PureComponent {

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

  render() {
    return <thead key={`thead-${this.state.token}`} style={{
      position: 'sticky',
      tableLayout: 'fixed',
      top: 0,
      zIndex: 100,
    }}>
      <tr key={`tr-${this.state.token}`} style={{ backgroundColor: '#FAFAFA' }}>
        <th />
        {this.props.columns.map((col, i) => <th key={`${this.state.token}-col-${i}`} style={{ position: 'relative' }}>
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
              onResize={(e, {size}) => this.updateColumnSetting({ ...this.state.columnSetting, [col]: { width: size.width } })}>
              <View style={{ flexDirection: 'row', padding: 4, paddingRight: 32, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'monospace' }} numberOfLines={1}>{col}</Text>
              </View>
            </ResizableBox>
          </th>)}
        </tr>
    </thead>;
  }
}

class DataSheet extends React.PureComponent {

  render() {
    return <ReactDataSheet
      data={this.props.data}
      sheetRenderer={props => <table 
        className={props.className}>
          <DataSheetHeader {...this.props} />
          <tbody style={{
            backgroundColor: 'white',
          }}>
            {props.children}
          </tbody>
        </table>}
      rowRenderer={props => <tr 
        className={props.className} 
        style={{ backgroundColor: props.row % 2 == 0 ? 'white' : '#FAFAFA' }}>
        <td style={{ padding: 4, overflow: 'hidden' }}>
          <Text style={{ fontFamily: 'monospace' }}>{props.row+1}</Text>
        </td>
        {props.children}
      </tr>}
      cellRenderer={(props) => <td 
        className={props.className} 
        onMouseDown={props.onMouseDown}
        onMouseOver={props.onMouseOver}
        onDoubleClick={props.onDoubleClick}
        onContextMenu={props.onContextMenu}
        style={{ position: 'relative', padding: 4 }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center' }}>
          {props.children}
        </View>
      </td>}
      valueViewer={(props) => <ValueViewer {...props} />}
      valueRenderer={x => x} />;
  }
}

export default class ResultTable extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
			token: uuidv4(),
      style: 'table',
    };
  }

  renderBody() {
    
    if (!_.isArray(this.props.data)) {
      return <JsonCode key={`jsoncode-${this.state.token}`} value={this.props.data} space={4} />;
    }

    switch (this.state.style) {

      case 'table':

        const { 
          columnSettingKey,
        } = this.props;
        
        const columns = this.props.data.reduce((result, x) => _.uniq(result.concat(Object.keys(x))), []);
        const grid = this.props.data.map(x => columns.map(c => { return { value: x[c] } }));

        return <DataSheet key={`datasheet-${this.state.token}`} data={grid} columns={columns} columnSettingKey={columnSettingKey} />;

      case 'raw':
        return <JsonCode key={`jsoncode-${this.state.token}`} value={this.props.data} space={4} />;
    }
  }

  render() {
    
    const { 
      data,
      columnSetting,
      onColumnChanged,
      ...props
    } = this.props;
    
    return <View {...props}>
    <View style={{ 
      padding: 4,
      flexDirection: 'row', 
      background: '#2F4F4F',
      alignItems: 'stretch',
    }}>
      {_.isArray(this.props.data) && <Button 
        icon='FontAwesome' 
        iconStyle={{ 
          name: 'table',
          size: 18,
        }} 
        style={{
          padding: 0,
          borderRadius: null,
          backgroundColor: null,
          marginHorizontal: 4,
          aspectRatio: 1,
        }}
        onPress={() => this.setState({ style: 'table' })} />}
      <Button
        icon='MaterialCommunityIcons' 
        iconStyle={{ 
          name: 'code-json',
          size: 18,
        }} 
        style={{
          padding: 0,
          borderRadius: null,
          backgroundColor: null,
          marginHorizontal: 4,
          aspectRatio: 1,
        }}
        onPress={() => this.setState({ style: 'raw' })} />
    </View>
    <div style={{ flex: 1, overflow: 'scroll' }}>
      {this.renderBody()}
    </div>
    </View>;
  }
}