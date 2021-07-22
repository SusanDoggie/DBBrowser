import _ from 'lodash';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import CodeMirror from 'react-codemirror';

export default class extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			token: uuidv4(),
		};
	}

	componentDidUpdate() {
		
		if (this.props.value !== this.state.value) {
			this.setState({ token: uuidv4(), value: this.props.value });
		}
	}

	onChange(newValue, change) {

		const {
			onChange,
		} = this.props;

		this.state.value = newValue;

		if (onChange) {
			onChange(newValue, change);
		}
	}

	render() {

		const {
			onChange,
			...props
		}=  this.props;

		return <CodeMirror 
			key={this.state.token}
			onChange={(newValue, change) => this.onChange(newValue, change)}
			{...props} />;
	}
  }
  
