//
//  Resizable.js
//
//  The MIT License
//  Copyright (c) 2015 - 2022 Susan Cheng. All rights reserved.
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
          onResponderMove={resize}
          onResponderRelease={resize}
          style={headerContainerStyle}>
          {header}
        </View>
    </div>
    <View style={{ height: contentHeight }}>
    {children}
    </View>
  </React.Fragment>
}
