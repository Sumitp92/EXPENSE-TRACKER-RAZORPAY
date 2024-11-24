const express = require('express');
require('dotenv').config();
const sequelize = require('./model/expenses');
const Auth = require('./model/auth'); 
const bodyParser = require('body-parser'); 
const path = require('path');
const ass = require('./model/assocation'); 
const ordder = require('./model/order'); 
const generalRoutes = require('./routes/router'); 
const purchaseRoutes = require('./routes/purchase');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use('/api', generalRoutes); // For general APIs
app.use('/purchase', purchaseRoutes); // For purchase-related routes

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use((req, res, next) => {
    res.status(404).send('Page not found');
});

sequelize.sync({ force: false })
    .then(() => {
        app.listen(3000, () => {
            console.log('Server running on port 3000');
        });
    })
    .catch((err) => {
        console.error('Error syncing database:', err);
    });
