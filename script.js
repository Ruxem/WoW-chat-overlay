const roleColors = {
    broadcaster: { color: "rgb(118, 197, 255)", tag: "[Party Leader]" },
    moderator: { color: "rgb(170, 170, 255)", tag: "[Party]" },
    vip: { color: "orange", tag: "[Raid]" },
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

const chatContainer = document.getElementById("chat-container");

let sevenTVEmotes = {};
let bttvEmotes = {};
let ffzEmotes = {};

async function load7TVEmotes(channelName) {
    try {
        const userRes = await fetch(`https://decapi.me/twitch/id/${channelName}`);
        const channelId = await userRes.text();

        const res = await fetch(`https://7tv.io/v3/users/twitch/${channelId}`);
        const data = await res.json();

        if (!data.emote_set) return;

        data.emote_set.emotes.forEach(emote => {
            sevenTVEmotes[emote.name] =
                `https://cdn.7tv.app/emote/${emote.id}/2x.webp`;
        });

        console.log("7TV loaded");
    } catch (err) {
        console.error("7TV error:", err);
    }
}

async function loadBTTVEmotes(channelName) {
    try {
        const userRes = await fetch(`https://decapi.me/twitch/id/${channelName}`);
        const channelId = await userRes.text();

        const globalRes = await fetch(`https://api.betterttv.net/3/cached/emotes/global`);
        const globalData = await globalRes.json();

        globalData.forEach(emote => {
            bttvEmotes[emote.code] =
                `https://cdn.betterttv.net/emote/${emote.id}/2x`;
        });

        const chanRes = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`);
        const chanData = await chanRes.json();

        if (chanData.channelEmotes) {
            chanData.channelEmotes.forEach(emote => {
                bttvEmotes[emote.code] =
                    `https://cdn.betterttv.net/emote/${emote.id}/2x`;
            });
        }

        if (chanData.sharedEmotes) {
            chanData.sharedEmotes.forEach(emote => {
                bttvEmotes[emote.code] =
                    `https://cdn.betterttv.net/emote/${emote.id}/2x`;
            });
        }

        console.log("BTTV loaded");
    } catch (err) {
        console.error("BTTV error:", err);
    }
}

async function loadFFZEmotes(channelName) {
    try {
        // CHANNEL
        const res = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
        const data = await res.json();

        if (data.sets) {
            Object.values(data.sets).forEach(set => {
                set.emoticons.forEach(emote => {
                    const url = emote.urls["2"] || emote.urls["1"];
                    if (url) {
                        ffzEmotes[emote.name] = `https:${url}`;
                    }
                });
            });
        }

        // GLOBAL
        const globalRes = await fetch(`https://api.frankerfacez.com/v1/set/global`);
        const globalData = await globalRes.json();

        if (globalData.sets) {
            Object.values(globalData.sets).forEach(set => {
                set.emoticons.forEach(emote => {
                    const url = emote.urls["2"] || emote.urls["1"];
                    if (url) {
                        ffzEmotes[emote.name] = `https:${url}`;
                    }
                });
            });
        }

        console.log("FFZ loaded");
    } catch (err) {
        console.error("FFZ error:", err);
    }
}
function replaceEmotes(text) {
    return text.split(" ").map(word => {
        const clean = word.replace(/[.,!?]/g, "");

        if (sevenTVEmotes[clean]) {
            return `<img src="${sevenTVEmotes[clean]}" class="emote">`;
        }

        if (bttvEmotes[clean]) {
            return `<img src="${bttvEmotes[clean]}" class="emote">`;
        }

        if (ffzEmotes[clean]) {
            return `<img src="${ffzEmotes[clean]}" class="emote">`;
        }

        return word;
    }).join(" ");
}

const client = new tmi.Client({
    channels: ['RuxLion'],
});

client.connect();

load7TVEmotes("RuxLion");
loadBTTVEmotes("RuxLion");
loadFFZEmotes("RuxLion");

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    const username = tags['display-name'] || tags.username;
    const { color, tag } = getRoleDetails(message, tags);

    let processedText = processItemCommands(message);
    processedText = replaceEmotes(processedText);

    addMessage({
        timestamp: getTime(),
        username,
        color,
        tag,
        text: processedText
    });
});

function getRoleDetails(text, tags) {
    if (text.startsWith("E/")) return roleColors.event;
    if (text.startsWith("W/")) return roleColors.wFrom;
    if (text.startsWith("Y/")) return roleColors.yell;
    if (text.startsWith("1/")) return roleColors.general;
    if (text.startsWith("2/")) return roleColors.trade;

    if (tags.badges?.broadcaster) return roleColors.broadcaster;
    if (tags.badges?.moderator) return roleColors.moderator;
    if (tags.badges?.subscriber) return roleColors.subscriber;
    if (tags.badges?.vip) return roleColors.vip;

    return roleColors.default;
}

function addMessage({ timestamp, username, color, tag, text }) {
    const line = document.createElement("div");
    line.className = "chat-line";

    const usernameDisplay = username ? `[${username}]` : "";
    const tagDisplay = tag ? `${tag} ` : "";
    const colon = username || tag ? ":" : "";

    line.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span class="channel">${tagDisplay}</span>
        <span class="username" style="color:${color}">${usernameDisplay}</span>${colon}
        <span class="message">${text}</span>
    `;

    chatContainer.appendChild(line);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function processItemCommands(text) {
    return text.replace(/([LCURE])\[(.*?)\]/g, (m, type, item) => {
        const color = itemColors[type] || "white";
        return `<span style="color:${color};">[${item}]</span>`;
    });
}

function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/^/, '[').replace(/$/, ']');
}
