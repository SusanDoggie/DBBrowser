//
//  ReactRoute.swift
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

public class ReactRoute: RouteCollection {
    
    public func boot(routes: RoutesBuilder) throws {
        
        try ReactRoute.setupReact(routes: routes)
    }
}

extension ReactRoute {
    
    private static func setupReact(routes: RoutesBuilder) throws {
        
        let publicDirectory = JSBundleURL.appendingPathComponent("public")
        let routes = routes.grouped(FileMiddleware(publicDirectory: publicDirectory.path))
        
        let privateDirectory = JSBundleURL.appendingPathComponent("private")
        let serverScript = privateDirectory.appendingPathComponent("js").appendingPathComponent("server.js")
        
        let react = try ReactController(bundle: "/js/main.js", serverScript: serverScript)
        
        react.preloadedStateHandler = { req in
            
            if let preferredLocale = req.cookies["PREFERRED_LOCALE"]?.string {
                
                return req.eventLoop.makeSucceededFuture([
                    "i18n": [
                        "preferredLocale": Json(preferredLocale)
                    ]
                ])
            }
            
            let acceptLanguage = req.headers["Accept-Language"].flatMap { $0.split(separator: ",") }
            
            for language in acceptLanguage {
                
                let lang = language.firstIndex(of: ";").map { language[..<$0] } ?? language
                
                return req.eventLoop.makeSucceededFuture([
                    "i18n": [
                        "preferredLocale": Json(lang.trimmingCharacters(in: .whitespaces))
                    ]
                ])
            }
            
            return req.eventLoop.makeSucceededFuture([:])
        }
        
        try routes.register(collection: react)
    }
}
