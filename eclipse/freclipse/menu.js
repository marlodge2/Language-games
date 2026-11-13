// List of available text files in the same folder
// You can expand this list manually or generate it server-side
const stories = ["visitors.txt", "journey.txt", "mystery.txt"];

const list = document.getElementById("storyList");
stories.forEach((file) => {
  const li = document.createElement("li");
  const link = document.createElement("a");
  link.href = `game.html?story=${file}`;
  link.innerText = file.replace(".txt", "");
  li.appendChild(link);
  list.appendChild(li);
});