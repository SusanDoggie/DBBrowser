import _ from 'lodash';
import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';

import AntDesign from 'react-native-vector-icons/dist/AntDesign';
import Entypo from 'react-native-vector-icons/dist/Entypo';
import EvilIcons from 'react-native-vector-icons/dist/EvilIcons';
import Feather from 'react-native-vector-icons/dist/Feather';
import FontAwesome from 'react-native-vector-icons/dist/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/dist/FontAwesome5';
import FontAwesome5Pro from 'react-native-vector-icons/dist/FontAwesome5Pro';
import Fontisto from 'react-native-vector-icons/dist/Fontisto';
import Foundation from 'react-native-vector-icons/dist/Foundation';
import Ionicons from 'react-native-vector-icons/dist/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import Octicons from 'react-native-vector-icons/dist/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/dist/SimpleLineIcons';
import Zocial from 'react-native-vector-icons/dist/Zocial';

const icons_map = {
    'AntDesign': AntDesign,
    'Entypo': Entypo,
    'EvilIcons': EvilIcons,
    'Feather': Feather,
    'FontAwesome': FontAwesome,
    'FontAwesome5': FontAwesome5,
    'FontAwesome5Pro': FontAwesome5Pro,
    'Fontisto': Fontisto,
    'Foundation': Foundation,
    'Ionicons': Ionicons,
    'MaterialCommunityIcons': MaterialCommunityIcons,
    'MaterialIcons': MaterialIcons,
    'Octicons': Octicons,
    'SimpleLineIcons': SimpleLineIcons,
    'Zocial': Zocial,
}

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
  
