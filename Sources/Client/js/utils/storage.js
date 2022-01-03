//
//  storage.js
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
import { EJSON } from 'bson';

function storageAvailable(type) {
	var storage;
	try {
		storage = window[type];
		var x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	}
	catch(e) {
		return e instanceof DOMException && (
			// everything except Firefox
			e.code === 22 ||
			// Firefox
			e.code === 1014 ||
			// test name field too, because code might not be present
			// everything except Firefox
			e.name === 'QuotaExceededError' ||
			// Firefox
			e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
			// acknowledge QuotaExceededError only if there's something already stored
			(storage && storage.length !== 0);
	}
}

const defaultStorageOptions = {
	persistent: false,
}

function resolveStorage(type) {
    if (global.window && storageAvailable(type)) return window[type];
}

const sessionStorage = resolveStorage('sessionStorage');
const localStorage = resolveStorage('localStorage');

class Storage {

	keys() {
		return _.uniq([Object.keys(sessionStorage), Object.keys(localStorage)].flat());
	}
	
	clear() {
		localStorage?.clear();
		sessionStorage?.clear();
	}
	
	removeItem(key) {
		localStorage?.removeItem(key);
		sessionStorage?.removeItem(key);
	}

	getItem(key) {
		const data = sessionStorage?.getItem(key) ?? localStorage?.getItem(key);
		return _.isNil(data) ? undefined : EJSON.parse(data);
	}

	setItem(key, value, options = defaultStorageOptions) {
		const storage = options.persistent ? localStorage : sessionStorage;
		storage?.setItem(key, EJSON.stringify(value));
	}
}

export default new Storage();