import compression from 'compression';
import connect from 'connect';
import {createHash} from 'crypto';
import {readFile} from 'fs';
import {createServer, IncomingMessage, ServerResponse} from 'http';
import {basename} from 'path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import send from 'send';
import systemdSocket from 'systemd-socket';
import {server as WebSocketServer} from 'websocket';
import {Action} from '../datastructure/actions';
import {createActionHandler, open, save} from './Orga';

type JsFileState = {
    content: string;
    mapContent: string;
    hash: string;
    path: string;
};

const jsFile: JsFileState = {content: '', mapContent: '', hash: '', path: ''};
let cssData = '';

const WEB_SERVER = '/tarot';
const BUILD_DIR = 'dist';
const PORT = 8181;
const IMG_DIR = __dirname + '/../../img/';

function loadJSFile(js: JsFileState, file: string) {
    readFile(BUILD_DIR + '/' + file + '.js', 'utf8', (err, data) => {
        if (err) {
            console.error('Javascript file for browser not found!');
            return;
        }

        js.content = data;
        const shasum = createHash('sha1');
        shasum.update(js.content);
        js.hash = shasum.digest('hex');
        js.path = WEB_SERVER + '/static/' + file + '-' + js.hash.substring(0, 16) + '.js';
    });
    readFile(BUILD_DIR + '/' + file + '.js.map', 'utf8', (err, data) => {
        if (err) {
            console.info('Javascript mapping file for browser not found!');
            return;
        }

        js.mapContent = data;
    });
}

function loadCSSFile(file: string) {
    readFile(BUILD_DIR + '/' + file + '.css', 'utf8', (err, data) => {
        if (err) {
            console.error('ERROR: main.css not found');
            return;
        }
        cssData = data;
    });
}

function loadJSCSSFile() {
    loadJSFile(jsFile, 'main');
    loadCSSFile('../style/main');
    console.info('Loaded js and css file');
}

loadJSCSSFile();

function serveJS(js: JsFileState, req: IncomingMessage, res: ServerResponse) {
    if (req.url === js.path) {
        if ('if-none-match' in req.headers) {
            res.writeHead(304);
            res.end();
        } else {
            res.writeHead(200, {
                'Cache-Control': 'max-age=31536000',
                'Content-Type': 'text/javascript',
                'ETag': 'yes:)',
            });
            res.end(js.content);
        }
        return true;
    }
    if (req.url?.endsWith('.js.map')) {
        if ('if-none-match' in req.headers) {
            res.writeHead(304);
            res.end();
        } else {
            res.writeHead(200, {
                'Cache-Control': 'max-age=31536000',
                'Content-Type': 'application/json',
                'ETag': 'yes:)',
            });
            res.end(js.mapContent);
        }
        return true;
    }
    return false;
}

function reactHandler(req: IncomingMessage, res: ServerResponse) {
    if (process.env.NODE_ENV !== 'production') {
        loadJSCSSFile();
    }
    if (serveJS(jsFile, req, res)) {
        return;
    }

    if (req.url && req.url.startsWith(WEB_SERVER)) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-transform,private,no-cache');

        // <meta name="theme-color" content="#4caf50"/>
        const html = '<!DOCTYPE html>' +
            renderToStaticMarkup(<html lang="fr">
            <head>
                <meta charSet="utf-8"/>
                <meta name="viewport" content="width=device-width"/>
                <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
                <link rel="icon" href={WEB_SERVER + '/img/icon.svg'}/>
                <link rel="icon" sizes="192x192" href={WEB_SERVER + '/img/icon.png'}/>
                <meta name="apple-mobile-web-app-capable" content="yes"/>
                <link rel="apple-touch-icon" href={WEB_SERVER + '/img/icon.png'}/>
                <style dangerouslySetInnerHTML={{__html: cssData}}/>
            </head>
            <body>
            <div id="content"/>
            <script src={jsFile.path}
                    async/>
            </body>
            </html>);

        res.end(html);
    } else {
        res.statusCode = 404;
        res.end('Not found');
    }
}

function servestatic(req: IncomingMessage, res: ServerResponse, next: Function) {
    function error(err: any) {
        console.error(err);
        next();
    }

    if (!req.url) {
        error('Empty url');
        return;
    }
    if (req.url === '/' || req.url === '/tarot/') {
        next();
        return;
    }
    send(req, basename(decodeURI(req.url)), {root: IMG_DIR, maxAge: 86400000})
        .on('error', error)
        .pipe(res);
}

const app = connect();
app.use((req: IncomingMessage, res: ServerResponse, next: Function) => {
    res.setHeader('Vary', 'Accept-Language');
    next();
});
app.use(compression() as (req: IncomingMessage, res: ServerResponse, next: Function) => void);
app.use(servestatic);
app.use(reactHandler);

const fdOrPort = systemdSocket() || PORT;
const webserver = createServer(app);
webserver.listen(fdOrPort, () => {
    console.info('Listening on ' + fdOrPort + '...');
});

const wsServer = new WebSocketServer({
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false,
    httpServer: webserver,
});

function originIsAllowed(origin: string) {
    // TODO put logic here to detect whether the specified origin is allowed.
    return true;
}

const saveFile = 'tarotjeux.json';
open(saveFile);

wsServer.on('request', request => {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.debug((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    const connection = request.accept('tarot-protocol', request.origin);
    console.debug((new Date()) + ' Connection accepted.');

    const actionHandler = createActionHandler(connection);

    connection.on('message', message => {
        if (message.type === 'utf8' && message.utf8Data) {
            console.debug('Received Message: ' + message.utf8Data);
            const m: Action = JSON.parse(message.utf8Data);
            console.debug(m);
            actionHandler(m);
        }
    });
    connection.on('close', (reasonCode, description) => {
        console.debug((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected:', reasonCode, description);
    });
});

function saveAndExit() {
    save(saveFile, () => process.exit());
}

process.on('SIGINT', saveAndExit);
process.on('SIGTERM', saveAndExit);
