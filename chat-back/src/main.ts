import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TypeormStore } from 'connect-typeorm/out';
import { Session } from './utils/typeorm';
import * as session from 'express-session';
import * as passport from 'passport';
import { getRepository } from 'typeorm';
import { WebsocketAdapter } from './gateway/gateway.adapter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressPeerServer } from 'peer';

async function bootstrap() {
  const { PORT, COOKIE_SECRET } = process.env;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const sessionRepository = getRepository(Session);
  const adapter = new WebsocketAdapter(app);
  app.useWebSocketAdapter(adapter);
  app.setGlobalPrefix('api');
  // Reflect requesting Origin dynamically to avoid manual env config, allow cookies
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe());
  app.set('trust proxy', 'loopback');
  app.use(
    session({
      secret: COOKIE_SECRET,
      saveUninitialized: false,
      resave: false,
      name: 'CHAT_APP_SESSION_ID',
      cookie: {
        maxAge: 86400000, // cookie expires 1 day later
        // Development uses Vite proxy (same-origin) → Lax is correct
        // Production (HTTPS) → None + Secure
        sameSite: (process.env.ENVIRONMENT === 'PRODUCTION' ? 'none' : 'lax') as any,
        secure: (process.env.ENVIRONMENT === 'PRODUCTION') as any,
      },
      store: new TypeormStore().connect(sessionRepository),
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  try {
    // Mount PeerJS signaling server at /peerjs for WebRTC (PeerJS) connections
    const httpServer = app.getHttpServer();
    const peerServer = ExpressPeerServer(httpServer, {
      path: '/',
      proxied: true,
    });
    app.use('/peerjs', peerServer);

    await app.listen(PORT, () => {
      console.log(`Running on Port ${PORT}`);
      console.log(
        `Running in ${process.env.ENVIRONMENT} mode: ${process.env.ENVIRONMENT_MESSAGE}`,
      );
    });
  } catch (err) {
    console.log(err);
  }
}
bootstrap();
