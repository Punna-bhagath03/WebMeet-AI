import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import env from './config/env.js';
import userRoutes from './routes/users.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

app.use(
	cors({
		origin: env.corsOrigin,
		credentials: true,
	})
);
app.use(helmet());
app.use(express.json({ limit: '40kb' }));
app.use(express.urlencoded({ limit: '40kb', extended: true }));
app.use(cookieParser());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use((req, res) => {
	return res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
	console.error('Unhandled error:', error);
	return res.status(500).json({ error: 'Internal server error' });
});

export default app;
