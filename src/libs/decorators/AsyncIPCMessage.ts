import { applyDecorators } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ipcMain } from 'electron';
import { ipcMessageDispatcher } from '../event';

export function HandleIPCMessage(messageChannel: string) {
	ipcMain.on(messageChannel, (...args) => ipcMessageDispatcher.emit(messageChannel, ...args));

	return applyDecorators(
		MessagePattern(messageChannel),
	);
}

export function HandleIPCMessageWithResult(messageChannel: string) {
	ipcMain.handle(messageChannel, (...args) => ipcMessageDispatcher.emit(messageChannel, ...args));

	return applyDecorators(
		MessagePattern(messageChannel),
	);
}
