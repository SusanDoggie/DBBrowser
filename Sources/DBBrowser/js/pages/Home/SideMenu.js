import _ from 'lodash';
import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import { v4 as uuidv4 } from 'uuid';
import { URL } from 'url';

import Button from '../../components/Button';

import { withDatabase } from '../../utils/database';

class SideMenu extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      token: uuidv4(),
      databases: [],
      tables: [],
      views: [],
      materializedViews: [],
      counts: {},
    };
  }

  componentDidUpdate(prevProps) {

    if (!prevProps.isConnected && this.props.isConnected) {

      this.loadData();

    } else if (prevProps.connectionStr != this.props.connectionStr) {

      this.loadData();
    }
  }

  async loadData() {
    
    if (!this.props.isConnected) return;

    const databases = await this.props.database.databases();
    const tables = await this.props.database.tables();
    const views = await this.props.database.views();
    const materializedViews = this.isMaterializedViews() ? await this.props.database.materializedViews() : [];

    databases.sort();
    tables.sort();
    views.sort();
    materializedViews.sort();

    this.setState({ databases, tables, views, materializedViews });

    const counts = {};
    await Promise.all([
      Promise.all(tables.map(async (x) => counts[x] = await this.loadRowCount(x))),
      Promise.all(views.map(async (x) => counts[x] = await this.loadRowCount(x))),
      Promise.all(materializedViews.map(async (x) => counts[x] = await this.loadRowCount(x))),
    ])

    this.setState({ counts });
  }

  async loadRowCount(table) {
    
    const url = this.connectionUrl();

    const database = this.props.database;

    let result;

    switch (url?.protocol) {
      case 'mysql:':
      case 'postgres:':
        
        result = await database.runSQLCommand(`SELECT COUNT(*) AS count FROM ${table}`);
        return result[0].count;

      case 'mongodb:': 

        result = await database.runMongoCommand({ count: table });
        return result.n;
    }
  }

  isMaterializedViews() {

    const url = this.connectionUrl();
    
    const isMaterializedViewsMap = {
      'postgres:': true,
    }
    return isMaterializedViewsMap[url?.protocol] ?? false;
  }

  connectionUrl() {
    try {
      return new URL(this.props.connectionStr);
    } catch (e) {
      return;
    }
  }

  render() {

    if (!this.props.isConnected) return <View />;

    const url = this.connectionUrl();
    const current_database = url?.pathname?.split('/')[1];

    return <React.Fragment>
      <View>
        <View style={{ flexDirection: 'row', margin: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: 'white', fontFamily: 'monospace', fontWeight: '600' }}>DATABASES</Text>
          <TouchableWithoutFeedback onPress={() => this.loadData()}>
            <MaterialCommunityIcons name='reload' size={18} color='white' />
          </TouchableWithoutFeedback>
        </View>
        {this.state.databases?.map(name => <View key={`${this.state.token}-database-${name}`} style={{ marginHorizontal: 16, marginVertical: 8, alignItems: 'stretch' }}>
          <Button 
            title={name} 
            style={{
              padding: 0,
              borderRadius: null,
              backgroundColor: null,
              alignItems: 'stretch',
            }}
            onPress={() => this.props.onDatabaseSelected(name)}
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
        {this.state.tables?.map(name => <View  key={`${this.state.token}-table-${name}`}style={{ marginHorizontal: 16, marginVertical: 8, alignItems: 'stretch' }}>
          <Button 
            title={name} 
            style={{
              padding: 0,
              borderRadius: null,
              backgroundColor: null,
              alignItems: 'stretch',
            }}
            onPress={() => this.props.onTableSelected(name)}
            render={({isHover}) => <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ flex: 1, color: 'white', opacity: isHover || this.props.currentTable == name ? 1 : 0.4 }} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
              <Text style={{ color: 'white', opacity: isHover || this.props.currentTable == name ? 1 : 0.4, marginLeft: 8 }}>{this.state.counts[name]}</Text>
            </View>} />
          </View>)}
      </View>
      <View>
        <View style={{ flexDirection: 'row', margin: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: 'white', fontFamily: 'monospace', fontWeight: '600' }}>VIEWS</Text>
          <TouchableWithoutFeedback onPress={() => this.loadData()}>
            <MaterialCommunityIcons name='reload' size={18} color='white' />
          </TouchableWithoutFeedback>
        </View>
        {this.state.views?.map(name => <View  key={`${this.state.token}-view-${name}`}style={{ marginHorizontal: 16, marginVertical: 8, alignItems: 'stretch' }}>
          <Button 
            title={name} 
            style={{
              padding: 0,
              borderRadius: null,
              backgroundColor: null,
              alignItems: 'stretch',
            }}
            onPress={() => this.props.onTableSelected(name)}
            render={({isHover}) => <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ flex: 1, color: 'white', opacity: isHover || this.props.currentTable == name ? 1 : 0.4 }} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
              <Text style={{ color: 'white', opacity: isHover || this.props.currentTable == name ? 1 : 0.4, marginLeft: 8 }}>{this.state.counts[name]}</Text>
            </View>} />
          </View>)}
      </View>
      {this.isMaterializedViews() && <View>
        <View style={{ flexDirection: 'row', margin: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: 'white', fontFamily: 'monospace', fontWeight: '600' }}>MATERIALIZED VIEWS</Text>
          <TouchableWithoutFeedback onPress={() => this.loadData()}>
            <MaterialCommunityIcons name='reload' size={18} color='white' />
          </TouchableWithoutFeedback>
        </View>
        {this.state.materializedViews?.map(name => <View  key={`${this.state.token}-materialized-view-${name}`}style={{ marginHorizontal: 16, marginVertical: 8, alignItems: 'stretch' }}>
          <Button 
            title={name} 
            style={{
              padding: 0,
              borderRadius: null,
              backgroundColor: null,
              alignItems: 'stretch',
            }}
            onPress={() => this.props.onTableSelected(name)}
            render={({isHover}) => <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ flex: 1, color: 'white', opacity: isHover || this.props.currentTable == name ? 1 : 0.4 }} ellipsizeMode='tail' numberOfLines={1}>{name}</Text>
              <Text style={{ color: 'white', opacity: isHover || this.props.currentTable == name ? 1 : 0.4, marginLeft: 8 }}>{this.state.counts[name]}</Text>
            </View>} />
          </View>)}
      </View>}
    </React.Fragment>;
  }
}

export default withDatabase(SideMenu);