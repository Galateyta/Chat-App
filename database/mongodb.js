const mongoose = require('mongoose');
mongoose.connect(`mongodb://localhost:27017/chat`, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

module.exports = mongoose;