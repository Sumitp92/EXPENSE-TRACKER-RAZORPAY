const NewRec = require('./auth'); 
const Expense = require('./expenses'); 
const Order = require('./order'); 

NewRec.hasMany(Expense, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
});

Expense.belongsTo(NewRec, {
    foreignKey: 'userId',
});

NewRec.hasMany(Order, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
});

Order.belongsTo(NewRec, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
});

module.exports = {
    NewRec,
    Expense,
    Order,
};
