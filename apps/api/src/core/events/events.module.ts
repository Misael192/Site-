import { Global, Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { OutboxService } from "./outbox.service";

@Global()
@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: true, delimiter: "." })],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class EventsModule {}
