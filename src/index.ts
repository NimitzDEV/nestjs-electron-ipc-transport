import { CustomTransportStrategy, MessageHandler, Server } from '@nestjs/microservices';
import { IpcMainEvent } from 'electron';
import { ipcMessageDispatcher } from './libs/event';

export interface IPCContext {
	evt: IpcMainEvent
}

export class ElectronIPCTransport extends Server implements CustomTransportStrategy {
	async onMessage(messageChannel: string, ...args: any[]): Promise<any> {
		const handler: MessageHandler | undefined = this.messageHandlers.get(messageChannel);
		if (handler) {
			this.logger.debug(`Process message ${messageChannel}`);
			const [ipcMainEventObject, payload] = args;
			return await handler(payload, {
				evt: ipcMainEventObject,
			});
		}

		this.logger.warn(`No handlers for message ${messageChannel}`);
	}

	close(): any {
	}

	listen(callback: () => void): any {
		this.logger.setContext(ElectronIPCTransport.name);
		ipcMessageDispatcher.on('ipc-message', this.onMessage.bind(this));
		callback();
	}
}

export * from './libs/decorators/AsyncIPCMessage';
