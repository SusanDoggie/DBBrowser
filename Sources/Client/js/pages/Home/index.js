//
//  index.js
//
//  The MIT License
//  Copyright (c) 2015 - 2022 Susan Cheng. All rights reserved.
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
import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { withRouter } from 'react-router';
import { EJSON } from 'bson';
import { URL } from 'url';
import { saveAs } from 'file-saver';

import { Parser as SQLParser } from 'node-sql-parser';

import Resizable from '../../components/Resizable';
import CodeMirror from 'doggie-react-ui/CodeMirror';
import Button from '../../components/Button';
import SideMenu from './SideMenu';
import LoginPanel from './LoginPanel';
import ResultTable from './ResultTable';
import storage from '../../utils/storage';
import eventEmitter from '../../utils/eventEmitter';

import { withDatabase } from '../../utils/database';

import _encode_data from '../../components/DataSheet/_encode_data';
import csv_stringify from '../../components/DataSheet/csv_stringify';

class Home extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isConnected: false,
      autoConnect: false,
      connectionStr: '',
      currentTable: null,
      orderby: [],
      tableInfo: null,
      command: '',
      last_select_command: '',
      result: '',
      resultStyle: 'table',
      panelHeight: storage.getItem('panelHeight') ?? 300,
    };

    this.resultTable = React.createRef();
  }

  componentDidMount() {

    this.autoConnect();

    eventEmitter.addListener('WEBSOCKET_DID_OPENED', () => this.state.autoConnect && this.connect());
    eventEmitter.addListener('WEBSOCKET_DID_CLOSED', () => this.setState({ isConnected: false }));
  }

  async autoConnect() {

    const connectionStr = storage.getItem('connectionStr');
    const isConnected = storage.getItem('isConnected');

    if (!_.isEmpty(connectionStr)) {
      this.setState({ connectionStr, autoConnect: true }, isConnected ? () => this.connect() : null);
    }
  }

  async connect() {
    
    const database = this.props.database;
  
    try {
      
      if (this.state.isConnected) {
        return;
      }

      await database.connect(this.state.connectionStr);

      storage.setItem('connectionStr', this.state.connectionStr);
      storage.setItem('isConnected', true);

      this.setState({ isConnected: true, autoConnect: false, databases: [], tables: [] });

    } catch (e) {

      console.log(e);
    }
  }

  connectionUrl() {
    try {
      return new URL(this.state.connectionStr);
    } catch (e) {
      return;
    }
  }

  parse_mongo_command(command) {

    const _command = EJSON.parse(command);

    if (_.isString(_command.find)) {

      let orderby;

      if (!_.isEmpty(_command.sort)) {
        orderby = [];
        for (const [key, order] of Object.entries(_command.sort)) {
          orderby.push({ column: key, isAscending: order == 1 });
        }
      }
      
      return { is_select: true, table: _command.find, orderby };
    }
    if (_.isString(_command.delete)) {
      return { is_select: false, table: _command.delete };
    }
    if (_.isString(_command.findAndModify)) {
      return { is_select: false, table: _command.findAndModify };
    }
    if (_.isString(_command.insert)) {
      return { is_select: false, table: _command.insert };
    }
    if (_.isString(_command.update)) {
      return { is_select: false, table: _command.update };
    }
    if (_.isString(_command.create)) {
      return { is_select: false, table: _command.create };
    }
    if (_.isString(_command.createIndexes)) {
      return { is_select: false, table: _command.createIndexes };
    }
  }

  parse_command(command) {

    try {

      const url = this.connectionUrl();

      if (url?.protocol == 'mongodb:') {
        return this.parse_mongo_command(command);
      }

      const database_map = {
        'mysql:': 'mysql',
        'postgres:': 'postgresql',
      }
  
      const parser = new SQLParser();
      let ast = parser.astify(command, { database: database_map[url?.protocol] });

      if (_.isArray(ast)) {
        ast = _.last(ast);
      }

      switch (ast?.type) {

        case 'select':

          let orderby;

          if (_.isArray(ast?.orderby)) {
            orderby = [];
            for (const item of ast.orderby) {
              if (item.expr?.type == 'column_ref') {
                orderby.push({ column: item.expr.column, isAscending: item.type == 'ASC' });
              } else if (item.expr?.type == 'single_quote_string' || item.expr?.type == 'double_quote_string') {
                orderby.push({ column: item.expr.value, isAscending: item.type == 'ASC' });
              }
            }
          }

          if (_.isArray(ast?.from) && ast.from.length == 1) {
            return { ast, is_select: true, table: ast.from[0].table, orderby };
          }
          break;

        case 'delete':
          
          if (_.isArray(ast?.from) && ast.from.length == 1) {
            return { ast, is_select: false, table: ast.from[0].table };
          }
          break;

        case 'insert':
        case 'update':
        case 'create':
          
          if (_.isArray(ast?.table) && ast.table.length == 1) {
            return { ast, is_select: false, table: ast.table[0].table };
          }
          break;
      }
      
    } catch (e) {
      console.log(e);
    }
  }

  calculate_columns_type(data) {

    if (!_.isArray(data)) {
      return;
    }

    const columns = {};

    const type_of = (value) => {
      if (_.isBoolean(value)) {
        return 'boolean';
      }
      if (_.isNumber(value)) {
        return 'number';
      }
      if (_.isDate(value)) {
        return 'date';
      }
      if (_.isString(value)) {
        return 'string';
      }
      if (_.isArray(value)) {
        return 'array';
      }
      switch (value._bsontype) {
  
        case 'Binary':
  
        switch (value.sub_type) {
          case Binary.SUBTYPE_UUID: return 'uuid';
          case Binary.SUBTYPE_MD5: return 'md5';
          default: return 'binary';
        }
  
        case 'BSONRegExp': return 'regex';
        case 'Symbol': return 'symbol';
        case 'Double': return 'double';
        case 'Int32': return 'int32';
        case 'Decimal128': return 'decimal';
        case 'Long': return 'long';
        case 'UUID': return 'uuid';

        case 'ObjectId':
        case 'ObjectID':
  
          return 'objectId';
      }
    }

    for (const item of data) {
      for (const [key, value] of Object.entries(item)) {

        if (_.isNil(value)) continue;

        const type = type_of(value) ?? 'any';

        if (_.isNil(columns[key])) {
          columns[key] = type;
        } else if (columns[key] != type) {
          columns[key] = 'any';
        }
      }
    }

    return Object.entries(columns).map(x => ({ name: x[0], type: x[1] ?? 'any' }));
  }

  async runCommand(command) {

    try {

      let _command = command;
      let last_select_command = this.state.last_select_command;

      if (_.isEmpty(_command.trim())) {
        return;
      }

      const url = this.connectionUrl();
      const database = this.props.database;

      if (url?.protocol == 'mongodb:') {
        _command = [_command];
      } else {
        _command = _command.split(';');
      }

      let result;
      let currentTable;
      let orderby;
      let tableInfo;
			let _run_command;
			
      if (url?.protocol == 'mongodb:') {
        _run_command = (command) => database.runMongoCommand(EJSON.parse(command, { relaxed: false }), { relaxed: false });
      } else {
        _run_command = (command) => database.runSQLCommand(command);
      }

      for (const command of _command) {

        if (_.isEmpty(command.trim())) continue;

        const _result = await _run_command(command);

        const { is_select, table, orderby: _orderby } = this.parse_command(command) ?? {};

        if (is_select && _.isString(table)) {

          last_select_command = command;
          result = _result;
          currentTable = table;
          orderby = _orderby;
          if (url?.protocol == 'mongodb:') {
            tableInfo = { primaryKey: ['_id'], columns: this.calculate_columns_type(result) };
          } else {
            tableInfo = await database.tableInfo(currentTable);
          }

        } else if (!_.isEmpty(_result)) {

          last_select_command = '';
          result = _result;
          currentTable = table;
          orderby = [];
          if (url?.protocol == 'mongodb:') {
            tableInfo = { primaryKey: ['_id'], columns: this.calculate_columns_type(result) };
          } else {
            tableInfo = await database.tableInfo(currentTable);
          }

        } else if (!is_select && _.isString(table) && table != this.parse_command(last_select_command)?.table) {

          if (url?.protocol == 'mongodb:') {
            last_select_command = EJSON.stringify({ find: table, limit: 100 });
          } else {
            last_select_command = `SELECT * FROM ${table} LIMIT 100`;
          }
        }
      }

      if (_.isNil(result) && !_.isEmpty(last_select_command)) {
        result = await _run_command(last_select_command);
        let _parsed_command = this.parse_command(last_select_command);
        currentTable = _parsed_command?.table;
        orderby = _parsed_command?.orderby;
        if (url?.protocol == 'mongodb:') {
          tableInfo = { primaryKey: ['_id'], columns: this.calculate_columns_type(result) };
        } else {
          tableInfo = await database.tableInfo(currentTable);
        }
      }

      this.setState({ result, currentTable, orderby, tableInfo, command, last_select_command });
      
    } catch (e) {
      console.log(e);
    }
  }

  setConnectionStr(connectionStr) {
    this.setState({ connectionStr, autoConnect: false });
    storage.setItem('connectionStr', connectionStr);
  }

  async onDatabaseSelected(name) {

    const database = this.props.database;

    try {
      
      const url = this.connectionUrl();
      if (!url) {
        return;
      }

      url.pathname = `/${name}`;

      await database.reconnect(name);

      this.setState({ connectionStr: url.toString() });

    } catch (e) {

      console.log(e);
    }
  }

  async onTableSelected(name) {

    const url = this.connectionUrl();

    const last_select_table = this.parse_command(this.state.last_select_command)?.table;

    if (last_select_table == name) {

      await this.runCommand(this.state.last_select_command);

    } else {

      let select_command;
  
      if (url?.protocol == 'mongodb:') {
        select_command = EJSON.stringify({ find: name, limit: 100 });
      } else {
        select_command = `SELECT * FROM ${name} LIMIT 100`;
      }

      await this.runCommand(select_command);
    }
  }

  saveFile() {
    
    if (_.isEmpty(this.state.result)) return;

    if (_.isArray(this.state.result) && this.state.resultStyle == 'table')  {

      const columns = this.state.result.reduce((result, x) => _.uniq(result.concat(Object.keys(x))), []);
      const grid = this.state.result.map(x => columns.map(c => _encode_data(x[c])));

      const file = csv_stringify([columns, ...grid]);

      const blob = new Blob([file], { type: 'text/csv' });
      saveAs(blob, _.isEmpty(this.state.currentTable) ? 'file.csv' : `${this.state.currentTable}.csv`);

    } else {

      const file = EJSON.stringify(this.state.result);
      const blob = new Blob([file], { type: 'application/json' });
      saveAs(blob, _.isEmpty(this.state.currentTable) ? 'file.json' : `${this.state.currentTable}.json`);
    }
  }
  
  async handleDeleteRows(rows, columns) {

    if (!confirm('Are you sure you want to delete selected rows?')) return;

    const {
      result,
      currentTable,
      tableInfo,
    } = this.state;

    const database = this.props.database;
    const { primaryKey } = tableInfo ?? {};

    if (_.isEmpty(rows)) return;
    if (_.isEmpty(primaryKey)) return;

    const items = rows.map(x => result[x]).map(x => Object.fromEntries(primaryKey.map(k => [k, x[k]])));
    await database.deleteRows(currentTable, items);

    const _result = result.filter((x, i) => !rows.includes(i));
    this.setState({ result: _result });

    this.resultTable.current?.clearSelection();
  }

  async handleDeleteCells(cells, columns) {
    
    const {
      result,
      currentTable,
      tableInfo,
    } = this.state;

    const url = this.connectionUrl();

    const database = this.props.database;
    const { primaryKey } = tableInfo ?? {};

    if (_.isEmpty(cells)) return;
    if (_.isEmpty(primaryKey)) return;

    const { start_row, start_col, end_row, end_col } = cells;

    const min_row = Math.min(start_row, end_row);
    const max_row = Math.max(start_row, end_row);
    const min_col = Math.min(start_col, end_col);
    const max_col = Math.max(start_col, end_col);

    const _rows = _.range(min_row, max_row + 1);
    const _cols = _.range(min_col, max_col + 1);

    const _columns = _cols.map(x => columns[x]).filter(x => !primaryKey.includes(x));
    const items = _rows.map(x => result[x]).map(x => {
      return {
        key: Object.fromEntries(primaryKey.map(k => [k, x[k]])),
        update: Object.fromEntries(_columns.map(k => [k, null])),
      }
    });
    await database.updateItems(currentTable, items);

    let _result;
    if (url?.protocol == 'mongodb:') {
      _result = result.map((x, i) => _rows.includes(i) ? { ...x, ...Object.fromEntries(_columns.map(k => [k, undefined])) } : x);
    } else {
      _result = result.map((x, i) => _rows.includes(i) ? { ...x, ...Object.fromEntries(_columns.map(k => [k, null])) } : x);
    }
    this.setState({ result: _result });
  }

  async handlePasteRows(rows, columns) {
    
  }

  async handlePasteCells(cells, columns) {

  }

  async onSortPressed(col, ascending) {

    if (_.isEmpty(this.state.last_select_command)) {
      return;
    }

    const url = this.connectionUrl();

    if (url?.protocol == 'mongodb:') {

      const last_select_command = EJSON.parse(this.state.last_select_command, { relaxed: false });
      last_select_command.sort = { [col]: ascending ? 1 : -1 };

      await this.runCommand(EJSON.stringify(last_select_command));
      
    } else {
      
      const { ast } = this.parse_command(this.state.last_select_command) ?? {};

      ast.orderby = [{
        type: ascending ? 'ASC' : 'DESC',
        expr: {
          type: 'column_ref',
          column: col,
        }
      }];

      const database_map = {
        'mysql:': 'mysql',
        'postgres:': 'postgresql',
      }
  
      const parser = new SQLParser();
      const select_command = parser.sqlify(ast, { database: database_map[url?.protocol] });

      await this.runCommand(select_command);
    }
  }

  renderDashboard() {

    const url = this.connectionUrl();

    let mode = null;

    switch (url?.protocol) {
      case 'mysql:': 
        mode = 'text/x-mysql';
        break;
      case 'postgres:': 
        mode = 'text/x-pgsql';
        break;
      case 'mongodb:': 
        mode = 'application/x-json';
        break;
    }

    return <View style={{ flex: 1 }}>
      <View style={{ 
        background: '#2F4F4F',
        alignItems: 'stretch',
      }}>
        <View style={{ 
          padding: 8,
          height: 64,
          flexDirection: 'row', 
          alignItems: 'flex-end',
        }}>
          <Text style={{ color: 'white', fontSize: 24 }}>{this.state.currentTable}</Text>
        </View>
        <View style={{ 
          padding: 4,
          flexDirection: 'row', 
          alignItems: 'stretch',
          justifyContent: 'space-between',
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'stretch',
          }}>
            {_.isArray(this.state.result) && <Button 
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
              onPress={() => this.setState({ resultStyle: 'table' })} />}
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
              onPress={() => this.setState({ resultStyle: 'raw' })} />
          </View>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'stretch',
          }}>
            <Button
              icon='Feather' 
              iconStyle={{ 
                name: 'download',
                size: 18,
              }} 
              style={{
                padding: 0,
                borderRadius: null,
                backgroundColor: null,
                marginHorizontal: 4,
                aspectRatio: 1,
              }}
              onPress={() => this.saveFile()} />
          </View>
        </View>
      </View>
      <ResultTable 
        style={{ flex: 1 }} 
        ref={this.resultTable}
        data={this.state.result}
        tableInfo={this.state.tableInfo}
        displayStyle={this.state.resultStyle} 
        columnSettingKey={this.state.currentTable} 
        sortedBy={this.state.orderby}
        onSortPressed={(col, ascending) => this.onSortPressed(col, ascending)}
        handleDeleteRows={(rows, columns) => this.handleDeleteRows(rows, columns)} 
        handleDeleteCells={(cells, columns) => this.handleDeleteCells(cells, columns)} 
        handlePasteRows={(rows, columns) => this.handlePasteRows(rows, columns)} 
        handlePasteCells={(cells, columns) => this.handlePasteCells(cells, columns)} />
      <Resizable
        contentHeight={this.state.panelHeight}
        onContentHeightChanged={(height) => {
          this.setState({ panelHeight: height });
          storage.setItem('panelHeight', height);
        }}
        header={<React.Fragment>
          <Button 
          icon='Ionicons' 
          iconStyle={{ 
            name: 'play',
            size: 18,
          }} 
          style={{
            padding: 0,
            borderRadius: null,
            backgroundColor: null,
            marginHorizontal: 4,
            aspectRatio: 1,
          }}
          onPress={() => this.runCommand(this.state.command)} />
        </React.Fragment>}
        headerContainerStyle={{ 
          padding: 4,
          flexDirection: 'row', 
          background: '#2F4F4F',
          alignItems: 'stretch',
        }}>
        <CodeMirror
          value={this.state.command}
          onChange={(command) => this.setState({ command })}
          options={{ 
            mode: mode,
            lineNumbers: true,
          }} />
      </Resizable>
    </View>;
  }

  render() {

    return <View style={{ 
      flex: 1, 
      flexDirection: 'row', 
      alignItems: 'stretch',
      background: 'snow',
    }}>
      <View style={{ width: 240, background: '#2F4F4F' }}>
        <ScrollView>
          <SideMenu
            currentTable={this.state.currentTable}
            connectionStr={this.state.connectionStr}
            isConnected={this.state.isConnected}
            onDatabaseSelected={(name) => this.onDatabaseSelected(name)}
            onTableSelected={(name) => this.onTableSelected(name)} />
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        {this.state.isConnected ? this.renderDashboard() : <LoginPanel
          connectionStr={this.state.connectionStr}
          setConnectionStr={(connectionStr) => this.setConnectionStr(connectionStr)}
          connect={() => this.connect()} />}
      </View>
    </View>;
  }
}

export default withRouter(withDatabase(Home));