//
//  Button.js
//
//  The MIT License
//  Copyright (c) 2015 - 2021 Susan Cheng. All rights reserved.
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
import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';

const icons_map = require('doggie-react-ui/Icons');

export default function Button({ icon, iconStyle, iconHoverStyle, title, style, hoverStyle, titleStyle, titleHoverStyle, render, onHoverIn, onHoverOut, ...props }) {

	const [isHover, setIsHover] = useState(false);

	const _onHoverIn = onHoverIn ?? (() => setIsHover(true));
	const _onHoverOut = onHoverOut ?? (() => setIsHover(false));

	const _style = isHover ? { ...style, ...titleHoverStyle } : { ...style };
	const _iconStyle = isHover ? { ...iconStyle, ...iconHoverStyle } : { ...iconStyle };
	const _titleStyle = isHover ? { ...titleStyle, ...titleHoverStyle } : { ...titleStyle };

	const Icon = icons_map[icon];

	let content;

	if (_.isNil(render)) {

		if (!_.isEmpty(Icon) && !_.isEmpty(title)) {
			content = <Text style={{ color: 'white', ..._titleStyle }}><Icon {..._iconStyle} /> {title}</Text>;
		} else if (!_.isEmpty(Icon)) {
			content = <Icon color='white' {..._iconStyle} />;
		} else if (!_.isEmpty(title)) {
			content = <Text style={{ color: 'white', ..._titleStyle }}>{title}</Text>;
		}

	} else {
		content = render({ isHover });
	}

	return <Pressable
	onHoverIn={_onHoverIn}
	onHoverOut={_onHoverOut}
	style={{
		padding: 8,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: isHover ? '#1691E8' : '#2196F3',
		..._style
	}} {...props}>
		{content}
	</Pressable>;
}
  
