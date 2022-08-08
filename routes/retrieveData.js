const router = require('express').Router();
const { sensorData } = require('../models/sensorData');

router.post("/getSensorData", async (req, res) => {

    const usersData = await sensorData.find({ email: req.body.email });

    if (!usersData) return res.status(400).send({ message: "No data for this user yet!" });

    res.status(200).send({ UsersData: usersData });

});

router.post("/getSensorData/graph", async (req, res) => {

    const usersData = await sensorData.find({ email: req.body.email });

    if (!usersData) return res.status(400).send({ message: "No data for this user yet!" });

    //calculate avg temperature over 24 hours
    const currentDate = new Date();

    currentDate.setUTCHours(-24);

    //This could be an aggregate function from the database but were programming it
    const sensorDataOverLastDay = await sensorData.find({ email: req.body.email, date: {
        /*greater than */ $gte: currentDate.toISOString(), /* less than */ $lte: new Date().toISOString()
    }});

    console.log(sensorDataOverLastDay);



    //gets the average
    const getAverage = (arr) => {
        const reducer = (total, current) => total + current;
        const sum = arr.reduce(reducer, 0);
        return sum / arr.length;
    };

    //creates arrays of arrays of sensor data groupped by their hour that data is appart of
    const groupByHour = (values) => values.reduce((prev, currentSensorData) => {
        const date = new Date(currentSensorData.date);
        const key = `${date.getUTCHours()}`;
        // new bucket
        if(!prev[key]) {
            prev[key] = [currentSensorData];
        }
        // add to old bucket
        else prev[key].push(currentSensorData);
        return prev;
    }, []);

    const padDataPointsHours = (values) => {
        const hours = [...new Array(24)].map((_, index) => ({[[index]]: []}));
        for(const [key, value] of Object.entries(values)) {
          hours[key] = value
        }
        return hours;
    }


    //console.log((groupByHour(sensorDataOverLastDay)));

    const byHourWithAverages = /*padDataPointsHours*/(groupByHour(sensorDataOverLastDay)).map((value, hourdex) => {
        const currentValues = Array.isArray(value) ? value : [];
        //console.log(value.length, Array.isArray(value));
        const avgTemperature = getAverage(currentValues.map(({temperature}) => temperature));
        const avgHumidity = getAverage(currentValues.map(({humidity}) => humidity));
        const avgSoilMoisture = getAverage(currentValues.map(({moistureLevel}) => moistureLevel));
        return {
            hour: hourdex,
            sensorDataPoints: currentValues, 
            avgTemperature,
            avgHumidity,
            avgSoilMoisture
        }
    });

    res.status(200).send({ data: byHourWithAverages });

});

module.exports = router;
