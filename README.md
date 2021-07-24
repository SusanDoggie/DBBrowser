# DBBrowser

[![Github Actions](https://github.com/SusanDoggie/DBBrowser/workflows/Builder/badge.svg)](https://github.com/SusanDoggie/DBBrowser/actions)
[![codecov](https://codecov.io/gh/SusanDoggie/DBBrowser/branch/main/graph/badge.svg)](https://codecov.io/gh/SusanDoggie/DBBrowser)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-lightgrey.svg?style=flat)
[![GitHub release](https://img.shields.io/github/release/SusanDoggie/DBBrowser.svg)](https://github.com/SusanDoggie/DBBrowser/releases)
[![Swift](https://img.shields.io/badge/swift-5.3-orange.svg?style=flat)](https://swift.org)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

## Introduction

Database browser.

## System Requirements

For linux platforms, you need to install some of database drivers.

### Ubuntu

#### MongoDB

    apt-get -y install libmongoc-1.0-0 libbson-1.0-0 libssl-dev

### CentOS 8

#### MongoDB

    yum -y install mongo-c-driver libbson openssl-devel

### Amazon Linux 2

#### MongoDB

    yum -y install mongo-c-driver libbson openssl-devel
