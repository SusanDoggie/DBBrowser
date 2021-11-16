import _ from 'lodash';
import React, { createRef } from 'react';
import CodeMirror from 'react-codemirror';

export default class extends React.PureComponent {

	constructor(props) {
		super(props);

		this._value = props.value;
		this._ref = createRef();
	}

	componentDidUpdate() {
		
		if (this.props.value !== this._value) {
			this._value = this.props.value;
			this._ref.current.getCodeMirror().setValue(this._value);
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
	}

	render() {

		const {
			value,
			onChange,
			...props
		} = this.props;

		return <CodeMirror
			ref={this._ref}
			value={value}
			onChange={(newValue, change) => this.onChange(newValue, change)}
			{...props} />;
	}
  }
  
