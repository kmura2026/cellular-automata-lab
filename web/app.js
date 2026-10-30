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

/** Delay between rows, so the evolution can be watched. */
const ROW_DELAY_MS = 50;
/** Counts Draw presses; a running animation stops when it is no longer the latest. */
let drawing = 0;

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
  const id = ++drawing;
  const drawRow = (y) => {
    if (id !== drawing || y >= rows.length) return;
    rows[y].forEach((v, x) => {
      if (v) ctx.fillRect(x * cell, y * cell, cell, cell);
    });
    setTimeout(drawRow, ROW_DELAY_MS, y + 1);
  };
  drawRow(0);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  draw();
});
draw();
