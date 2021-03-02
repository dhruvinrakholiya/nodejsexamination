const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useCreateIndex: true })
const conn = mongoose.connection;
conn.on('connected', () => {
    console.log("Connection Successfully");
})
conn.on('error', console.error.bind(console, 'Connection Failed'))
module.exports = conn;