import { Router } from 'express';
import {
  addToHistory,
  getUserHistory,
  login,
  logout,
  refresh,
  register,
} from '../controllers/user.controller.js';
import { requireTrustedOrigin } from '../middlewares/csrf.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import {
  authLimiter,
  refreshLimiter,
} from '../middlewares/rateLimit.middleware.js';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    service: 'users',
    status: 'ok',
  });
});

router.route('/login').post(authLimiter, login);
router.route('/register').post(authLimiter, register);
router.route('/refresh').post(refreshLimiter, requireTrustedOrigin, refresh);
router.route('/logout').post(requireTrustedOrigin, logout);
router.route('/add_to_activity').post(protect, addToHistory);
router.route('/get_all_activity').get(protect, getUserHistory);

export default router;