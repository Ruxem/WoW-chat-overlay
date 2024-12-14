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
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return; 
  
    const username = tags['display-name'] || tags.username;
    const badges = tags.badges || {};
  
    const roles = getRolesFromBadges(badges); 
  
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
    const { color, tag } = getRoleDetails(roles, text); 
  
    const line = document.createElement("div");
    line.className = "chat-line";
    line.style.color = color; // Apply the role color to the entire message
  
    const processedText = processItemCommands(text); 

    // Replace the `[Guild]`, `[Say]`, and `[Party]` tags with the custom colors and tags
    const messageWithRoleTag = processedText.replace(/\[Guild\]/g, `<span style="color: ${roleColors.subscriber.color}">[Guild]</span>`)
        .replace(/\[Say\]/g, `<span style="color: ${roleColors.default.color}">[Say]</span>`)
        .replace(/\[Party\]/g, `<span style="color: ${roleColors.moderator.color}">[Party]</span>`);
  
    line.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="channel">${tag}</span> 
      <span class="username" style="color: ${color}">[${username}]</span>: 
      <span class="message">${messageWithRoleTag}</span>
    `;
  
    chatContainer.appendChild(line);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to bottom
}

function getRoleDetails(roles, text) {
    // Apply the role color to the entire message
    if (text.startsWith("W/")) {
        return roleColors.wFrom;
    }

    if (roles.includes("moderator")) return roleColors.moderator;
    if (roles.includes("subscriber")) return roleColors.subscriber;
    return roleColors.default;
}

function processItemCommands(text) {
    // Handle 'W/' prefix
    if (text.startsWith("W/")) {
        text = text.substring(2); // Remove 'W/' prefix
    }
    
    // Handle 'Y/' prefix (red color)
    if (text.startsWith("Y/")) {
        text = text.substring(2); // Remove 'Y/' prefix
        return `<span style="color: red;">[Y]</span> ${text}`;
    }

    // Handle '1/' prefix (light red color)
    if (text.startsWith("1/")) {
        text = text.substring(2); // Remove '1/' prefix
        return `<span style="color: rgb(255, 191, 191);">[1. General]</span> ${text}`;
    }

    // Handle '2/' prefix (light red color)
    if (text.startsWith("2/")) {
        text = text.substring(2); // Remove '2/' prefix
        return `<span style="color: rgb(255, 191, 191);">[2. Trade]</span> ${text}`;
    }

    // Process other item commands (like [L], [C], etc.)
    return text.replace(/([LCURE])\[(.*?)\]/g, (match, type, itemName) => {
        const color = itemColors[type] || "white";
        return `<span style="color: ${color};">[${itemName}]</span>`;
    });
}
