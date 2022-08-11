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

        /*if (!alert) return;
        let index;
        const foundAlert = alerts.find(({type}, i) => {
          index = i;
          return type === alert;
        }); 
        if (foundAlert) {
          const date = new Date(foundAlert.date);
          if (date.getHours() < (new Date().getHours() - 3)) {
            delete alerts[i];
            alerts.push({
              date: new Date().toISOString(),
              type: alert,
              message: `${alert} was alerted to be ${alertValue} at ${new Date().toString()}`
            });
          }
        }*/

        console.log("Check");

      });
    });
  }, 60000 * 2.5);
}

connection.once('open', () => { 

  startAlertTask();

   /* User.find({}, (err, users) => {

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

//Create 3 new booleans on user data to track if they have been alerted for trips in temp, humidity and soil moisture 
//Then for user alerts create long lived process which pulls the most recent sensor data for the user (every 10 minutes) compare data with prefered ranges 
//If value is outside of range (send email to user with the event, and push new event object in users data) if user has not been alerted for this value in the last 3 hours
//Create front end alert component that displays the users most recent alert (timestamp for time)

//Send email alert to user
//Live feed data hack
/*setInterval(() => {
  User.find({}, (err, users) => {
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }
    const emails = users.map(({email}) => email);
    console.log(emails);
    const sensorDataPoints = emails.map((email) => {
      return {
        email, 
        temperature: getRandomInt(10, 45),
        humidity: getRandomInt(0, 100),
        moistureLevel: getRandomInt(0, 100),
        date: new Date().getUTCDate(),
      }
    })
    sensorData.insertMany(sensorDataPoints);
    console.log("Created new sensordata")
  })
}, 10000); */

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

