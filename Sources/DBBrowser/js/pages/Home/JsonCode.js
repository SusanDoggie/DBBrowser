import _ from 'lodash';
import React from 'react';
import { EJSON } from 'bson';
import CodeMirror from '../../components/CodeMirror';

export default function JsonCode({ value, replacer, space, options, ...props }) {
  return <CodeMirror 
    value={EJSON.stringify(value, replacer, space)}
    options={{ 
      readOnly: true,
      mode: 'application/x-json',
      ...options
    }}
    {...props} />
}
