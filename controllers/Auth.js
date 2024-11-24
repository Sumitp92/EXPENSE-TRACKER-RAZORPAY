const User = require('../model/auth');
const expenseRecord = require('../model/expenses');
const  Order  = require('../model/order')
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const JWT_SECRET = process.env.JWT_SECRET;
const bcrypt = require('bcrypt');
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
            password: hashedPassword,
        });

        res.status(201).json({ success: true, message: 'User signed up successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error occurred during signup' });
    }
};

// Login User
const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email },
        });
    } catch (error) {
        console.log('Error during login:', error);
        res.status(500).json({ success: false, message: 'Error occurred during login' });
    }
};


///below is for expense page 

// Add Expense
const addExp = async (req, res) => {
    try {
        const { amount, description, category } = req.body;

        if (!amount || !description || !category) {
            return res.status(400).json({ success: false, message: "Missing Expense" });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const expense = await expenseRecord.create({
            amount,
            description,
            category,
            userId: req.user.id,
        });

        res.status(201).json({ success: true, expense });
    } catch (error) {
        console.error('Error during expense addition:', error);
        res.status(500).json({ success: false, message: "Error adding expense", error: error.message });
    }
};

// Delete Expense
const delExp = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await expenseRecord.findOne({ where: { id, userId: req.user.id } });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        await expense.destroy();
        res.status(200).json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error deleting expense' });
    }
};

// Edit Expense
const editExp = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, category } = req.body;

        const expense = await expenseRecord.findOne({ where: { id, userId: req.user.id } });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found or unauthorized' });
        }

        expense.amount = amount;
        expense.description = description;
        expense.category = category;

        await expense.save();

        res.status(200).json({ success: true, expense });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error updating expense' });
    }
};

// Get Expenses
const getExp = async (req, res) => {
    try {
        const userId = req.user.id; 

        console.log('Fetching expenses for user ID:', userId); 
        const expenses = await expenseRecord.findAll({ where: { userId } });

        console.log('Fetched expenses:', expenses); 

        if (expenses.length === 0) {
            return res.status(404).json({ success: false, message: 'No expenses found for this user' });
        }

        res.status(200).json({ success: true, expenses }); 
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ success: false, message: 'Error fetching expenses', error: err.message });
    }
};

//below code is for premium user 
const buyPremium = async (req, res) => {

    try {

        const rzp = new Razorpay({

            key_id: process.env.RAZORPAY_KEY_ID,

            key_secret: process.env.RAZORPAY_KEY_SECRET,

        });


        const amount = 50000; 


        const razorpayOrder = await rzp.orders.create({

            amount,

            currency: 'INR',

            receipt: `order_rcptid_${Date.now()}`,

        });


        if (!razorpayOrder) throw new Error('Failed to create Razorpay order');


        res.status(201).json({

            key_id: process.env.RAZORPAY_KEY_ID,

            order: razorpayOrder,

        });

    } catch (error) {

        console.error('Error creating Razorpay order:', error.message);

        res.status(500).json({ error: 'Error creating Razorpay order' });

    }

};


// Update premium status after payment

const updatePremiumStatus = async (req, res) => {

    try {

        const { payment_id, order_id } = req.body;


        if (!payment_id || !order_id) {

            return res.status(400).json({ error: 'Invalid request payload' });

        }


        const rzp = new Razorpay({

            key_id: process.env.RAZORPAY_KEY_ID,

            key_secret: process.env.RAZORPAY_KEY_SECRET,

        });


        const paymentVerification = await rzp.payments.fetch(payment_id);

        if (!paymentVerification || paymentVerification.status !== 'captured') {

            return res.status(400).json({ error: 'Payment not captured or invalid payment ID' });

        }


        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ error: 'User  not found' });


        user.isPremium = true;

        await user.save();


        const newOrder = await Order.create({

            orderId: order_id,

            paymentId: payment_id,

            status: 'success',

            userId: user.id,

        });


        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });


        res.status(200).json({ message: 'Transaction successful', token, order: newOrder });

    } catch (error) {

        console.error('Error updating premium status:', error.message);

        res.status(500).json({ error: 'Error updating premium status' });

    }

};

module.exports = {
    AddUser,
    LoginUser,
    getExp,
    addExp,
    delExp,
    editExp,
    buyPremium,
    updatePremiumStatus,
};