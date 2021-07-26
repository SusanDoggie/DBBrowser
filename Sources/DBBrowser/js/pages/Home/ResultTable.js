import _ from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import JsonCode from './JsonCode';
import DataSheet from '../../components/DataSheet';

export default class ResultTable extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
			token: uuidv4(),
    };
  }

  renderBody() {
    
    if (!_.isArray(this.props.data)) {
      return <JsonCode key={`jsoncode-${this.state.token}`} value={this.props.data} space={4} />;
    }

    switch (this.props.displayStyle) {

      case 'table':

        const { 
          columnSettingKey,
        } = this.props;
        
        const columns = this.props.data.reduce((result, x) => _.uniq(result.concat(Object.keys(x))), []);
        const grid = this.props.data.map(x => columns.map(c => x[c]));

        return <DataSheet key={`datasheet2-${this.state.token}`} data={grid} columns={columns} columnSettingKey={columnSettingKey} />;

      case 'raw':
        return <JsonCode key={`jsoncode-${this.state.token}`} value={this.props.data} space={4} />;
    }
  }

  render() {
    
    const { 
      data,
      ...props
    } = this.props;
    
    return <View {...props}>
      <div style={{ flex: 1, overflow: 'scroll' }}>
        {this.renderBody()}
      </div>
    </View>;
  }
}