const answer=require('./answer.json');
const utterance =require('./utterance.json') ;
const natural = require('natural'); //libr

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, {
    perMessageDeflate :false,
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
let conv =[];
server.listen(process.env.PORT|| 3000, function () {
    console.log("server started at port 3000");
});

app.use(express.static('public'));

io.on("connection", (socket) => {
    console.log(`connect ${socket.id}`);
    conv = [];
    socket.on("disconnect", (reason) => {
        console.log(`disconnect ${socket.id} due to ${reason}`);
    });


    socket.on("question", (data) => {
        console.log("recieved question: "+data)
        conv.push(["human",data]);
        let answer = huminp(data);
        conv.push(["aduna",answer]);
        socket.emit("answer", answer);
    });
});
let nxtRiddle = false;
let riddlein = null;
let medTimes = [];
function huminp(input){
    let tokenizer = new natural.WordTokenizer();
    let tokens = tokenizer.tokenize(input.toLowerCase());
    let response = "Sorry, Could you Please Rephrase?";
    if (utterance.intxt.some(utterances => utterances.includes("medicine arrage") && utterances.some(word => tokens.includes(word)))) 
    {response=answer.txtout.find(response=> response[0]=== "medicine arrage")[1];
    return response;}
    if (input.match(/\b\d{1,2}:\d{2}\b/)){ // https://www3.ntu.edu.sg/home/ehchua/programming/howto/Regexe.html
        let newTime = input.trim();
        if (!medTimes.includes(newTime)) {
            medTimes.push(newTime);
            response = `time set to ${newTime}`;} 
            else {
        response = `Error ${newTime} is already recorded`;
        }
        return response;}
    if (medTimes.length > 0 && utterance.intxt.some(utterances => utterances.includes("medicine take") && utterances.some(word => tokens.includes(word)))) {
        response = `Take your medicine at ${medTimes.join(', ')}`;
        return response;
    }
    utterance.intxt.forEach((utteranceArray,index)=>{if (utteranceArray.some(utterance=>tokens.includes(utterance.toLowerCase())))
        {
                response = answer.txtout[index][1];
        
            }
        });
    if (nxtRiddle){
        if(input.trim().toLowerCase()==="yes")
        {nxtRiddle = false;
        riddlein = (riddlein +1)%answer.riddles.length;
    response = answer.riddles[riddlein].question;}
    else if (input.trim().toLowerCase()==="no"){
        nxtRiddle = false;
        riddlein=null;
        response = "Is there anything else I can help you with?";
    }
    else{response="please answer with 'yes' or 'no'.";}
    return response;
    }
    
    let riddleT = utterance.intxt[7].some(phrase=>tokens.includes(phrase.toLowerCase()));
    if (riddleT&&riddlein===null)
        {riddlein =0;
        return answer.riddles[riddlein].question;
    }

    
    if(riddlein !==null)
    {
        let rAnswer = answer.riddles[riddlein].answer.map(ans => ans.toLowerCase());;
        if (rAnswer.includes(input.trim().toLowerCase()))
        {
            nxtRiddle = true;
    response = "Answer is correct, Do you want another riddle?"

    }
    else {response = "Incorrect answer, Try again";}
    }
    return response;
}
