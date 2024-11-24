const User = require('../model/expenses'); 

const bcrypt = require('bcrypt')
const AddUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                name,
                email,
                password : hashedPassword
        })
        res.status(201).json({ success: true, message: 'User signed up successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error occurred during signup' });
    }
};
const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login request received with email:', email);

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }
        res.status(200).json({
            success: true,
            message: 'User login successful',
            user: { id: user.id, name: user.name, email: user.email },
        });
    } catch (error) {
        console.log('Error during login:', error);
        res.status(500).json({ success: false, message: 'Error occurred during login' });
    }
};




module.exports = { AddUser, LoginUser };