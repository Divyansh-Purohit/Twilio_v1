require('dotenv').config();
const express = require('express');
const session = require('express-session');
const messageResponse = require('twilio').twiml.MessagingResponse;
const app = express();
app.use(express.urlencoded({extended: true}))
app.use(session({ secret : process.env.SESSION_SECRET }));
const port = process.env.EXPRESS_PORT || 3001;
const weekdays = process.env.WEEKDAYS.split(',');
app.get('/', (req, res, next) => {
    res.write("You can send messages to +14232502134" to start");
    res.end();
});
app.post('/receive-sms', (req, res) => {
    const messageContent = req.body.Body.toLowerCase();
    console.log("\nUSER REPLY:", messageContent, "\n");
    const step = req.session.step;
    let message;
    if (messageContent == 0){
        message = "Please start again";
        req.session.step = 1;
    }
    if(!step){
        req.session.step = 1;
        message = `
        Welcome to SMS Booking System \n
        At any point to reset the entered details type 0 \n
        type 'ok' to acknowledge`;
        
    } else {
        switch(req.session.step)
        {
            case 1:
                message = `
                Please enter your name`
                req.session.step = 2;
                break;
            case 2:
                req.session.step = 3;
                req.session.nameofClient = messageContent[0].toUpperCase() + messageContent.substring(1,);
                    message = `
                    Hello ${req.session.nameofClient}, Please choose an appointment for:
                    1) Carpenter
                    2) Electrician
                    3) Manson
                    4) Plumber`;
                break;                
           
            case 3:
                if (messageContent.includes('carpenter'))
                    req.session.type = 'carpenter';
                else if (messageContent.includes('electrician'))
                    req.session.type = 'electrician';
                else if (messageContent.includes('manson'))
                    req.session.type = 'manson';
                else if (messageContent.includes('plumber'))
                    req.session.type = 'plumber'

                if(!req.session.type) {
                    message = `
                    Invalid response, please select again`;
                } else {
                    req.session.step = 4;
                    message = `
                    What day you want to see the ${messageContent}`;
                }
                break;

            case 4:
                const weekday = weekdays.filter(w => messageContent.includes(w));
                if(weekday.length === 0) {
                    message = `
                    Please select a weekday`;
                } else if(weekday.length > 1) {
                    message = `
                    Please select only one day in ${weekday}`;
                } else {
                    req.session.step = 5;
                    req.session.weekday = weekday[0];
                    message = `
                    What time do you wish to schedule the visit of ${req.session.type}
                    1) 11AM
                    2) 4PM`;                
                }
                break;

            case 5:
                if(messageContent < 1 || messageContent > 2){
                    message = `
                    Invalid time entered.`;
                } else {
                    req.session.time = messageContent === 1 ? '11AM' : '4PM';
                    req.session.step = 6;
                    message = `
                    Proceed to book Appointment (Y/N)?`;
                }                    
                break;
            
            case 6:
                if(messageContent === 'n') {
                    message = `
                    Appointment not booked!`;
                    req.session.step = 7;
                } else {
                    message = `
                    Appointment booked!, details are mentioned below
                    name: ${req.session.nameofClient}
                    type: ${req.session.type}
                    day: ${req.session.weekday}
                    time: ${req.session.time}`;
                    
                }
                req.session.step = 7
                break;
            
            default: 
                message = `
                Thankyou for using SMS Booking System!
                Your response has been recorded
                The ${req.session.type} will reach you at the recorded time`;                
                break;
        }
    }
    console.log(message);
    const response = new messageResponse();
    response.message(message);
    res.set('Content-Type', 'text/xml');
    res.send(response.toString());
})

const twilio = require('twilio')(
    process.env.TOKEN_SID, 
    process.env.TOKEN_SECRET,
    {
        accountSid : process.env.ACCOUNT_SID
    }
);

const from = process.env.PHONE_NUMBER
const to = process.env.MY_PHONE_NUMBER

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
