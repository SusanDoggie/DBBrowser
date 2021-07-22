
import AntDesign from 'react-native-vector-icons/Fonts/AntDesign.ttf';
import Entypo from 'react-native-vector-icons/Fonts/Entypo.ttf';
import EvilIcons from 'react-native-vector-icons/Fonts/EvilIcons.ttf';
import Feather from 'react-native-vector-icons/Fonts/Feather.ttf';
import FontAwesome from 'react-native-vector-icons/Fonts/FontAwesome.ttf';
import FontAwesome5 from 'react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf';
import FontAwesome5Brands from 'react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf';
import Fontisto from 'react-native-vector-icons/Fonts/Fontisto.ttf';
import Foundation from 'react-native-vector-icons/Fonts/Foundation.ttf';
import Ionicons from 'react-native-vector-icons/Fonts/Ionicons.ttf';
import MaterialCommunityIcons from 'react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf';
import MaterialIcons from 'react-native-vector-icons/Fonts/MaterialIcons.ttf';
import Octicons from 'react-native-vector-icons/Fonts/Octicons.ttf';
import SimpleLineIcons from 'react-native-vector-icons/Fonts/SimpleLineIcons.ttf';
import Zocial from 'react-native-vector-icons/Fonts/Zocial.ttf';

const iconFontStyles = `
  @font-face {
    src: url(${AntDesign});
    font-family: AntDesign;
  }
  @font-face {
    src: url(${Entypo});
    font-family: Entypo;
  }
  @font-face {
    src: url(${EvilIcons});
    font-family: EvilIcons;
  }
  @font-face {
    src: url(${Feather});
    font-family: Feather;
  }
  @font-face {
    src: url(${FontAwesome});
    font-family: FontAwesome;
  }
  @font-face {
    src: url(${FontAwesome5});
    font-family: FontAwesome5;
  }
  @font-face {
    src: url(${FontAwesome5Brands});
    font-family: FontAwesome5Brands;
  }
  @font-face {
    src: url(${Fontisto});
    font-family: Fontisto;
  }
  @font-face {
    src: url(${Foundation});
    font-family: Foundation;
  }
  @font-face {
    src: url(${Ionicons});
    font-family: Ionicons;
  }
  @font-face {
    src: url(${MaterialCommunityIcons});
    font-family: MaterialCommunityIcons;
  }
  @font-face {
    src: url(${MaterialIcons});
    font-family: MaterialIcons;
  }
  @font-face {
    src: url(${Octicons});
    font-family: Octicons;
  }
  @font-face {
    src: url(${SimpleLineIcons});
    font-family: SimpleLineIcons;
  }
  @font-face {
    src: url(${Zocial});
    font-family: Zocial;
  }
`;

const style = document.createElement('style');
style.type = 'text/css';
if (style.styleSheet) {
  style.styleSheet.cssText = iconFontStyles;
} else {
  style.appendChild(document.createTextNode(iconFontStyles));
}

document.head.appendChild(style);