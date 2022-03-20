
// "highscore" document (quantity: 1)
username:"stefan"
totalmilliseconds:"100000"

// "round" document (quantity: n)
matchid: "dgfdg78f7dg"
totalmilliseconds:"3031"
username:"user1"

matchid: "dgfdg78f7dg"
totalmilliseconds:"3600"
username:"user2"

matchid: "dgfdg78f7dg"
totalmilliseconds:"3533"
username:"user1"

...

matchid: "zx7cvxzx8c7"
totalmilliseconds:"1933"
username:"anja"

matchid: "zx7cvxzx8c7"
totalmilliseconds:"4233"
username:"boris"


virus.onClick() {
    data = {
    totalmilliseconds;
    username;
    matchid;
    }

    db.createdocument("round", data)
    // and other stuff, like showing "you won this round prompt"
    // gotonextRound();
}



function calcAverage(numArray) {
    count = numArray.length;
    sum = array.reduce(numArray);
    return sum/count;
}

function gameEnded() {

    // initialize general game parameters
    matchid = generateRandomId()                             // eg. "dgfdg78f7dg"

    // initialize user game parameters
    user1 = "mikael"
    user2 = "lisa"

    // calc averages
    user1averages = db.getaverages(matchid, user1);        // [3.4, 3.3, 2.5, ...]
    user1averages = db.getaverages(matchid, user2);        // [3.7, 3.6, 2.5, ...]
    avg1 = calcAverage(user1averages)                       // 3.1
    avg2 = calcAverage(user2averages)                       // 3.6

    // find the best user and best score in this match
    avgMatchBest = Math.min(avg1, avg2);                         // 3.1
    bestPlayer = avgMatchBest == avg1 ? user1 : user2           // "mikael"

    // check if the all-time score was beaten (and set a new one if it was)
    alltimeBestScore = db.getHighscore();                         // 3.2



    if (avgMatchBest < alltimeBestScore)
        db.setNewAlltimeBestScore(avgMatchBest, bestPlayer)

}
