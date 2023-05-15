import React from "react";
import {Box, Button, Container, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import {toByteArray} from 'base64-js';
import {Howl} from 'howler';
import convert from "./gedcomx-viewer/GedcomXMapper";
import GedcomXPanel from "./gedcomx-viewer/GedcomXPanel";
import {INDEXING_PROMPT} from "./gedcomx-viewer/DefaultPrompts";
import {jsonrepair} from "jsonrepair";

const LOCAL_SERVER_HOST = "http://localhost:3001";
const LANGUAGES = {
  english: {
    code: "en",
    prompt: "Hello, I'll be interviewing you to learn more about your family history. Please tell me a little about yourself and your family."
  },
  korean: {code: "ko", prompt: "안녕하세요. 가족 역사에 대해서 여쭤보겠습니다. 자기 소개 잠깐 해주실 수 있으세요?"}
};
const INTERVIEWER_PROMPT = `You are an interviewer. Your goal is to learn about my family history. Ask questions to learn about me, my family, and my ancestors so that I can trace my lineage. Ask questions to recover vital information like birth, death, marriage, etc...
Be professional, sincere, and polite. 
Ask one question at a time. Keep questions short if possible. Do not roleplay by yourself.`;

const transcribeSpeech = async (audioURL, conversation, language) => {
  const resolveObjectURL = async (url) => {
    try {
      const response = await fetch(url);
      return await response.blob();
    } catch (error) {
      console.error("Error resolving audio URL to a blob:", error);
    }
  };

  try {
    const audioBlob = await resolveObjectURL(audioURL);
    const audioFile = new File([audioBlob], "recording.mp3", {type: audioBlob.type});

    const body = new FormData();
    body.append("audioFile", audioFile);
    body.append("conversation", JSON.stringify(conversation));

    const request = {
      method: "POST",
      body: body
    };
    const response = await fetch(`${LOCAL_SERVER_HOST}/transcribe?language=${language}`, request);
    return await response.text();
  } catch (error) {
    console.log("Error transcribing audio:", error);
    return "";
  }
};

const extractStructuredData = async (conversation) => {
  const conversationText = conversation
    .filter(message => message.role !== "system")
    .map(message => {
      const role = message.role;
      const content = message.content;
      return `${role}: ${content}`;
    })
    .join("\n");

  const messages = [{role: "user", content: `${INDEXING_PROMPT}\n\n${conversationText}`}];
  try {
    const request = {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(messages)
    };
    const completionContent = await fetch(`${LOCAL_SERVER_HOST}/chat`, request);
    const text = await completionContent.text();
    const repaired = jsonrepair(text);
    return JSON.parse(repaired);
  } catch (error) {
    console.error("Error indexing records", error);
    return {error: error};
  }
};

const createChatCompletion = async (messages) => {
  try {
    const request = {
      method: "POST",
      body: JSON.stringify(messages)
    };
    const completionContent = await fetch(`${LOCAL_SERVER_HOST}/chat`, request);
    return await completionContent.text();
  } catch (error) {
    console.log(error);
  }
};

const synthesizeSpeech = async (text, language) => {
  const request = {
    method: "POST",
    headers: {"Content-Type": "text/plain"},
    body: text
  };
  try {
    const response = await fetch(`${LOCAL_SERVER_HOST}/synthesize?language=${LANGUAGES[language].code}`, request);
    const data = await response.json();
    const binaryData = toByteArray(data.base64);
    const blob = new Blob([binaryData], {type: 'audio/mpeg'});
    const url = URL.createObjectURL(blob);
    const speech = new Howl({src: [url], format: "mp3"});
    speech.play();
  } catch (error) {
    console.log(error);
  }
};

const ConversationPage = () => {
  const [language, setLanguage] = React.useState("english");
  const [conversation, setConversation] = React.useState([]);
  const [listening, setListening] = React.useState(false);
  const [records, setRecords] = React.useState([]);

  const mediaRecorderRef = React.useRef();

  const START_PROMPT = LANGUAGES[language].prompt;
  const inProgress = conversation.length > 0; // Conversation is in progress
  const paused = !listening && inProgress;
  const canResume = inProgress && paused;
  const recordButtonText = canResume ? "Speak" : "Stop";
  const interviewNotStarted = !inProgress && !listening;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.addEventListener('dataavailable', event => {
        chunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const blob = new Blob(chunks, {type: 'audio/mpeg; codecs=mp3'});
        const url = URL.createObjectURL(blob);

        const transcription = await transcribeSpeech(url, conversation, LANGUAGES[language].code);
        const messages = [...conversation, {role: "user", content: transcription}];
        // At this point, try creating a graph from the data
        extractStructuredData(messages).then(data => setRecords([data]));

        // To be seen if this helps. It may make the interviewer "too focused"
        const messagesWithGuidancePrompt = [...messages, {role: "system", content: INTERVIEWER_PROMPT}];
        const completionContent = await createChatCompletion(messagesWithGuidancePrompt);

        synthesizeSpeech(completionContent, language);
        messages.push({role: "assistant", content: completionContent});
        setConversation(messages);
      });

      mediaRecorder.start();

      mediaRecorderRef.current = mediaRecorder;
      setListening(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    setListening(false);
    await mediaRecorderRef.current.stop();
  };

  const handleStartInterview = () => {
    console.log("Interview started...");
    setRecords([]);
    const systemPrompt = {role: "system", content: INTERVIEWER_PROMPT};
    const startPrompt = {role: "assistant", content: START_PROMPT};
    // const startMessage = {role: "system", content: "Start a conversation with me."};
    // const startMessage = {role: "system", content: "대화를 시작해주세요."};
    const messages = [systemPrompt, startPrompt];
    synthesizeSpeech(START_PROMPT, language);
    setConversation(messages);
  };

  const handleRecordClick = async () => {
    if (listening) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleEndClick = () => {
    console.log("Interview ended");
    setListening(false);
    // Save off conversation to do stuff
    setConversation([]);
  };

  const recordButton = interviewNotStarted ?
    <Button
      onClick={handleStartInterview}
      variant="contained"
      sx={{
        color: "white",
        backgroundColor: "green",
        ":hover": {backgroundColor: "darkgreen"},
        width: "100%",
        padding: 1,
      }}
    >
      Start Interview
    </Button> :
    <Button
      onClick={handleRecordClick}
      variant="contained"
      sx={{
        width: "66%",
        padding: 1,
      }}
    >
      {recordButtonText}
    </Button>;
  const endInterviewButton = (
    <Button onClick={handleEndClick} variant="outlined" sx={{
      color: "white",
      backgroundColor: "red",
      ":hover": {backgroundColor: "darkred"},
      width: "33%",
      padding: 1,
    }}>
      End Interview
    </Button>
  );

  return (
    <Container maxWidth={"lg"}>
      <Typography variant={"h4"}>AI Interviewer Demo</Typography>
      <Stack spacing={2} sx={{marginY: 2}}>
        <Stack direction="row" spacing={1}>
          {recordButton}
          {inProgress && paused && endInterviewButton}
        </Stack>
        <Box sx={{flexGrow: 1}}>
          {conversation && conversation.length > 0 && <ConversationDisplay conversation={conversation}/>}
        </Box>
        {records && <Box>
          <GedcomXPanel ambiguousGedcomX={convert(records)}/>
        </Box>}
      </Stack>
      <Box sx={{display: "flex", justifyContent: "flex-end"}}>
        <ToggleButtonGroup exclusive value={language} onChange={(event, newValue) => setLanguage(newValue)}>
          <ToggleButton value={"english"}>EN</ToggleButton>
          <ToggleButton value={"korean"}>KO</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Container>
  );
};

const ConversationDisplay = ({conversation}) => {
  const displayElements = conversation
    .filter(message => message.role !== "system")
    .map((message, key) => {
      const role = message.role;
      const content = message.content;
      const backgroundColor = role === "user" ? "#d9ffef" : "#dce1ff";
      const position = role === "user" ? "flex-end" : "flex-start";

      return (
        <Box key={`interaction-${key}`} sx={{justifyContent: position, display: "flex"}}>
          <Paper variant="outlined" sx={{backgroundColor: backgroundColor, padding: 2}}>
            <Typography>{content}</Typography>
          </Paper>
        </Box>
      );
    });

  return (
    <Paper sx={{padding: 2}} variant={"outlined"}>
      <Stack sx={{overflowY: "auto", flexGrow: 1}} spacing={1}>
        {displayElements}
      </Stack>
    </Paper>
  );
};

export default ConversationPage;
