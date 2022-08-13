const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const passwordResetRoutes = require("./routes/passwordReset");
const retrieveDataRouter = require("./routes/retrieveData");
const { sensorData } = require('./models/sensorData');
const { User } = require('./models/user');
const { date } = require('joi');
const sendEmail = require('./utils/sendEmail');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {}
);
const connection = mongoose.connection;

const startAlertTask = () => {
  setInterval( async () => {
    User.find({}, (err, users) => { 
      users.forEach( async ( {
        email, prefMaxTemp, prefMinTemp, prefMaxHumidity, prefMinHumidity, prefMaxMoisture, prefMinMoisture, //alerts
      }) => {
        if (!prefMaxTemp && !prefMinTemp && !prefMaxHumidity && !prefMinHumidity && !prefMaxMoisture && !prefMinMoisture) return;
        const [thisSensorData] = await sensorData.find({email: email}).sort({_id: -1}).limit(1);
        console.log(thisSensorData);
        let alert;
        let alertValue;
        if (thisSensorData.temperature > prefMaxTemp || thisSensorData.temperature < prefMinTemp ) {
          alert = "Temperature";
          alertValue = thisSensorData.temperature;
          sendEmail(email, "Temperature Alert!", `${alert} was alerted to be ${alertValue} at ${new Date().toString()}`);
        }
        if (thisSensorData.humidity > prefMaxHumidity || thisSensorData.humidity < prefMinHumidity ) {
          alert = "Humidity";
          alertValue = thisSensorData.humidity;
          sendEmail(email, "Humidity Alert!", `${alert} was alerted to be ${alertValue} at ${new Date().toString()}`);
        }
        if (thisSensorData.moistureLevel > prefMaxMoisture || thisSensorData.moistureLevel < prefMinMoisture ) {
          alert = "Moisture"; 
          alertValue = thisSensorData.moistureLevel;
          sendEmail(email, "Moisture Alert!", `${alert} was alerted to be ${alertValue} at ${new Date().toString()}`);
        }

        console.log("Check");

      });
    });
  }, 60000 * 1000);
}

connection.once('open', () => { 
  
  /*Server function grave yard
  
  -------------------------------------------------------------------------------------------------
  Alert functionality component, uncomment startAlertTask(); to get email alerts working again.
  startAlertTask();
  -------------------------------------------------------------------------------------------------



  --------------------------------------------------------------------------------------------------
  Create large datapoint history insert function, very useful for demoing the graphs
   User.find({}, (err, users) => {

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const emails = users.map(({email}) => email);

  const sensorDataPoints = emails.flatMap((email) => {
    return [...new Array(48 * 4)].map((val, index) => {
      const currentDate = new Date();
      if (index === 0) {
      currentDate.setUTCHours(0);
      }
      else {
      currentDate.setUTCHours(Math.abs(Math.floor((index / 2) - 24)));
      }
      return {
      email,
       date: currentDate.toISOString(),
       temperature: getRandomInt(5, 45),
       humidity: getRandomInt(20, 90),
       moistureLevel: getRandomInt(30, 100),
      }
   });
  })

  sensorData.insertMany(sensorDataPoints);

    })/*
--------------------------------------------------------------------------------------------------------
*/

  console.log("MongoDB database now connected successfully");
});

// Routes
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/password-reset', passwordResetRoutes);
app.use('/data', retrieveDataRouter);

app.listen(port, () => { 
  console.log('Server is running');
});

