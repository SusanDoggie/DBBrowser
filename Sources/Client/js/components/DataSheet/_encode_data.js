//
//  _encode_data.js
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
import { Binary, UUID, EJSON } from 'bson';

export default function _encode_data(value) {
    
    if (_.isNull(value)) {
      return 'null';
    }
    
    if (_.isUndefined(value)) {
      return 'undefined';
    }
    
    if (_.isBoolean(value)) {
      return `${value}`;
    }
    
    if (_.isNumber(value)) {
      return `${value}`;
    }
    
    if (_.isDate(value)) {
      return value.toLocaleString();
    }

    if (_.isString(value)) {
      return value;
    }

    switch (value._bsontype) {

      case 'Binary':

      switch (value.sub_type) {

        case Binary.SUBTYPE_UUID:

          let uuid = new UUID(value.buffer);
          return uuid.toHexString(true);

        case Binary.SUBTYPE_MD5:

          return value.buffer.toString('hex');
  
        default: return value.buffer.toString('base64');
      }

      case 'BSONRegExp':

        return `/${value.pattern}/${value.options}`;

      case 'Symbol':

        return value.valueOf();

      case 'Double':
      case 'Int32':

        return value.valueOf();

      case 'Decimal128':
      case 'Long':

        return value.toString();

      case 'ObjectId':
      case 'ObjectID':

        return value.toHexString();

      case 'UUID':

        return value.toHexString(true);

      default: return EJSON.stringify(value);
    }
}
