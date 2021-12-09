//
//  WebSocketRoute.swift
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

public class WebSocketRoute: RouteCollection {
    
    public var logger: Logger
    
    private let encoder = ExtendedJSONEncoder()
    private let decoder = ExtendedJSONDecoder()
    
    public init(logger: Logger) {
        self.logger = logger
    }
    
    public func boot(routes: RoutesBuilder) throws {
        
        routes.webSocket("ws") { req, ws in
            
            let session = Session()
            
            ws.onText {
                do {
                    try self.onMessage($0, session, self.decoder.decode(BSON.self, from: $1._utf8_data))
                } catch {
                    self.logger.error("\(error)")
                }
            }
            
            ws.onBinary {
                do {
                    try self.onMessage($0, session, self.decoder.decode(BSON.self, from: $1))
                } catch {
                    self.logger.error("\(error)")
                }
            }
            
            ws.onClose.whenComplete {
                switch $0 {
                case .success: self.onClose(session, nil)
                case let .failure(error): self.onClose(session, error)
                }
            }
        }
    }
}

extension WebSocketRoute {
    
    enum DatabaseType {
        
        case sql
        
        case mongo
    }
    
    private class Session {
        
        var connection: DBConnection?
        
        var reconnect: ((String, EventLoop) -> EventLoopFuture<DBConnection>)?
        
        var type: DatabaseType?
    }
}

extension WebSocketRoute {
    
    private func send(_ ws: WebSocket, _ message: BSONDocument) {
        try? ws.send(raw: encoder.encode(message), opcode: .text)
    }
}

extension WebSocketRoute {
    
    private func onMessage(_ ws: WebSocket, _ session: Session, _ message: BSON) {
        
        do {
            
            switch message["action"].stringValue {
            case "connect":
                
                guard let url = message["url"].stringValue.flatMap(URLComponents.init(string:)) else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid url")])
                    return
                }
                
                Database.connect(url: url, on: ws.eventLoop).whenComplete {
                    switch $0 {
                    case let .success(connection):
                        
                        session.reconnect = { database, eventLoop in
                            var url = url
                            url.path = "/\(database)"
                            return Database.connect(url: url, on: eventLoop)
                        }
                        
                        if url.scheme == "mongodb" {
                            session.type = .mongo
                        } else if connection is DBSQLConnection {
                            session.type = .sql
                        }
                        
                        session.connection = connection
                        self.send(ws, ["success": true, "token": message["token"]])
                        
                    case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                    }
                }
                
            case "reconnect":
                
                guard let reconnect = session.reconnect else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                    return
                }
                
                guard let database = message["database"].stringValue else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                    return
                }
                
                reconnect(database, ws.eventLoop).whenComplete {
                    switch $0 {
                    case let .success(connection):
                        
                        _ = session.connection?.close()
                        session.connection = connection
                        self.send(ws, ["success": true, "token": message["token"]])
                        
                    case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                    }
                }
                
            case "databases":
                
                guard let connection = session.connection else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                    return
                }
                
                connection.databases().whenComplete {
                    switch $0 {
                    case let .success(result): self.send(ws, ["success": true, "token": message["token"], "data": BSON(result)])
                    case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                    }
                }
                
            case "tables":
                
                switch session.type {
                case .sql:
                    
                    guard let connection = session.connection as? DBSQLConnection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    connection.tables().whenComplete {
                        switch $0 {
                        case let .success(tables): self.send(ws, ["success": true, "token": message["token"], "data": BSON(tables)])
                        case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                        }
                    }
                    
                case .mongo:
                    
                    guard let connection = session.connection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    connection.mongoQuery().collections().execute()
                        .flatMap { $0.toArray() }
                        .map { $0.compactMap { $0.type == .collection ? $0.name : nil } }
                        .whenComplete {
                            switch $0 {
                            case let .success(tables): self.send(ws, ["success": true, "token": message["token"], "data": BSON(tables)])
                            case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                            }
                        }
                    
                default: self.send(ws, ["success": false, "token": message["token"], "error": .string("unknown error")])
                }
                
            case "views":
                
                switch session.type {
                case .sql:
                    
                    guard let connection = session.connection as? DBSQLConnection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    connection.views().whenComplete {
                        switch $0 {
                        case let .success(tables): self.send(ws, ["success": true, "token": message["token"], "data": BSON(tables)])
                        case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                        }
                    }
                    
                case .mongo:
                    
                    guard let connection = session.connection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    connection.mongoQuery().collections().execute()
                        .flatMap { $0.toArray() }
                        .map { $0.compactMap { $0.type == .view ? $0.name : nil } }
                        .whenComplete {
                            switch $0 {
                            case let .success(tables): self.send(ws, ["success": true, "token": message["token"], "data": BSON(tables)])
                            case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                            }
                        }
                    
                default: self.send(ws, ["success": false, "token": message["token"], "error": .string("unknown error")])
                }
                
            case "materializedViews":
                
                switch session.type {
                case .sql:
                    
                    guard let connection = session.connection as? DBSQLConnection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    connection.materializedViews().whenComplete {
                        switch $0 {
                        case let .success(tables): self.send(ws, ["success": true, "token": message["token"], "data": BSON(tables)])
                        case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                        }
                    }
                    
                default: self.send(ws, ["success": false, "token": message["token"], "error": .string("unknown error")])
                }
                
            case "tableInfo":
                
                switch session.type {
                case .sql:
                    
                    guard let connection = session.connection as? DBSQLConnection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    guard let table = message["table"].stringValue else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                        return
                    }
                    
                    connection.columns(of: table)
                        .and(connection.primaryKey(of: table))
                        .whenComplete {
                            switch $0 {
                            case let .success((columns, primaryKey)):
                                
                                self.send(ws, [
                                    "success": true,
                                    "token": message["token"],
                                    "data": [
                                        "primaryKey": BSON(primaryKey),
                                        "columns": BSON(columns.map { [
                                            "name": BSON($0.name),
                                            "type": BSON($0.type),
                                            "isOptional": BSON($0.isOptional),
                                        ] }),
                                    ]
                                ])
                                
                            case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                            }
                        }
                    
                case .mongo:
                    
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("unsupported operation")])
                    
                default: self.send(ws, ["success": false, "token": message["token"], "error": .string("unknown error")])
                }
                
            case "deleteRows":
                
                guard let connection = session.connection else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                    return
                }
                
                guard let table = message["table"].stringValue else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                    return
                }
                
                guard let delete = message["delete"].arrayValue?.compactMap({ $0.documentValue }) else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                    return
                }
                
                let _delete = try delete.map { try Dictionary(uniqueKeysWithValues: $0.map { try ($0.key, DBData($0.value)) }) }
                
                if _delete.contains(where: { $0.isEmpty }) {
                    
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                    
                } else {
                    
                    connection.query()
                        .find(table)
                        .filter { x in .or(_delete.map { .and($0.map { x[$0.key] == $0.value }) }) }
                        .delete()
                        .whenComplete {
                            switch $0 {
                            case .success: self.send(ws, ["success": true, "token": message["token"]])
                            case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                            }
                        }
                }
                
            case "updateItems":
                
                guard let connection = session.connection else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                    return
                }
                
                guard let table = message["table"].stringValue else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                    return
                }
                
                guard let updates = message["update"].arrayValue else {
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                    return
                }
                
                let _updates: [([String : DBData], [String : DBData])] = try updates.map {
                    
                    let _key = try $0["key"].documentValue.map { try Dictionary(uniqueKeysWithValues: $0.map { try ($0.key, DBData($0.value)) }) }
                    let _update = try $0["update"].documentValue.map { try Dictionary(uniqueKeysWithValues: $0.map { try ($0.key, DBData($0.value)) }) }
                    
                    return (_key ?? [:], _update ?? [:])
                }
                
                if _updates.contains(where: { $0.isEmpty || $1.isEmpty }) {
                    
                    self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                    
                } else {
                    
                    let results = _updates.map { key, update in
                        
                        connection.query()
                            .findOne(table)
                            .filter { x in .and(key.map { x[$0.key] == $0.value }) }
                            .update(update)
                    }
                    
                    results.flatten(on: ws.eventLoop)
                        .whenComplete {
                            switch $0 {
                            case .success: self.send(ws, ["success": true, "token": message["token"]])
                            case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                            }
                        }
                }
                
            case "runCommand":
                
                switch session.type {
                case .sql:
                    
                    guard let connection = session.connection as? DBSQLConnection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    guard let command = message["command"].stringValue else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                        return
                    }
                    
                    connection.execute(SQLRaw(command)).whenComplete {
                        switch $0 {
                        case let .success(rows):
                            
                            do {
                                
                                let result = try rows.map { try BSONDocument($0) }
                                
                                self.send(ws, ["success": true, "token": message["token"], "data": result.toBSON()])
                                
                            } catch {
                                self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                            }
                            
                        case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                        }
                    }
                    
                case .mongo:
                    
                    guard let connection = session.connection else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("database not connected")])
                        return
                    }
                    
                    guard let _command = message["command"].binaryValue,
                          let command = try? BSONDocument(fromBSON: _command.data) else {
                        self.send(ws, ["success": false, "token": message["token"], "error": .string("invalid command")])
                        return
                    }
                    connection.mongoQuery().runCommand(command).whenComplete {
                        switch $0 {
                        case let .success(result): self.send(ws, ["success": true, "token": message["token"], "data": .document(result)])
                        case let .failure(error): self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
                        }
                    }
                    
                default: self.send(ws, ["success": false, "token": message["token"], "error": .string("unknown error")])
                }
                
            default: self.send(ws, ["success": false, "token": message["token"], "error": .string("unknown action")])
            }
            
        } catch {
            self.send(ws, ["success": false, "token": message["token"], "error": .string("\(error)")])
        }
    }
    
    private func onClose(_ session: Session, _ error: Error?) {
        guard let connection = session.connection else { return }
        _ = connection.close()
        session.connection = nil
    }
}
