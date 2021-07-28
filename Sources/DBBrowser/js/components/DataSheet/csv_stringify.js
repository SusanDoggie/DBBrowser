import _ from 'lodash';

function to_string(value) {

  const str = `${value}`;
  
  if (str.includes(',') || str.includes('"') || str.includes('\r') || str.includes('\n')) {
    return `"${str.replace(/\"/g, '""')}"`;
  }
  
  return str;
}

export default function csv_stringify(data) {
  return data.map(rows => rows.map(x => to_string(x)).join(',')).join('\r\n');
}
