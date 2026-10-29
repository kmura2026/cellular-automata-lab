const form = document.getElementById("form");
const message = document.getElementById("message");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function draw() {
  const query = new URLSearchParams({
    rule: document.getElementById("rule").value,
    width: document.getElementById("width").value,
    generations: document.getElementById("generations").value,
  });
  try {
    const res = await fetch(`/api/run?${query}`);
    const body = await res.json();
    if (!res.ok) {
      message.textContent = body.error;
      return;
    }
    message.textContent = "";
    const rows = body.rows;
    const cell = Math.max(1, Math.min(10, Math.floor(700 / rows[0].length)));
    canvas.width = rows[0].length * cell;
    canvas.height = rows.length * cell;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    rows.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) ctx.fillRect(x * cell, y * cell, cell, cell);
      });
    });
  } catch {
    message.textContent = "Could not reach the server. Is it still running?";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  draw();
});
draw();
