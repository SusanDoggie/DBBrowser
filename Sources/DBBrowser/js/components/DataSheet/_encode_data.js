import _ from 'lodash';
import { EJSON } from 'bson';

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

      case 'MaxKey':

        return 'MaxKey';

      case 'MinKey':

        return 'MinKey';

      case 'ObjectId':
      case 'ObjectID':

        return value.toHexString();

      case 'UUID':

        return value.toHexString(true);

      default: return EJSON.stringify(value);
    }
}
