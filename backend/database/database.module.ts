import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import mongooseConfigFactory from "./mongoose.config";

@Global()
@Module({
  imports: [
    // Ensure ConfigModule is available to read env vars; AppModule should call ConfigModule.forRoot()
    ConfigModule,
    // Centralized connection — app-wide
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mongooseConfigFactory,
    }),

    // No schemas registered here — each subsystem should register its own schemas
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
