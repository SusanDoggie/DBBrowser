//
//  ValueViewer.js
//
//  The MIT License
//  Copyright (c) 2015 - 2021 Susan Cheng. All rights reserved.
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
import { Text } from 'react-native';
import { Binary, UUID, EJSON } from 'bson';

export default function ValueViewer({ value }) {
  
  if (_.isNull(value)) {
    return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }} numberOfLines={1}>(null)</Text>;
  }
  
  if (_.isUndefined(value)) {
    return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }} numberOfLines={1}>(undefined)</Text>;
  }
  
  if (_.isBoolean(value)) {
    return <Text style={{ color: 'darkblue', fontFamily: 'monospace' }} numberOfLines={1}>{`${value}`}</Text>;
  }
  
  if (_.isNumber(value)) {
    return <Text style={{ color: 'mediumblue', fontFamily: 'monospace' }} numberOfLines={1}>{`${value}`}</Text>;
  }
  
  if (_.isDate(value)) {
    return <Text style={{ color: 'darkslateblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.toLocaleString('en', { timeZoneName: 'short' })}</Text>;
  }

  if (_.isString(value)) {
    return <Text style={{ color: 'darkred', fontFamily: 'monospace' }} numberOfLines={1}>{JSON.stringify(value)}</Text>;
  }

  switch (value._bsontype) {

    case 'Binary':

    switch (value.sub_type) {

      case Binary.SUBTYPE_UUID:

        let uuid = new UUID(value.buffer);
        return <Text style={{ color: 'darkblue', fontFamily: 'monospace' }} numberOfLines={1}>{uuid.toHexString(true)}</Text>;

      case Binary.SUBTYPE_MD5:

        return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>MD5(<Text style={{ color: 'darkred' }}>"{value.buffer.toString('hex')}"</Text>)</Text>;

      default: return <Text style={{ color: 'lightgray', fontFamily: 'monospace' }} numberOfLines={1}>({value.length()} bytes)</Text>;
    }

    case 'BSONRegExp':

      return <Text style={{ color: 'darkred', fontFamily: 'monospace' }} numberOfLines={1}>/{value.pattern}/{value.options}</Text>;

    case 'Symbol':

      return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>Symbol(<Text style={{ color: 'darkred' }}>{JSON.stringify(value.valueOf())}</Text>)</Text>;

    case 'Double':
    case 'Int32':

      return <Text style={{ color: 'mediumblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.valueOf()}</Text>;

    case 'Decimal128':
    case 'Long':

      return <Text style={{ color: 'mediumblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.toString()}</Text>;

    case 'ObjectId':
    case 'ObjectID':

      return <Text style={{ color: 'gray', fontFamily: 'monospace' }} numberOfLines={1}>ObjectId(<Text style={{ color: 'darkred' }}>"{value.toHexString()}"</Text>)</Text>;

    case 'UUID':

      return <Text style={{ color: 'darkblue', fontFamily: 'monospace' }} numberOfLines={1}>{value.toHexString(true)}</Text>;

    default: return <Text style={{ fontFamily: 'monospace' }} numberOfLines={1}>{EJSON.stringify(value)}</Text>;
  }
}
