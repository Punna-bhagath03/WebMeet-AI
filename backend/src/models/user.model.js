import mongoose, { Schema } from 'mongoose';

const userScheme = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshTokenHash: { type: String, default: null },
  lastRefreshAt: { type: Date, default: null },
});

const User = mongoose.model('User', userScheme);

export { User };
