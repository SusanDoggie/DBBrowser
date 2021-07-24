import _ from 'lodash';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import CodeMirror from 'react-codemirror';

export default class extends React.PureComponent {

	constructor(props) {
		super(props);

		this.state = {
			token: uuidv4(),
		};

		this._value = props.value;
	}

	componentDidUpdate() {
		
		if (this.props.value !== this._value) {
			this._value = this.props.value;
			this.setState({ token: uuidv4() });
		}
	}

	onChange(newValue, change) {

		const {
			onChange,
		} = this.props;

		this._value = newValue;

		if (onChange) {
			onChange(newValue, change);
		}

		if (change.origin == 'paste' && _.isArray(change.removed) && change.removed.length == 1 && !_.isEmpty(change.removed[0])) {
			this.setState({ token: uuidv4() });
		}
	}

	render() {

		const {
			value,
			onChange,
			...props
		} = this.props;

		return <CodeMirror
			value={value}
			key={this.state.token}
			onChange={(newValue, change) => this.onChange(newValue, change)}
			{...props} />;
	}
  }
  
