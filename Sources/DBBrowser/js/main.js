import './font-inject';
import React from 'react';
import { AppRegistry } from 'react-native';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import 'codemirror/lib/codemirror.css';
import 'react-datasheet/lib/react-datasheet.css';
import './default.css';

import 'codemirror/mode/sql/sql';
import 'codemirror/mode/javascript/javascript';

import 'node-sql-parser/umd/mysql.umd';
import 'node-sql-parser/umd/postgresql.umd';

import 'react-resizable/css/styles.css';

function Main(props) {
	return <BrowserRouter><App /></BrowserRouter>;
}

AppRegistry.registerComponent('App', () => Main);
AppRegistry.runApplication('App', {
	rootTag: document.getElementById('root')
});