//
//  App.js
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
import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Home from './pages/Home';
import NotFound from './pages/NotFound';

function Page({ children, author, description, keywords, meta, ...props }) {
  return <Route render={({ staticContext }) => {
    if (staticContext) {
      for (const [key, value] of Object.entries(props)) {
        staticContext[key] = value;
      }
      staticContext.meta = { author, description, keywords, ...meta };
    }
    return children;
  }} {...props} />;
}

export default function App() {
  return <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}>
    <Switch>
    <Page exact path='/' title='Home'><Home /></Page>
    <Page path='*' title='404 Not Found' statusCode={404}><NotFound /></Page>
    </Switch>
  </SafeAreaProvider>;
}
