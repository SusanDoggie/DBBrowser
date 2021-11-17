import _ from 'lodash';
import React, { useEffect, useRef } from 'react';
import CodeMirror from 'react-codemirror';

export default function({ value, onChange, ...props }) {

	const ref = useRef();

	useEffect(() => {

		const codeMirror = ref.current.getCodeMirror();

		if (codeMirror.getValue() !== value) {
			codeMirror.setValue(value);
		}

	}, [value]);

	return <CodeMirror
		ref={ref}
		value={value}
		onChange={(newValue, change) => onChange && onChange(newValue, change)}
		{...props} />;
}