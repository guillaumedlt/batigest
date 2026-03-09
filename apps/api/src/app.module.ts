import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Les modules metier seront ajoutes ici
    // ContactsModule,
    // DevisModule,
    // FacturesModule,
    // AchatsModule,
    // TvaModule,
    // CalendrierModule,
    // FraisModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
