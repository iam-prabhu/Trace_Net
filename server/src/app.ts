import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';

import apiRouter from './routes/index';
import { errorHandler, notFound } from './middleware/error.middleware';
import { registerCollaborationHandlers } from './sockets/index';
import { env } from './config/env';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Global middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// Swagger UI (placeholder)
const swaggerDoc = {
  openapi: '3.0.0',
  info: { title: 'Fraud Detection API', version: '1.0.0' },
  paths: {},
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// API routes
app.use('/api', apiRouter);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Register Socket.IO handlers
registerCollaborationHandlers(io);

export { app, httpServer, io };
