const roleColors = {
    moderator: { color: "rgb(170, 170, 255)", tag: "[Party]" },
    subscriber: { color: "rgb(64, 255, 64)", tag: "[Guild]" },
    default: { color: "white", tag: "[Say]" },
    wFrom: { color: "rgb(255, 128, 255)", tag: "[W From]" },
};

const itemColors = {
    L: "orange",   
    C: "gray",      
    U: "green",     
    R: "blue",      
    E: "purple",    
};

const chatContainer = document.getElementById("chat-container");

const client = new tmi.Client({
    channels: ['theruxemburg'], 
    identity: {
        username: 'theruxemburg', 
        password: 'oauth:wbd5m0es8winbkfkj3fuulwj768uzj'
    }
});

client.connect();

client.on('connected', (address, port) => {
    console.log(`Connected to ${address}:${port}`);
});

client.on('message', (channel, tags, message, self) => {
    if (self) return; // Ignore own messages
  
    const username = tags['display-name'] || tags.username;
    const badges = tags.badges || {};
  
    const roles = getRolesFromBadges(badges); // Get user roles based on badges
  
    addMessage({
        timestamp: new Date().toLocaleTimeString(),
        username: username,
        roles: roles,
        text: message,
    });
});

function getRolesFromBadges(badges) {
    const roles = [];
    if (badges.moderator) roles.push("moderator");
    if (badges.subscriber) roles.push("subscriber");
    if (badges.broadcaster) roles.push("broadcaster");
    return roles;
}

function addMessage({ timestamp, username, roles, text }) {
    const { color, tag } = getRoleDetails(roles, text); // Get role color and tag
  
    const line = document.createElement("div");
    line.className = "chat-line";
    line.style.color = color;
  
    const processedText = processItemCommands(text); // Process item commands

    line.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="channel">${tag}</span> 
      <span class="username" style="color: ${color}">[${username}]</span>: 
      <span class="message">${processedText}</span>
    `;
  
    chatContainer.appendChild(line);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to bottom
}

function getRoleDetails(roles, text) {
    if (text.startsWith("W/")) {
        return roleColors.wFrom;
    }

    if (roles.includes("moderator")) return roleColors.moderator;
    if (roles.includes("subscriber")) return roleColors.subscriber;
    return roleColors.default;
}

function processItemCommands(text) {
    return text.replace(/([LCURE])\[(.*?)\]/g, (match, type, itemName) => {
        const color = itemColors[type] || "white";
        return `<span style="color: ${color};">[${itemName}]</span>`;
    });
}
