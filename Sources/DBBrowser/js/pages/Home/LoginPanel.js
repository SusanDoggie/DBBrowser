import _ from 'lodash';
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { URL } from 'url';

import RoundButton from '../../components/RoundButton';

export default class LoginPanel extends React.Component {

  connectionUrl() {
    try {
      return new URL(this.props.connectionStr);
    } catch (e) {
      return;
    }
  }

  render() {

    const url = this.connectionUrl();
    const _host = this.connectionUrl();

    if (_host) {
      _host.username = '';
      _host.password = '';
      _host.pathname = '';
      _host.search = '';
      _host.hash = '';
    }

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
        onChangeText={(connectionStr) => this.props.setConnectionStr(connectionStr)}
        value={this.props.connectionStr} />

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
        onChangeText={(host) => {
          try {
            const newUrl = new URL(host);
            newUrl.username = url.username;
            newUrl.password = url.password;
            newUrl.pathname = url.pathname;
            newUrl.search = url.search;
            newUrl.hash = url.hash;
            this.props.setConnectionStr(newUrl.toString());
          } catch (e) {
            return;
          }
        }}
        value={_host?.toString() ?? ''} />

      <Text style={{
        fontSize: 12,
        marginTop: 16,
      }}>Username</Text>
      <TextInput
        style={{ 
          borderBottomWidth: StyleSheet.hairlineWidth, 
          borderBottomColor: 'black',
          marginTop: 8,
        }}
        onChangeText={(username) => {
          try {
            const newUrl = this.connectionUrl();
            newUrl.username = username;
            this.props.setConnectionStr(newUrl.toString());
          } catch (e) {
            return;
          }
        }}
        value={url?.username ?? ''} />

      <Text style={{
        fontSize: 12,
        marginTop: 16,
      }}>Password</Text>
      <TextInput
        style={{ 
          borderBottomWidth: StyleSheet.hairlineWidth, 
          borderBottomColor: 'black',
          marginTop: 8,
        }}
        onChangeText={(password) => {
          try {
            const newUrl = this.connectionUrl();
            newUrl.password = password;
            this.props.setConnectionStr(newUrl.toString());
          } catch (e) {
            return;
          }
        }}
        value={url?.password ?? ''} />

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
        onChangeText={(pathname) => {
          try {
            const newUrl = this.connectionUrl();
            newUrl.pathname = `/${pathname}`;
            this.props.setConnectionStr(newUrl.toString());
          } catch (e) {
            return;
          }
        }}
        value={url?.pathname?.split('/')[1] ?? ''} />

      <RoundButton
        style={{
          marginTop: 16,
          alignSelf: 'center',
        }}
        title='Connect'
        onPress={() => this.props.connect()} />
      </View>
    </View>;
  }
}
