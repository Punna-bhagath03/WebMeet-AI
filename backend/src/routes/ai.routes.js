import { Router } from 'express';
import { chatWithAI } from '../controllers/ai.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', (req, res) => {
	res.status(200).json({
		service: 'ai',
		status: 'ok',
	});
});

router.post('/chat', verifyToken, chatWithAI);

export default router;