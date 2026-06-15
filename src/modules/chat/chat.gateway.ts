import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { jwtVerify } from 'jose';
import { appConfig } from '../../config/app-config';
import { ChatMessage } from '../../entities/chat-message.entity';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: false,
  },
  transports: ['polling', 'websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as any)?.token ||
      (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(appConfig.env.AUTH_SECRET),
      );
      client.data.userId = payload.sub as string;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  /** Client joins a specific room to receive messages */
  @SubscribeMessage('chat:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    if (client.data.userId) {
      client.join(`room:${roomId}`);
    }
  }

  /** Broadcast a new message to everyone in the room */
  emitMessage(roomId: string, message: ChatMessage) {
    this.server.to(`room:${roomId}`).emit('chat:message', message);
  }

  /** Broadcast member added/removed event */
  emitMemberUpdate(roomId: string, data: { type: 'added' | 'removed'; userId: string }) {
    this.server.to(`room:${roomId}`).emit('chat:member-update', data);
  }
}
