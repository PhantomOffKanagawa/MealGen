const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: {
    type: Number,
    index: true,
    min: 0,
    max: 120,
  },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;