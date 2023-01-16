const express    = require('express');
const cors       = require('cors');
const router     = require('./src/routes/route.js');
// const authrouter = require('./src/routes/Routes.js');
const mongoose   = require('mongoose');

mongoose.set('strictQuery', true);
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://iiitvicd:iiitv123@cluster0.lgokxw0.mongodb.net/?retryWrites=true&w=majority' , {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (!err) {
    console.log('MongoDB Connection Succeeded.');
  } else {
    console.log('Error in DB connection : ' + err);
  }
});

app.use('/', router);
// app.use('/auth', authrouter);

app.all('/**', (req, res) => {
    res.status(404).send({ status: false, message: 'Page Not Found!' });
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000));
});