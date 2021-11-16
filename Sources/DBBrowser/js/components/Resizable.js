import _ from 'lodash';
import React, { useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';

export default function Resizable({ header, headerContainerStyle, contentHeight, onContentHeightChanged, children }) {

  const headerRef = useRef();
  const [headerHeight, setHeaderHeight] = useState(0);

  function resize(e) {
    if (onContentHeightChanged) {
      const windowHeight = Dimensions.get('window').height;
      const height = Math.max(0, windowHeight - e.nativeEvent.pageY - 0.5 * headerHeight);
      onContentHeightChanged(height);
    }
  }

  return <React.Fragment>
    <div style={{
        userSelect: 'none',
        MozUserSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
      }}>
        <View
          ref={headerRef}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          onStartShouldSetResponder={(e) => e.target === headerRef.current}
          onMoveShouldSetResponder={(e) => e.target === headerRef.current}
          onStartShouldSetResponderCapture={() => false}
          onMoveShouldSetResponderCapture={() => false}
          onResponderTerminationRequest={() => false}
          onResponderMove={(e) => resize(e)}
          onResponderRelease={(e) => resize(e)}
          style={headerContainerStyle}>
          {header}
        </View>
    </div>
    <View style={{ height: contentHeight }}>
    {children}
    </View>
  </React.Fragment>
}
