import _ from 'lodash';
import React from 'react';
import { Text } from 'react-native';
import { Binary, UUID, EJSON } from 'bson';

export default  class ValueViewer extends React.PureComponent {

  render() {
    
    const value = this.props.value;
    
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
}
