const roleColors = {
    moderator: { color: "rgb(170, 170, 255)", tag: "[Party]" },
    subscriber: { color: "rgb(64, 255, 64)", tag: "[Guild]" },
    default: { color: "white", tag: "[Say]" },
    wFrom: { color: "rgb(255, 128, 255)", tag: "[W From]" },
    yell: { color: "red", tag: "[Y]" },
    general: { color: "rgb(255, 191, 191)", tag: "[1. General]" },
    trade: { color: "rgb(255, 191, 191)", tag: "[2. Trade]" },
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
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return; 
  
    const username = tags['display-name'] || tags.username;
    const { color, tag } = getRoleDetails(message, tags); 

    const processedText = processItemCommands(message); 

    addMessage({
        timestamp: new Date().toLocaleTimeString(),
        username: username,
        color: color,
        tag: tag,
        text: processedText,
    });
});

function getRoleDetails(text, tags) {
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
    if (tags.badges?.moderator) roles.push(roleColors.moderator);
    if (tags.badges?.subscriber) roles.push(roleColors.subscriber);
    if (roles.length > 0) return roles[0]; // Return first matched role

    return roleColors.default; // Default role
}

function addMessage({ timestamp, username, color, tag, text }) {
    const line = document.createElement("div");
    line.className = "chat-line";
    line.style.color = color;

    const cleanText = text.replace(/^(W\/|Y\/|1\/|2\/)/, "");

    line.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="channel">${tag}</span> 
      <span class="username" style="color: ${color}">[${username}]</span>: 
      <span class="message">${cleanText}</span>
    `;
  
    chatContainer.appendChild(line);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function processItemCommands(text) {
    // Replace item tags (L[], C[], U[], etc.) with appropriate colors
    return text.replace(/([LCURE])\[(.*?)\]/g, (match, type, itemName) => {
        const color = itemColors[type] || "white";
        return `<span style="color: ${color};">[${itemName}]</span>`;
    });
}
