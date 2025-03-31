// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBWn9VVMXILrnF2MNv7W1xODXPxDyTcNFg",
    authDomain: "xp33-8799f.firebaseapp.com",
    databaseURL: "https://xp33-8799f-default-rtdb.firebaseio.com",
    projectId: "xp33-8799f",
    storageBucket: "xp33-8799f.firebasestorage.app",
    messagingSenderId: "511133592884",
    appId: "1:511133592884:web:d50a853b5a5413da178961",
    measurementId: "G-EQD3048683"
};

// initialize firebase
firebase.initializeApp(firebaseConfig);

const ref = firebase.database().ref('XP3');

// Load CSV file
async function loadCSV() {
    const response = await fetch('latinSquare.csv'); // Ensure 'order.csv' is in the same folder
    const text = await response.text();
    const rows = text.trim().split("\n").map(row => row.split(","));

    data = rows.map(row => ({
        id: row[0].trim(),
        scenarioOrder: row[1].trim().split(" ").map(Number),
        videoOrder: row[2].trim().split(" ").map(Number)
    }));
}

function startExperiment() {
    participantID = document.getElementById("participant-id").value.trim();
    if (!participantID) {
        alert("Please enter a valid participant ID.");
        return;
    }

    const participantData = data.find(d => d.id === participantID);
    if (!participantData) {
        alert("Participant ID not found in CSV.");
        return;
    }

    scenarioOrder = participantData.scenarioOrder;
    videoOrder = participantData.videoOrder;
    currentScenarioIndex = 0;
    currentVideoIndex = 0;

    document.getElementById("participant-input").style.display = "none";
    document.getElementById("questionnaire-container").style.display = "block";

    loadQuestionnaire();
}


function loadQuestionnaire() {

    if (rankingMode) {
        showRankingQuestionnaire();
        return;
    }

    if (currentScenarioIndex >= scenarioOrder.length) {
        document.getElementById("questionnaire-container").innerHTML = "<h3>Thank you for completing the experiment!</h3>";
        return;
    }

    let scenario = scenarioOrder[currentScenarioIndex];
    let video = videoOrder[currentVideoIndex];

    document.getElementById("scenario-info").innerText = `Scenario: ${scenario}, Video: ${video}`;

}

function sendDataToFirebase() {
    ref.push(responses)
        .then(() => {
            //alert("Data successfully sent to Firebase!");
        })
        .catch((error) => {
            console.error("Error sending data to Firebase:", error);
            alert("Failed to send data to Firebase.");
        });


        console.log("hihi");
}

async function saveAndNext() {

    q1 = getSelectedValue('q1');
    q2 = getSelectedValue('q2');
    console.log("q1 and q2 is: ", q1, q2);

    if (!q1 || !q2 ) {
        alert("Please answer all required questions.");
        return;
    }

    let scenario = scenarioOrder[currentScenarioIndex];
    let video = videoOrder[currentVideoIndex];
    
    responses = {
        participantID,
        scenario,
        video,
        q1: q1,
        q2: q2,
        timestamp: new Date().toISOString()
    };
    
    sendDataToFirebase();
    
    currentVideoIndex++;
    if (currentVideoIndex >= videoOrder.length) {
        rankingMode = true; // Trigger ranking questionnaire
    }
    
    loadQuestionnaire();
   
}

function showRankingQuestionnaire() {
    document.getElementById("questionnaire-form").style.display = "none";
    document.getElementById("ranking-form").style.display = "block";
}

async function saveRanking() {
    let scenario = scenarioOrder[currentScenarioIndex];

    let rankings = {};
    document.querySelectorAll("#ranking-form input[type='number']").forEach(input => {
        let value = parseInt(input.value);
        if (value < 1 || value > 5 || isNaN(value)) {
            alert("Ranking values must be between 1 and 5.");
            return;
        }
        rankings[input.name] = value;
    });

    rankings = {
        participantID,
        scenario,
        rankings,
        timestamp: new Date().toISOString()
    };

    ref.push(rankings)
    .then(() => {
        //alert("Data successfully sent to Firebase!");
    })
    .catch((error) => {
        console.error("Error sending data to Firebase:", error);
        alert("Failed to send data to Firebase.");
    });

    rankingMode = false;
    currentScenarioIndex++;
    currentVideoIndex = 0;
 
}

window.onload = loadCSV;
