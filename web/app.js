import { pattern } from "./pattern.js";

const form = document.getElementById("form");
const message = document.getElementById("message");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/** Empty input becomes NaN so that pattern() rejects it. */
function value(id) {
  const text = document.getElementById(id).value.trim();
  return text === "" ? Number.NaN : Number(text);
}

function draw() {
  let rows;
  try {
    rows = pattern(value("rule"), value("width"), value("generations"));
  } catch (err) {
    if (!(err instanceof RangeError)) throw err;
    message.textContent = err.message;
    return;
  }
  message.textContent = "";
  const cell = Math.max(1, Math.min(10, Math.floor(700 / rows[0].length)));
  canvas.width = rows[0].length * cell;
  canvas.height = rows.length * cell;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  rows.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v) ctx.fillRect(x * cell, y * cell, cell, cell);
    });
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  draw();
});
draw();
