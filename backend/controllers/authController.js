const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { username, password, email, first_name, last_name } = req.body;

  try {
    // 1. Check if user or email already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Username already exists' });
    }
    let emailUser = await User.findOne({ email });
    if (emailUser) {
        return res.status(400).json({ msg: 'An account with this email already exists' });
    }

    // 2. Create a new user instance
    user = new User({
      username,
      password,
      email,
      first_name,
      last_name,
      profileImage: req.body.profileImage || '', // From avatarUpload middleware
    });

    // 3. Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save the user to the database
    await user.save();

    // 5. Send back user data (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 3. Send back user data on successful login (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json(userResponse);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}; 