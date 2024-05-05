const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");

const PORT = process.env.PORT || 3001;

app.use(cors());

let notes = [
  { id: 1, content: "HTML is easy", important: true },
  { id: 2, content: "Browser can execute only JavaScript", important: false },
  {
    id: 3,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true,
  },
];

function generateNoteId() {
  const maxId =
    notes.length > 0 ? Math.max(...notes.map((note) => note.id)) : 0;

  return maxId + 1;
}

app.use(express.json());

morgan.token("body", function (req) {
  return JSON.stringify(req.body);
});

app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
      "-",
      "body:",
      tokens["body"](req, res),
    ].join(" ");
  })
);

app.post("/api/notes", (request, response) => {
  const body = request.body;

  if (!body.content) {
    return response.status(400).json({
      error: "Content missing",
    });
  }

  const newNote = {
    id: generateNoteId(),
    content: body.content,
    important: Boolean(body.important) || false,
  };
  notes.push(newNote);
  response.json(newNote);
});

app.get("/api/notes", (request, response) => {
  response.json(notes);
});

app.get("/api/notes/:id", (request, response) => {
  const id = +request.params.id;
  const note = notes.find((note) => note.id === id);

  if (note) {
    response.json(note);
  } else {
    response.statusMessage = "Note note found";
    response.status(400).end();
  }
});

app.delete("/api/notes/:id", (request, response) => {
  const id = +request.params.id;
  const deletedNote = notes.find((note) => note.id === id);

  if (deletedNote) {
    notes = notes.filter((note) => note.id !== id);

    response.status(204).json({
      deletedNote: deletedNote,
      notes,
    });
  } else {
    response.statusMessage = "Note not found";
    response.status(400).end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
