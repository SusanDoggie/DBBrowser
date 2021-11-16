import _ from 'lodash';
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { URL } from 'url';

import RoundButton from '../../components/RoundButton';

export default function LoginPanel({ connect, connectionStr, setConnectionStr }) {

  function connectionUrl() {
    try {
      return new URL(connectionStr);
    } catch (e) {
      return;
    }
  }
  
  const url = connectionUrl();
  const _host = connectionUrl();

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
      onChangeText={(connectionStr) => setConnectionStr(connectionStr)}
      value={connectionStr} />

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
          setConnectionStr(newUrl.toString());
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
          const newUrl = connectionUrl();
          newUrl.username = username;
          setConnectionStr(newUrl.toString());
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
          const newUrl = connectionUrl();
          newUrl.password = password;
          setConnectionStr(newUrl.toString());
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
          const newUrl = connectionUrl();
          newUrl.pathname = `/${pathname}`;
          setConnectionStr(newUrl.toString());
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
      onPress={() => connect()} />
    </View>
  </View>;
}
