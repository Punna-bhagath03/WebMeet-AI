import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

import env from '../config/env.js';
import { Meeting } from '../models/meeting.Model.js';
import { User } from '../models/user.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const DUMMY_HASH = '$2a$10$2b2H5IMQxja6B6kzB8vWk.4Pa2ELw6wQ6jxSxZfXx5v6xJ2Fhce5i';

const buildRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  // secure: true in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/users',
});

const sanitizeUserPayload = (user) => ({
  sub: user._id.toString(),
  username: user.username,
});

const genericAuthError = {
  message: 'Invalid credentials',
};

const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Please provide username and password' });
  }

  try {
    const user = await User.findOne({ username });
    const passwordHash = user?.password || DUMMY_HASH;
    const isPasswordCorrect = await bcrypt.compare(password, passwordHash);

    if (!user || !isPasswordCorrect) {
      return res.status(httpStatus.UNAUTHORIZED).json(genericAuthError);
    }

    const payload = sanitizeUserPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    user.refreshTokenHash = refreshTokenHash;
    user.lastRefreshAt = new Date();
    await user.save();

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildRefreshCookieOptions());

    return res.status(httpStatus.OK).json({ accessToken });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Something went wrong' });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'Please provide name, username and password' });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(httpStatus.CREATED).json({ message: 'User registered' });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Something went wrong' });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!token) {
      console.warn('Refresh failed: missing refresh token cookie');
      return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const decoded = verifyRefreshToken(token);

    if (!decoded || decoded.type !== 'refresh') {
      console.warn('Refresh failed: invalid token type or payload');
      return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.refreshTokenHash) {
      console.warn('Refresh failed: no active refresh token on user');
      return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }

    const incomingRefreshHash = hashRefreshToken(token);

    if (incomingRefreshHash !== user.refreshTokenHash) {
      user.refreshTokenHash = null;
      await user.save();

      console.warn(
        `Refresh token replay detected for user ${user.username || user._id}`
      );
      return res.status(httpStatus.FORBIDDEN).json({ error: 'Forbidden' });
    }

    const payload = sanitizeUserPayload(user);
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    const newRefreshHash = hashRefreshToken(newRefreshToken);

    user.refreshTokenHash = newRefreshHash;
    user.lastRefreshAt = new Date();
    await user.save();

    res.cookie(
      REFRESH_COOKIE_NAME,
      newRefreshToken,
      buildRefreshCookieOptions()
    );

    return res.status(httpStatus.OK).json({ accessToken });
  } catch (error) {
    console.warn('Refresh failed: token verification failed');
    return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Unauthorized' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];

    if (token) {
      const decoded = verifyRefreshToken(token);

      if (decoded?.sub) {
        await User.findByIdAndUpdate(decoded.sub, {
          refreshTokenHash: null,
        });
      }
    }
  } catch (error) {
    console.warn('Logout: refresh token verification failed while clearing DB hash');
  }

  res.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions());
  return res.status(httpStatus.OK).json({ message: 'Logged out successfully' });
};

const getUserHistory = async (req, res) => {
  try {
    const meetings = await Meeting.find({ user_id: req.user.username });
    return res.json(meetings);
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Something went wrong' });
  }
};

const addToHistory = async (req, res) => {
  const { meeting_code } = req.body;

  if (!meeting_code) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'meeting_code is required' });
  }

  try {
    const newMeeting = new Meeting({
      user_id: req.user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    return res
      .status(httpStatus.CREATED)
      .json({ message: 'Added code to history' });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Something went wrong' });
  }
};

export { login, register, refresh, logout, getUserHistory, addToHistory };
