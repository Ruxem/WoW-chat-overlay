const roleColors = {
    broadcaster: { color: "rgb(118, 197, 255)", tag: "[Party Leader]"},
    moderator: { color: "rgb(170, 170, 255)", tag: "[Party]" },
    vip: {color: "orange", tag: "[Raid]" },
    subscriber: { color: "rgb(64, 255, 64)", tag: "[Guild]" },
    default: { color: "white", tag: "[Say]" },
    wFrom: { color: "rgb(255, 128, 255)", tag: "[W From]" },
    yell: { color: "red", tag: "[Y]" },
    general: { color: "rgb(255, 191, 191)", tag: "[1. General]" },
    trade: { color: "rgb(255, 191, 191)", tag: "[2. Trade]" },
    event: { color: "orange", tag: "" }
};

const itemColors = {
    L: "orange",   
    C: "gray",      
    U: "green",     
    R: "blue",      
    E: "purple",    
};

const soundMap = {
    "OrcMale": "sounds/OrcMale.ogg",
    "OrcFemale": "sounds/OrcFemale.ogg",
    "UndeadMale": "sounds/UndeadMale.ogg",
    "UndeadFemale": "sounds/UndeadFemale.ogg",
    "TaurenMale": "sounds/TaurenFemale.ogg",
    "TaurenFemale": "sounds/TaurenFemale.ogg",
    "TrollMale": "sounds/TrollFemale.ogg",
    "TrollFemale": "sounds/TrollFemale.ogg",
    "BloodElfMale": "sounds/BloodElfMale.ogg",
    "BloodElfFemale": "sounds/BloodElfFemale.ogg",
    "Goblin": "sounds/Goblin.ogg",
    "HumanMale": "sounds/HumanMale.ogg",
    "HumanFemale": "sounds/HumanFemale.ogg",
    "DwarfMale": "sounds/DwarfMale.ogg",
    "DwarfFemale": "sounds/DwarfFemale.ogg",
    "NightElfMale": "sounds/NightElfMale.ogg",
    "NightElfFemale": "sounds/NightElfFemale.ogg",
    "GnomeMale": "sounds/GnomeMale.ogg",
    "GnomeFemale": "sounds/GnomeFemale.ogg",
    "DraeneiMale": "sounds/DraeneiMale.ogg",
    "DraeneiFemale": "sounds/DraeneiFemale.ogg",
    "WorgenMale": "sounds/WorgenMale.ogg",
    "WorgenFemale": "sounds/WorgenFemale.ogg",
    "PandarenMale": "sounds/PandarenMale.ogg",
    "PandarenFemale": "sounds/PandarenFemale.ogg",

}

const chatContainer = document.getElementById("chat-container");

const client = new tmi.Client({
    channels: ['theruxemburg'], 
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return; 
  
    const username = tags['display-name'] || tags.username;
    const { color, tag, isEvent } = getRoleDetails(message, tags); 

    if (message.startsWith("L/")) {
        playSound(message);
        return; // Stop here to ensure the message is not added to the overlay
    }

    const processedText = processItemCommands(message); 

    addMessage({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/^/, '[').replace(/$/, ']'),
        username: username,
        color: color,
        tag: tag,
        text: processedText,
        isEvent: isEvent
    });
});


function getRoleDetails(text, tags) {
    if (text.startsWith("E/")) {
        return { ...roleColors.event, isEvent: true };
    }
    if (text.startsWith("W/")) {
        return roleColors.wFrom;
    }
    if (text.startsWith("Y/")) {
        return roleColors.yell;
    }
    if (text.startsWith("1/")) {
        return roleColors.general;
    }
    if (text.startsWith("2/")) {
        return roleColors.trade;
    }

    const roles = [];
    if (tags.badges?.broadcaster) roles.push(roleColors.broadcaster);
    if (tags.badges?.moderator) roles.push(roleColors.moderator);
    if (tags.badges?.subscriber) roles.push(roleColors.subscriber);
    if (tags.badges?.vip) roles.push(roleColors.vip);
    if (roles.length > 0) return { ...roles[0], isEvent: false };

    return roleColors.default; // Default role
}

const cooldowns = {};

function playSound(message) {
    const command = message.replace("L/", "").trim();
    const soundFile = soundMap[command];

    if (!soundFile) {
        console.error(`No sound file found for command: ${command}`);
        return;
    }

    const now = Date.now();
    const lastPlayed = cooldowns[command] || 0;

    if (now - lastPlayed < 30000) {
        console.log(`Cooldown active for ${command}. Try again later.`);
        return; // Exit if the cooldown hasn't expired
    }

    cooldowns[command] = now;
    const audio = new Audio(soundFile);
    audio.play();
}

function addMessage({ timestamp, username, color, tag, text, isEvent }) {
    const line = document.createElement("div");
    line.className = "chat-line";
    line.style.color = color;

    const cleanText = text.replace(/^(E\/|W\/|Y\/|1\/|2\/)/, "");

    const usernameDisplay = isEvent ? username : `[${username}]`;
    const colon = isEvent ? "" : ":"; // No colon for E/ messages

    line.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="channel">${tag}</span> 
      <span class="username" style="color: ${color}">${usernameDisplay}</span>${colon} 
      <span class="message">${cleanText}</span>
    `;

    chatContainer.appendChild(line);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function processItemCommands(text) {
    return text.replace(/([LCURE])\[(.*?)\]/g, (match, type, itemName) => {
        const color = itemColors[type] || "white";
        return `<span style="color: ${color};">[${itemName}]</span>`;
    });
}
