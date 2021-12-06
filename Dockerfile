#
#  Dockerfile
#
#  The MIT License
#  Copyright (c) 2015 - 2021 Susan Cheng. All rights reserved.
#
#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to deal
#  in the Software without restriction, including without limitation the rights
#  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#  copies of the Software, and to permit persons to whom the Software is
#  furnished to do so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included in
#  all copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#  THE SOFTWARE.
#

FROM node AS bundler
WORKDIR /worker
COPY . .

RUN yarn install && yarn webpack --mode production

FROM swift AS builder

RUN apt-get update \
 && apt-get install -y libjavascriptcoregtk-4.0-dev \
 && apt-get install -y libmongoc-1.0-0 libssl-dev \
 && rm -r /var/lib/apt/lists/*

WORKDIR /worker
COPY --from=bundler /worker .

RUN swift build -c release \
 && mkdir app && cp -r "$(swift build -c release --show-bin-path)" app/ \
 && cd app/release \
 && rm -rf *.o \
 && rm -rf *.build \
 && rm -rf *.swiftdoc \
 && rm -rf *.swiftmodule \
 && rm -rf *.swiftsourceinfo \
 && rm -rf *.product \
 && rm -rf ModuleCache \
 && rm -f description.json

FROM swift:slim

RUN apt-get update \
 && apt-get install -y libjavascriptcoregtk-4.0-bin \
 && rm -r /var/lib/apt/lists/*

WORKDIR /worker/.build/x86_64-unknown-linux-gnu
COPY --from=builder /worker/app .

EXPOSE 8080

ENTRYPOINT ["./release/DBBrowser"]
CMD ["serve", "--env", "production", "--hostname", "0.0.0.0"]
