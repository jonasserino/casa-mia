require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");

const Note = require("./models/note");

const PORT = process.env.PORT || 3001;

app.use(cors());
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

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.get("/api/notes", (request, response) => {
  Note.find({}).then((notes) => {
    response.json(notes);
  });
});

app.get("/api/notes/:id", (request, response, next) => {
  const id = request.params.id;

  Note.findById(id)
    .then((note) => {
      if (note) {
        response.json(note);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => {
      next(error);
    });
});

app.post("/api/notes", (request, response, next) => {
  const body = request.body;

  if (!body.content) {
    return response.status(400).json({
      error: "Content missing",
    });
  }

  const note = new Note({
    content: body.content,
    important: Boolean(body.important) || false,
  });

  note
    .save()
    .then((savedNote) => {
      response.json(savedNote);
    })
    .catch((error) => next(error));
});

app.put("/api/notes/:id", (request, response, next) => {
  const id = request.params.id;
  const body = request.body;

  const note = {
    content: body.content,
    important: body.important,
  };

  Note.findByIdAndUpdate(id, note, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedNote) => {
      response.json(updatedNote);
    })
    .catch((error) => next(error));
});

app.delete("/api/notes/:id", (request, response) => {
  const id = request.params.id;

  Note.findByIdAndDelete(id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "Malformatted ID" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }
};

app.use(unknownEndpoint);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
