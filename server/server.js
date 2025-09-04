import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Health check endpoint for Ollama
 * Verifies if the Ollama service is running locally.
 */
app.get("/ollama-health", async (req, res) => {
  try {
    await axios.get("http://localhost:11434/");
    res.status(200).send({ status: "Ollama running" });
  } catch (err) {
    res.status(500).send({ error: "Ollama not running or unreachable" });
  }
});

/**
 * Root endpoint (sanity check for this API)
 */
app.get("/", (req, res) => {
  res.status(200).send({ message: "Hello from Local AI" });
});

/**
 * Chat endpoint
 * Accepts a user prompt and generation options,
 * forwards them to Ollama, and returns the AI's reply.
 */
app.post("/", async (req, res) => {
  try {
    const { prompt, options } = req.body;

    const { data } = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3.2:3b", // fixed model selection
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      stream: false,
      options: {
        ...options,
        stop: ["###"] // custom stop sequence
      }
    });

    res.status(200).send({ bot: data.message?.content || "(no text)" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

/**
 * Start local server
 */
app.listen(5000, () => {
  console.log("Local AI server started on http://localhost:5000");
});
