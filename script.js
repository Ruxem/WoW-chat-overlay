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
    "TrollMale": "sounds/TrollMale.ogg",
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
    "Train": "sounds/Train.ogg",
};

const chatContainer = document.getElementById("chat-container");

/* =========================
   7TV EMOTES
========================= */
let sevenTVEmotes = {};

async function load7TVEmotes(channelName) {
    try {
        const userRes = await fetch(`https://decapi.me/twitch/id/${channelName}`);
        const channelId = await userRes.text();

        const res = await fetch(`https://7tv.io/v3/users/twitch/${channelId}`);
        const data = await res.json();

        if (!data.emote_set) return;

        data.emote_set.emotes.forEach(emote => {
            sevenTVEmotes[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/2x.webp`;
        });

        console.log("7TV emotes loaded:", sevenTVEmotes);
    } catch (err) {
        console.error("7TV load error:", err);
    }
}

function replace7TVEmotes(text) {
    return text.replace(/\b([^\s]+)\b/g, (word) => {
        const clean = word.replace(/[.,!?]/g, "");
        if (sevenTVEmotes[clean]) {
            return `<img src="${sevenTVEmotes[clean]}" class="emote" alt="${clean}" />`;
        }
        return word;
    });
}

/* =========================
   TWITCH CLIENT
========================= */
const client = new tmi.Client({
    channels: ['RuxLion'],
});

client.connect();
load7TVEmotes("RuxLion");

/* =========================
   EVENTS
========================= */
client.on('message', (channel, tags, message, self) => {
    if (self) return; 
  
    const username = tags['display-name'] || tags.username;
    const { color, tag, isEvent } = getRoleDetails(message, tags); 

    if (message.startsWith("L/")) {
        playSound(message);
        return;
    }

    if (message.startsWith("ROLL/")) {
        handleRollCommand(username);
        return;
    }

    let processedText = processItemCommands(message);
    processedText = replace7TVEmotes(processedText);

    addMessage({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/^/, '[').replace(/$/, ']'),
        username,
        color,
        tag,
        text: processedText,
        isEvent
    });
});

client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
    handleGiftedSubs(username, 1);
});

client.on('submysterygift', (channel, username, numbOfSubs, methods, userstate) => {
    handleGiftedSubs(username, numbOfSubs);
});

client.on('subscription', (channel, username) => {
    handleSubscription(username);
});

client.on('resub', (channel, username) => {
    handleSubscription(username);
});

/* =========================
   HANDLERS
========================= */
function handleSubscription(username) {
    addMessage({
        timestamp: getTime(),
        username: "",
        color: "yellow",
        tag: "",
        text: `${username} has joined the guild`,
        isEvent: true
    });
}

function handleGiftedSubs(gifter, numOfSubs) {
    addMessage({
        timestamp: getTime(),
        username: "",
        color: "yellow",
        tag: "",
        text: `${gifter} invited ${numOfSubs} player(s) to the guild`,
        isEvent: true
    });
}

function handleRollCommand(username) {
    const roll = Math.floor(Math.random() * 100) + 1;

    addMessage({
        timestamp: getTime(),
        username: "",
        color: "yellow",
        tag: "",
        text: `${username} rolls ${roll} (1-100)`,
        isEvent: false
    });
}

/* =========================
   HELPERS
========================= */
function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/^/, '[').replace(/$/, ']');
}

function getRoleDetails(text, tags) {
    if (text.startsWith("E/")) return { ...roleColors.event, isEvent: true };
    if (text.startsWith("W/")) return roleColors.wFrom;
    if (text.startsWith("Y/")) return roleColors.yell;
    if (text.startsWith("1/")) return roleColors.general;
    if (text.startsWith("2/")) return roleColors.trade;

    const roles = [];
    if (tags.badges?.broadcaster) roles.push(roleColors.broadcaster);
    if (tags.badges?.moderator) roles.push(roleColors.moderator);
    if (tags.badges?.subscriber) roles.push(roleColors.subscriber);
    if (tags.badges?.vip) roles.push(roleColors.vip);

    if (roles.length > 0) return { ...roles[0], isEvent: false };

    return roleColors.default;
}

const cooldowns = {};

function playSound(message) {
    const command = message.replace("L/", "").trim();
    const soundFile = soundMap[command];

    if (!soundFile) return;

    const audio = new Audio(soundFile);
    audio.volume = 0.5;
    audio.play();
}

function addMessage({ timestamp, username, color, tag, text }) {
    const line = document.createElement("div");
    line.className = "chat-line";
    line.style.color = color;

    const cleanText = text.replace(/^(E\/|W\/|Y\/|1\/|2\/)/, "");

    const usernameDisplay = username ? `[${username}]` : "";
    const tagDisplay = tag ? `${tag} ` : "";
    const colon = username || tag ? ":" : "";

    line.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span class="channel">${tagDisplay}</span> 
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
