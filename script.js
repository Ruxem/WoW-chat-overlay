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
    E: "purple"
};

const chatContainer = document.getElementById("chat-container");

let sevenTVEmotes = {};
let bttvEmotes = {};
let ffzEmotes = {};

function parseTwitchEmotes(message, tags) {
    if (!tags.emotes) return message;

    const parts = [];
    const emotes = [];

    Object.entries(tags.emotes).forEach(([id, ranges]) => {
        ranges.forEach(range => {
            const [start, end] = range.split("-").map(Number);
            emotes.push({ id, start, end });
        });
    });

    emotes.sort((a, b) => a.start - b.start);

    let last = 0;

    emotes.forEach(e => {
        parts.push(message.slice(last, e.start));
        parts.push(`<img src="https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/1.0" class="emote">`);
        last = e.end + 1;
    });

    parts.push(message.slice(last));

    return parts.join("");
}

async function load7TVEmotes(channelName) {
    try {
        const id = await fetch(`https://decapi.me/twitch/id/${channelName}`).then(r => r.text());
        const data = await fetch(`https://7tv.io/v3/users/twitch/${id}`).then(r => r.json());
        if (!data.emote_set) return;
        data.emote_set.emotes.forEach(e => {
            sevenTVEmotes[e.name] = `https://cdn.7tv.app/emote/${e.id}/2x.webp`;
        });
    } catch (e) {}
}

async function loadBTTVEmotes(channelName) {
    try {
        const id = await fetch(`https://decapi.me/twitch/id/${channelName}`).then(r => r.text());
        const global = await fetch(`https://api.betterttv.net/3/cached/emotes/global`).then(r => r.json());
        global.forEach(e => bttvEmotes[e.code] = `https://cdn.betterttv.net/emote/${e.id}/2x`);
        const channel = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${id}`).then(r => r.json());
        (channel.channelEmotes || []).forEach(e => bttvEmotes[e.code] = `https://cdn.betterttv.net/emote/${e.id}/2x`);
        (channel.sharedEmotes || []).forEach(e => bttvEmotes[e.code] = `https://cdn.betterttv.net/emote/${e.id}/2x`);
    } catch (e) {}
}

async function loadFFZEmotes(channelName) {
    try {
        const name = channelName.toLowerCase();
        const data = await fetch(`https://api.frankerfacez.com/v1/room/${name}`).then(r => r.json());
        if (data.sets) {
            Object.values(data.sets).forEach(set => {
                (set.emoticons || []).forEach(e => {
                    const url = e.urls?.["4"] || e.urls?.["2"] || e.urls?.["1"];
                    if (url) ffzEmotes[e.name] = `https:${url}`;
                });
            });
        }
        const global = await fetch(`https://api.frankerfacez.com/v1/set/global`).then(r => r.json());
        Object.values(global.sets || {}).forEach(set => {
            (set.emoticons || []).forEach(e => {
                const url = e.urls?.["4"] || e.urls?.["2"] || e.urls?.["1"];
                if (url) ffzEmotes[e.name] = `https:${url}`;
            });
        });
    } catch (e) {}
}

function replaceEmotes(text) {
    return text.split(" ").map(word => {
        const clean = word.replace(/[.,!?]/g, "");
        if (sevenTVEmotes[clean]) return `<img src="${sevenTVEmotes[clean]}" class="emote">`;
        if (bttvEmotes[clean]) return `<img src="${bttvEmotes[clean]}" class="emote">`;
        if (ffzEmotes[clean]) return `<img src="${ffzEmotes[clean]}" class="emote">`;
        return word;
    }).join(" ");
}

const client = new tmi.Client({
    channels: ['RuxLion']
});

client.connect();

load7TVEmotes("RuxLion");
loadBTTVEmotes("RuxLion");
loadFFZEmotes("RuxLion");

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    const username = tags['display-name'] || tags.username;
    const role = getRoleDetails(message, tags);

    let text = parseTwitchEmotes(message, tags);
    text = replaceEmotes(text);
    text = processItemCommands(text);

    addMessage({
        timestamp: getTime(),
        username,
        color: role.color,
        tag: role.tag,
        text
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
    if (tags.badges?.vip) return roleColors.vip;
    if (tags.badges?.subscriber) return roleColors.subscriber;
    return roleColors.default;
}

function addMessage({ timestamp, username, color, tag, text }) {
    const line = document.createElement("div");
    line.className = "chat-line";

    const user = username ? `[${username}]` : "";
    const tagText = tag ? `${tag} ` : "";
    const colon = username || tag ? ":" : "";

    line.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span class="channel">${tagText}</span>
        <span class="username" style="color:${color}">${user}</span>${colon}
        <span class="message">${text}</span>
    `;

    chatContainer.appendChild(line);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function processItemCommands(text) {
    return text.replace(/([LCURE])\[(.*?)\]/g, (m, t, i) => {
        const c = itemColors[t] || "white";
        return `<span style="color:${c}">[${i}]</span>`;
    });
}

function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/^/, '[').replace(/$/, ']');
}
