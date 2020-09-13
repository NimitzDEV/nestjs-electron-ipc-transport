## nestjs-electron-ipc-transport

## Description

`nestjs-electron-ipc-transport` is a custom micro-service transport for `NestJS`, and let you integrate `NestJS` into your `electron` main process in a more reasonable way.

Keep in mind that `NestJS` is a framework designed for back-end, so this integration solution is design for code in main process. In traditional B/S architecture, user's browsers running front-end application, servers running back-end application, and communicate using HTTP protocol with each other. In electron's scenario, renderer process is the front-end, main process is the back-end, and IPC is the communication protocol.

## How to use this package properly?

Basically, this package act as a custom micro-service transport for `NestJS`, and add event listeners automatically, when messages send from renderer process, the respective method in controller will be called. To send messages safely, you should use `contextBridge` offered by `electron` and enable `contextIsolation`.

## Install

`yarn add nestjs-electron-ipc-transport`

or

`npm install nestjs-electron-ipc-transport`

## Usage

see full example [here](https://github.com/NimitzDEV/nestjs-electron-integration-example)

### Bootstrap your nestjs app

```javascript
import { NestFactory } from '@nestjs/core';
import { app as electronApp, BrowserWindow } from 'electron';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ElectronIPCTransport } from 'nestjs-electron-ipc-transport';
import { resolve } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new ElectronIPCTransport(),
    },
  );

  app.listen(() => console.log('app started'));
  electronApp.whenReady()
    .then(async () => {
      const win = new BrowserWindow({
        webPreferences: {
          contextIsolation: true,
          preload: resolve(__dirname, './bridge/index.js'),
        },
      });
      await win.loadFile('../../dist/renderer/index.html');
    });
}

bootstrap();

```

### Add bridge API for sending messages

```javascript
import { contextBridge, ipcRenderer } from 'electron';

export const Bridge = {
  app: appBridge,
};

contextBridge.exposeInMainWorld(
  'AppBridge',
   {
       app: {
           maximize() => ipcRenderer.send('app.maximize'),
       	   getUser() => ipcRenderer.invoke('app.get-user'),
    	   prompt(message) => ipcRenderer.send('app.prompt', message),
       }
   },
);

```

### Link messages to controller

```javascript
import { Controller } from '@nestjs/common';
import { BrowserWindow, dialog } from 'electron';
import { AppService } from './app.service';
import { HandleIPCMessageWithResult, HandleIPCMessage, IPCContext } from 'electron-ipc-transport';
import { Ctx, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @HandleIPCMessageWithResult('app.get-user')
  getUser() {
    return {
        name: 'NimitzDEV'
    };
  }
    
  @HandleIPCMessage('app.prompt')
  promptFromMain(
    @Payload() data: string,
  ) {
    dialog.showMessageBox({
        title: 'Messages from renderer',
        message: data,
    });
  }

  @HandleIPCMessage('app.maximize')
  max(
    @Ctx() ctx: IPCContext,
  ) {
    BrowserWindow.fromWebContents(ctx.evt.sender).maximize();
  }
}

```

## APIs

#### @HandleIPCMessageWithResult(channel)

As name suggest, methods decorated with this decorator will return it's results to renderer process. Corresponds to `ipcRenderer.invoke` and `ipcRenderer.handle`.

#### @HandleIPCMessage(channel)

Mthods decorated with this decorator will be called without passing it's results to renderer process.

### Limitations

You could only pass all your parameters inside first parameter slot.

```javascript
ipcRenderer.send('app.message', 'hello', 'word'); // @Payload will only received 'hello'
ipcRenderer.send('app.message', {title: 'hello', message: 'word'}); // This is the proper way to pass more than one parameters.
```

## Interface

`IPCContext` contains one property call `evt`, it's the same as `IpcMainEvent` object.

## License

This package is MIT Licensed.
