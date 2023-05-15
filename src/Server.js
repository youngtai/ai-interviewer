const express = require("express");
const multer = require("multer");
const cors = require('cors');
const {GoogleAuth} = require('google-auth-library');
const tts = require('@google-cloud/text-to-speech');
const {OpenAIApi, Configuration} = require("openai");
const fs = require("fs");
// const { Readable } = require('stream');

// Must do the following for authorization:
// export GOOGLE_APPLICATION_CREDENTIALS="/Path/to/credentials.json"
// export OPENAI_API_KEY=<your-api-key>

const app = express();
const upload = multer();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const GPT_MODEL = "gpt-3.5-turbo";
const WHISPER_MODEL = "whisper-1";

const googleTTS = new tts.TextToSpeechClient();

const LANGUAGE_TO_CODE_MAP = {
  en: {code: "en-US", name: "en-US-Neural2-I"},
  ko: {code: "ko-KR", name: "ko-KR-Neural2-A"}
};

const CLIENT_HOST = "http://localhost:3000";
const config = {
  origin: CLIENT_HOST,
  methods: ["POST"]
};
app.use(cors(config));

app.post("/synthesize", async (request, response) => {
  console.log("Request URL:", request.url);

  const {language} = request.query;

  console.log("Using language", LANGUAGE_TO_CODE_MAP[language].code);
  console.log("Using voice", LANGUAGE_TO_CODE_MAP[language].name);

  const getGoogleCloudToken = async () => {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    return await client.getAccessToken();
  };
  const token = await getGoogleCloudToken();

  let body = "";
  request.on("data", chunk => {
    body += chunk.toString();
  });
  request.on("end", async () => {
    try {
      const request = {
        input: {text: body},
        voice: {languageCode: LANGUAGE_TO_CODE_MAP[language].code, name: LANGUAGE_TO_CODE_MAP[language].name},
        audioConfig: {audioEncoding: 'MP3'},
        headers: {Authorization: `Bearer ${token}`}
      };
      const [synthesizeResponse] = await googleTTS.synthesizeSpeech(request);
      const audioSrc = {
        audioContent: synthesizeResponse.audioContent,
        base64: `${synthesizeResponse.audioContent.toString("base64")}`
      };

      response.writeHead(200, {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": CLIENT_HOST
      });
      response.write(JSON.stringify(audioSrc));
      response.end();
    } catch (error) {
      console.error(error);
      response.writeHead(500, {'Content-Type': 'text/plain'});
      response.write('Error occurred');
      response.end();
    }
  });
});

app.post("/chat", async (request, response) => {
  let body = "";
  request.on("data", chunk => {
    body += chunk.toString();
  });
  request.on("end", async () => {
    try {
      const request = {model: GPT_MODEL, messages: JSON.parse(body)};
      const completion = await openai.createChatCompletion(request);
      const completionContent = completion.data.choices[0].message.content;

      response.writeHead(200, {'Content-Type': 'text/plain', "Access-Control-Allow-Origin": CLIENT_HOST});
      response.write(completionContent);
      response.end();
    } catch (error) {
      console.error(error);
      response.writeHead(500, {'Content-Type': 'text/plain'});
      response.write('Error occurred');
      response.end();
    }
  });
});

app.post("/transcribe", upload.single("audioFile"), async (request, response) => {
  const conversationToString = (conversation) => {
    return conversation
      .filter(message => message.role !== "system")
      .map(message => {
        const role = message.role;
        const content = message.content;
        return `${role}: ${content}`;
      })
      .join("\n");
  };

  const {language} = request.query;
  const conversation = JSON.parse(request.body.conversation);
  const audioFile = request.file;
  const tempFile = "/Users/youngtai/work/temp-speech.mp3";
  fs.writeFileSync(tempFile, audioFile.buffer);
  const audioStream = fs.createReadStream(tempFile);

  // const audioStream = new Readable();
  // audioStream.push(audioFile.buffer);
  // audioStream.push(null); // Signal the end of the stream

  try {
    console.log("Making /transcribe request");
    const transcriptionResponse = await openai.createTranscription(audioStream, WHISPER_MODEL, conversationToString(conversation), "json", 0, language);
    const transcriptionText = transcriptionResponse.data.text;
    console.log(transcriptionText);

    response.writeHead(200, {'Content-Type': 'text/plain', "Access-Control-Allow-Origin": CLIENT_HOST});
    response.write(transcriptionText);
    response.end();
  } catch (error) {
    console.error(error);
    response.writeHead(500, {'Content-Type': 'text/plain'});
    response.write('Error occurred');
    response.end();
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
