//
//  LoginPanel.js
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
