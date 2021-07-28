import _ from 'lodash';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EJSON, serialize, Binary } from 'bson';
import eventEmitter from './eventEmitter';

function createSocket() {
	if (_.isNil(global.WebSocket) || _.isNil(global.location)) return;
	return location.protocol == 'http:' ? new WebSocket(`ws://${location.host}/ws`) : new WebSocket(`wss://${location.host}/ws`);
}

function createDatabase() {

	const socket = createSocket();
	if (!socket) return;
	
	const callbacks = {};
	
	let isopen = false;

	socket.onopen = () => {
		isopen = true;
		eventEmitter.emit('WEBSOCKET_DID_OPENED');
	};
	socket.onclose = () => {
		isopen = false;
		eventEmitter.emit('WEBSOCKET_DID_CLOSED');
	};
	socket.onmessage = ({data}) => {
		const _result = EJSON.parse(data);
		const result = _.isNil(callbacks[_result.token]?.options) ? _result : EJSON.parse(data, callbacks[_result.token]?.options);
		if (result['success']) {
			callbacks[_result.token]?.resolve(result['data']);
		} else {
			callbacks[_result.token]?.reject(new Error(result['error']));
		}
		delete callbacks[_result.token];
	}

	function socket_run(data, options) {
		if (!isopen) throw new Error('socket not connected');
		data.token = uuidv4();
		socket.send(EJSON.stringify(data));
		return new Promise((resolve, reject) => callbacks[data.token] = { resolve, reject, options });
	}
	
	class Database {
		
		connect(url) {
			return socket_run({ action: 'connect', url });
		}

		reconnect(database) {
			return socket_run({ action: 'reconnect', database });
		}

		databases() {
			return socket_run({ action: 'databases' });
		}
		
		tables() {
			return socket_run({ action: 'tables' });
		}
		
		views() {
			return socket_run({ action: 'views' });
		}
		
		materializedViews() {
			return socket_run({ action: 'materializedViews' });
		}
		
		tableInfo(table) {
			return socket_run({ action: 'tableInfo', table });
		}
		
		deleteRows(table, items) {
			return socket_run({ action: 'deleteRows', table, delete: items });
		}
		
		updateItems(table, items) {
			return socket_run({ action: 'updateItems', table, update: items });
		}
		
		runSQLCommand(sql, options) {
			return socket_run({ action: 'runCommand', command: sql }, options);
		}
		
		async runMongoCommand(command, options) {

			const _run_command = (command) => socket_run({ action: 'runCommand', command: new Binary(serialize(command)) }, options);
			
			let result = await _run_command(command, options);

			if (result.ok.valueOf() == 1 && !_.isEmpty(result.cursor)) {

				let cursor_id = result.cursor.id.value ?? result.cursor.id.toNumber();
				let _result = result.cursor.firstBatch ?? [];
				let collection = result.cursor.ns.split('.')[1];
	  
				while(_.isInteger(cursor_id) && cursor_id > 0) {
	  
					let batch = await _run_command({ getMore: result.cursor.id, collection }, { relaxed: false });
		
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

			return result
		}
	}
	
	return new Database();
}

export const DatabaseContext = React.createContext(createDatabase());

export function withDatabase(Component) {
	return (props) => <Component database={React.useContext(DatabaseContext)} {...props} />;
}
