import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Job } from '../../entities/job.entity';

@WebSocketGateway({
  namespace: '/jobs',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(_client: Socket) {}

  handleDisconnect(_client: Socket) {}

  emitJobUpsert(job: Job) {
    this.server.emit('job:upsert', job);
  }

  emitCrawlerStatus(status: {
    crawlerName: string;
    isActive: boolean;
    lastHeartbeatAt: Date | null;
    isOnline: boolean;
    offlineThresholdMinutes: number;
    message: string | null;
  }) {
    this.server.emit('crawler:status', status);
  }
}
