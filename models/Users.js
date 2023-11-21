
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  accessToken: {
    type: String,
    required: false
  },
    refreshToken: {
        type: String,
        required: false
    },
  images: {
    type: Array,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
