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

let participantID = null;
let scenarioOrder = [];
let videoOrder = [];
let currentScenarioIndex = 0;
let currentVideoIndex = 0;
let data = [];
let responses = [];
let rankingMode = false;
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
    if (currentScenarioIndex >= scenarioOrder.length) {
        document.getElementById("questionnaire-container").innerHTML = "<h3>Thank you for completing the experiment!</h3>";
        return;
    }

    if (rankingMode) {
        showRankingQuestionnaire();
        return;
    }

    let scenario = scenarioOrder[currentScenarioIndex];
    let video = videoOrder[currentVideoIndex];

    document.getElementById("scenario-info").innerText = `Scenario: ${scenario}, Video: ${video}`;
    document.getElementById("questionnaire-form").reset();
    document.getElementById("questionnaire-form").style.display = "block";
    document.getElementById("ranking-form").style.display = "none";
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
}

async function saveAndNext() {

    if (rankingMode) {
        await saveRankingData();
        rankingMode = false;
        currentScenarioIndex++;
        currentVideoIndex = 0;
        loadQuestionnaire();
        return;
    }

    let scenario = scenarioOrder[currentScenarioIndex];
    let video = videoOrder[currentVideoIndex];

    responses = {
        participantID,
        scenario,
        video,
        q1: document.querySelector('input[name="q1"]:checked')?.value || null,
        q2: document.querySelector('input[name="q2"]:checked')?.value || null,
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

async function saveRankingData() {
    let scenario = scenarioOrder[currentScenarioIndex];

    let rankingData = {
        participantID,
        scenario,
        trust: {
            baseline: document.querySelector('input[name="trust1"]').value,
            singleGoal: document.querySelector('input[name="trust2"]').value,
            multipleGoals: document.querySelector('input[name="trust3"]').value,
            singlePath: document.querySelector('input[name="trust4"]').value,
            multiplePaths: document.querySelector('input[name="trust5"]').value,
        },
        situationAwareness: {
            baseline: document.querySelector('input[name="sa1"]').value,
            singleGoal: document.querySelector('input[name="sa2"]').value,
            multipleGoals: document.querySelector('input[name="sa3"]').value,
            singlePath: document.querySelector('input[name="sa4"]').value,
            multiplePaths: document.querySelector('input[name="sa5"]').value,
        },
        safety: {
            baseline: document.querySelector('input[name="safety1"]').value,
            singleGoal: document.querySelector('input[name="safety2"]').value,
            multipleGoals: document.querySelector('input[name="safety3"]').value,
            singlePath: document.querySelector('input[name="safety4"]').value,
            multiplePaths: document.querySelector('input[name="safety5"]').value,
        },
        likability: {
            baseline: document.querySelector('input[name="likability1"]').value,
            singleGoal: document.querySelector('input[name="likability2"]').value,
            multipleGoals: document.querySelector('input[name="likability3"]').value,
            singlePath: document.querySelector('input[name="likability4"]').value,
            multiplePaths: document.querySelector('input[name="likability5"]').value,
        },
        timestamp: new Date().toISOString()
    };

    ref.push(rankingData)
    .then(() => {
        //alert("Data successfully sent to Firebase!");
    })
    .catch((error) => {
        console.error("Error sending data to Firebase:", error);
        alert("Failed to send data to Firebase.");
    });
}

window.onload = loadCSV;
