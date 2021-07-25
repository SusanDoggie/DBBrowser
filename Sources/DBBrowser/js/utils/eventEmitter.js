import _ from 'lodash';
import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

export default {
	emit(event, args) {
		eventEmitter.emit(event, args);
	},
	addListener(event, listener) {
		eventEmitter.addListener(event, listener);
		return { remove: () => { eventEmitter.removeListener(event, listener) } };	
	},
};
