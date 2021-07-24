import _ from 'lodash';
import React from 'react';
import { View, TextInput, Text, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import { withRouter } from 'react-router';
import { EJSON } from 'bson';
import Url from 'url';

import { Parser as SQLParser } from 'node-sql-parser';

import CodeMirror from '../../components/CodeMirror';
import Button from '../../components/Button';
import RoundButton from '../../components/RoundButton';
import ResultTable from './ResultTable';
import storage from '../../utils/storage';

import { withDatabase } from '../../utils/database';

class Home extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isConnected: false,
      autoConnect: false,
      connectionStr: '',
      currentTable: null,
      command: '',
      last_select_command: '',
      result: '',
      resultStyle: 'table',
      databases: [],
      tables: [],
      counts: {},
    };
  }

  componentDidMount() {

    this.autoConnect();

    const database = this.props.database;
  
    database.addListener('WEBSOCKET_DID_OPENED', () => this.state.autoConnect && this.connect());
    database.addListener('WEBSOCKET_DID_CLOSED', () => this.setState({ isConnected: false }));
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

      this.setState({ isConnected: true, autoConnect: false, databases: [], tables: [] }, () => this.loadData());

    } catch (e) {

      console.log(e);
    }
  }

  async loadData() {
    
    const databases = await this.props.database.databases();
    const tables = await this.props.database.tables();

    databases.sort();
    tables.sort();

    this.setState({ databases, tables });

    const counts = {};
    await Promise.all(tables.map(async (x) => counts[x] = await this.loadRowCount(x)));

    this.setState({ counts });
  }

  async loadRowCount(table) {
    
    const url = Url.parse(this.state.connectionStr);

    const database = this.props.database;

    let result;

    switch (url.protocol) {
      case 'mysql:':
      case 'postgres:':
        
        result = await database.runSQLCommand(`SELECT COUNT(*) AS count FROM ${table}`);
        return result[0].count;

      case 'mongodb:': 

        result = await database.runMongoCommand({ count: table });
        return result.n;
    }
  }

  parse_sql(command) {

    try {

      const url = Url.parse(this.state.connectionStr);

      const parser = new SQLParser();
      let ast;
  
      switch (url.protocol) {
        
        case 'mysql:': 
        
          ast = parser.astify(command, { database: 'mysql' });
          break;

        case 'postgres:':

          ast = parser.astify(command, { database: 'postgresql' });
          break;
      }

      if (_.isArray(ast)) {
        ast = _.last(ast);
      }

      switch (ast.type) {

        case 'select':
        case 'delete':
          
          if (_.isArray(ast?.from) && ast.from.length == 1) {
            return { action: ast.type, table: ast.from[0].table };
          }
          break;

        case 'insert':
        case 'update':
          
          if (_.isArray(ast?.table) && ast.table.length == 1) {
            return { action: ast.type, table: ast.table[0].table };
          }
          break;
      }
      
    } catch (e) {
      console.log(e);
    }
  }

  async runCommand(command, currentTable) {

    try {

      const _command = command ?? this.state.command;
      let last_select_command = this.state.last_select_command;

      if (_.isEmpty(_command.trim())) {
        return;
      }

      const database = this.props.database;

      let result;
  
      const url = Url.parse(this.state.connectionStr);

      if (url.protocol == 'mongodb:') {
        
        const command = EJSON.parse(_command, { relaxed: false });

        result = await database.runMongoCommand(command, { relaxed: false });

        if (result.ok.valueOf() == 1 && !_.isEmpty(result.cursor)) {

          let cursor_id = result.cursor.id.value ?? result.cursor.id.toNumber();
          let _result = result.cursor.firstBatch ?? [];
          let collection = result.cursor.ns.split('.')[1];

          while(_.isInteger(cursor_id) && cursor_id > 0) {

            let batch = await database.runMongoCommand({ getMore: result.cursor.id, collection }, { relaxed: false });

            if (batch.ok.valueOf() != 1 || _.isEmpty(batch.cursor)) {
              break;
            }

            _result = _result.concat(batch.cursor.nextBatch);

            if (cursor_id != (batch.cursor.id.value ?? batch.cursor.id.toNumber())) {
              break;
            }
          }

          result = _result;
        }

      } else {

        const { action, table } = this.parse_sql(_command) ?? {};

        if (_.isNil(currentTable)) {
          currentTable = table;
        }

        result = await database.runSQLCommand(_command);

        if (action == 'select' && _.isString(table)) {

          last_select_command = _command;

        } else if (action != 'select' && _.isString(action) && _.isString(table)) {

          const { table: last_select_table } = this.parse_sql(last_select_command) ?? {};

          if (table != last_select_table) {
            last_select_command = `SELECT * FROM ${table} LIMIT 100`;
          }
          result = await database.runSQLCommand(last_select_command);
        }
      }

      this.setState({ result, command: _command, last_select_command, currentTable });
      
    } catch (e) {
      console.log(e);
    }
  }

  renderDashboard() {

    const url = Url.parse(this.state.connectionStr);

    let mode = null;
    let currentTable = this.state.currentTable;

    switch (url.protocol) {
      case 'mysql:': 
        mode = 'text/x-mysql';
        break;
      case 'postgres:': 
        mode = 'text/x-pgsql';
        break;
      case 'mongodb:': 
        mode = 'application/x-json';
        try {
          currentTable = !_.isEmpty(this.state.command) ? EJSON.parse(this.state.command)?.find : null;
        } catch (e) {
          currentTable = null;
        }
        break;
    }

    return <View style={{ flex: 1 }}>
      <View style={{ 
        padding: 4,
        flexDirection: 'row', 
        background: '#2F4F4F',
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
      <ResultTable 
        style={{ flex: 1 }} 
        data={this.state.result} 
        displayStyle={this.state.resultStyle} 
        columnSettingKey={currentTable} />
      <View style={{ 
        padding: 4,
        flexDirection: 'row', 
        background: '#2F4F4F',
        alignItems: 'stretch',
      }}>
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
          onPress={() => this.runCommand()} />
      </View>
      <View style={{ height: 300 }}>
      <CodeMirror
        value={this.state.command}
        onChange={(command) => this.setState({ command })}
        options={{ 
          mode: mode,
          lineNumbers: true,
        }} />
      </View>
    </View>;
  }

  setConnectionStr(connectionStr) {

    this.setState({ connectionStr, autoConnect: false });

    storage.setItem('connectionStr', connectionStr);
  }

  async onPressTable(name) {

    const url = Url.parse(this.state.connectionStr);

    switch (url.protocol) {
      case 'mysql:':
      case 'postgres:':
        
        const { table: last_select_table } = this.parse_sql(this.state.last_select_command) ?? {};

        if (last_select_table == name) {
          await this.runCommand(this.state.last_select_command, name);
        } else {
          await this.runCommand(`SELECT * FROM ${name} LIMIT 100`, name);
        }
        break;

      case 'mongodb:': 

        await this.runCommand(EJSON.stringify({ find: name, limit: 100 }), name);
        break;
    }
  }

  renderLoginPanel() {

    const url = Url.parse(this.state.connectionStr);

    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 512,
        padding: 16,
			  borderRadius: 16,
			  overflow: 'hidden',
			  alignItems: 'stretch',
			  justifyContent: 'center',
        backgroundColor: 'white',
      }}>

      <Text style={{
        fontSize: 12,
      }}>Connection String</Text>
      <TextInput
        style={{ 
          borderBottomWidth: StyleSheet.hairlineWidth, 
          borderBottomColor: 'black',
          marginTop: 8,
        }}
        onChangeText={(connectionStr) => this.setConnectionStr(connectionStr)}
        value={this.state.connectionStr} />

      <Text style={{
        fontSize: 12,
        marginTop: 16,
      }}>Host</Text>
      <TextInput
        style={{ 
          borderBottomWidth: StyleSheet.hairlineWidth, 
          borderBottomColor: 'black',
          marginTop: 8,
        }}
        value={url.protocol && url.host ? url.protocol+'//'+url.host : ''} />

      <Text style={{
        fontSize: 12,
        marginTop: 16,
      }}>Auth</Text>
      <TextInput
        style={{ 
          borderBottomWidth: StyleSheet.hairlineWidth, 
          borderBottomColor: 'black',
          marginTop: 8,
        }}
        value={url.auth ?? ''} />

      <Text style={{
        fontSize: 12,
        marginTop: 16,
      }}>Database</Text>
      <TextInput
        style={{ 
          borderBottomWidth: StyleSheet.hairlineWidth, 
          borderBottomColor: 'black',
          marginTop: 8,
        }}
        value={url.pathname?.split('/')[1] ?? ''} />

      <RoundButton
        style={{
          marginTop: 16,
          alignSelf: 'center',
        }}
        title='Connect'
        onPress={() => this.connect()} />
      </View>
    </View>;
  }

  renderSideMenu() {

    if (this.state.isConnected) {

      const url = Url.parse(this.state.connectionStr);
      const current_database = url.pathname?.split('/')[1];

      return <ScrollView>
        <View>
          <View style={{ flexDirection: 'row', margin: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontFamily: 'monospace', fontWeight: '600' }}>DATABASES</Text>
            <TouchableWithoutFeedback onPress={() => this.loadData()}>
              <MaterialCommunityIcons name='reload' size={18} color='white' />
            </TouchableWithoutFeedback>
          </View>
          {this.state.databases?.map(name => <View style={{ marginHorizontal: 16, marginVertical: 8, alignItems: 'stretch' }}>
            <Button 
              title={name} 
              style={{
                padding: 0,
                borderRadius: null,
                backgroundColor: null,
                alignItems: 'stretch',
              }}
              render={({isHover}) => <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ flex: 1, color: 'white', opacity: isHover || current_database == name ? 1 : 0.4 }} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
              </View>} />
            </View>)}
        </View>
        <View>
          <View style={{ flexDirection: 'row', margin: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontFamily: 'monospace', fontWeight: '600' }}>TABLES</Text>
            <TouchableWithoutFeedback onPress={() => this.loadData()}>
              <MaterialCommunityIcons name='reload' size={18} color='white' />
            </TouchableWithoutFeedback>
          </View>
          {this.state.tables?.map(name => <View style={{ marginHorizontal: 16, marginVertical: 8, alignItems: 'stretch' }}>
            <Button 
              title={name} 
              style={{
                padding: 0,
                borderRadius: null,
                backgroundColor: null,
                alignItems: 'stretch',
              }}
              onPress={() => this.onPressTable(name)}
              render={({isHover}) => <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ flex: 1, color: 'white', opacity: isHover || this.state.currentTable == name ? 1 : 0.4 }} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
                <Text style={{ color: 'white', opacity: isHover || this.state.currentTable == name ? 1 : 0.4, marginLeft: 8 }}>{this.state.counts[name]}</Text>
              </View>} />
            </View>)}
        </View>
      </ScrollView>;
    }

    return <ScrollView>
    </ScrollView>;
  }
  
  render() {

    return <View style={{ 
      flex: 1, 
      flexDirection: 'row', 
      alignItems: 'stretch',
      background: 'snow',
    }}>
      <View style={{ width: 240, background: '#2F4F4F' }}>{this.renderSideMenu()}</View>
      <View style={{ flex: 1 }}>{this.state.isConnected ? this.renderDashboard() : this.renderLoginPanel()}</View>
    </View>;
  }
}

export default withRouter(withDatabase(Home));