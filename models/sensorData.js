const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const sensorDataSchema = new Schema({

    email: {
        type: String,
        require: true,
        trim: true,
        minlength: 3
    },

    temperature: {
        type: Number,
        require: true,
    },

    humidity: {
        type: Number,
        require: true,
    },

    moistureLevel: {
        type: Number,
        require: true,
    },

    date: {
        type: String,
        require: true,
    },
    
});

    const sensorData =  mongoose.model('sensorData', sensorDataSchema);

    /*const dataEvent = sensorData.Watch();
    dataEvent.on('change', change => console.log(JSON.stringify(change)));*/



    module.exports = { sensorData }; 