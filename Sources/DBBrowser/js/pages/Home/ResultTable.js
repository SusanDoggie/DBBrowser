import _ from 'lodash';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import ReactDataSheet from 'react-datasheet';
import { v4 as uuidv4 } from 'uuid';
import { EJSON } from 'bson';

import Button from '../../components/Button';
import JsonCode from './JsonCode';

class ValueViewer extends React.PureComponent {

  renderValue() {
    
    const { value } = this.props.value;
    
    if (_.isNull(value)) {
      return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }}>(null)</Text>;
    }
    
    if (_.isUndefined(value)) {
      return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }}>(undefined)</Text>;
    }
    
    if (_.isBoolean(value)) {
      return <Text style={{ color: 'darkblue', fontFamily: 'monospace' }}>{value}</Text>;
    }
    
    if (_.isNumber(value)) {
      return <Text style={{ color: 'mediumblue', fontFamily: 'monospace' }}>{value}</Text>;
    }
    
    if (_.isString(value)) {
      return <Text style={{ maxWidth: 96, color: 'darkred', fontFamily: 'monospace' }} ellipsizeMode='tail' numberOfLines={1}>{EJSON.stringify(value)}</Text>;
    }
    
    return <Text style={{ maxWidth: 96, fontFamily: 'monospace' }} ellipsizeMode='tail' numberOfLines={1}>{EJSON.stringify(value)}</Text>;
  }

  render() {
    return <View style={{ padding: 4 }}>{this.renderValue()}</View>;
  }
}

class DataSheet extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      token: uuidv4(),
    };
  }

  render() {
    return <ReactDataSheet
      data={this.props.data}
      sheetRenderer={props => <table className={props.className}>
            <thead style={{
              position: 'sticky',
              top: 0,
            }}>
                <tr style={{ backgroundColor: 'snow' }}>
                  <th />
                  {this.props.columns.map((col, i) => <th key={`${this.state.token}-col-${i}`} style={{ padding: 4 }}>
                    <Text>{col}</Text>
                    </th>)}
                </tr>
            </thead>
            <tbody style={{
              backgroundColor: 'white',
            }}>
                {props.children}
            </tbody>
        </table>}
      rowRenderer={props => (
        <tr style={{ backgroundColor: props.row % 2 == 0 ? 'white' : 'snow' }}>
            <td style={{ padding: 4 }}><Text>{props.row+1}</Text></td>
            {props.children}
        </tr>
      )}
      valueViewer={ValueViewer}
      valueRenderer={x => x} />;
  }
}

export default class ResultTable extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      style: 'table',
    };
  }

  renderBody() {
    
    if (!_.isArray(this.props.data)) {
      return <JsonCode value={this.props.data} space={4} />;
    }

    switch (this.state.style) {

      case 'table':

        const columns = this.props.data.reduce((result, x) => _.uniq(result.concat(Object.keys(x))), []);
        const grid = this.props.data.map(x => columns.map(c => { return { value: x[c] } }));

        return <DataSheet data={grid} columns={columns} />;

      case 'raw':
        return <JsonCode value={this.props.data} space={4} />;
    }
  }

  render() {
    
    const { 
      data, 
      ...props
    } = this.props;
    
    return <View {...props}>
    <View style={{ 
      padding: 4,
      flexDirection: 'row', 
      background: '#2F4F4F',
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
        }}
        onPress={() => this.setState({ style: 'raw' })} />
    </View>
    <div style={{ flex: 1, overflow: 'scroll' }}>
      {this.renderBody()}
    </div>
    </View>;
  }
}