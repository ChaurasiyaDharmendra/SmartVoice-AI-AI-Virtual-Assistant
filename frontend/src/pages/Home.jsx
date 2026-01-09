import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(userDataContext);

  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);

  /* ================= LOGOUT ================= */
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      navigate("/signin");
    } catch (err) {
      setUserData(null);
    }
  };

  /* ================= SPEAK ================= */
  const speak = (text) => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";

    isSpeakingRef.current = true;

    utter.onend = () => {
      isSpeakingRef.current = false;
      setAiText("");
    };

    window.speechSynthesis.speak(utter);
  };

  /* ================= START LISTEN ================= */
  const startRecognition = () => {
    if (isSpeakingRef.current) return;

    try {
      recognitionRef.current.start();
      console.log("🎤 Listening started");
    } catch (err) {
      console.warn("Mic already running");
    }
  };

  /* ================= COMMAND HANDLER ================= */
  const handleCommand = (data) => {
    if (!data) return;

    const { type, userInput, response } = data;

    setAiText(response);
    speak(response);

    if (type === "google-search") {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,
        "_blank"
      );
    }

    if (type === "youtube-search" || type === "youtube-play") {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          userInput
        )}`,
        "_blank"
      );
    }

    if (type === "calculator-open") {
      window.open(`https://www.google.com/search?q=calculator`, "_blank");
    }

    if (type === "instagram-open") {
      window.open("https://www.instagram.com", "_blank");
    }

    if (type === "facebook-open") {
      window.open("https://www.facebook.com", "_blank");
    }

    if (type === "weather-show") {
      window.open("https://www.google.com/search?q=weather", "_blank");
    }
  };

  /* ================= SPEECH RECOGNITION ================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (e) => {
      console.warn("Speech error:", e.error);
      setListening(false);
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[0][0].transcript.trim();
      console.log("User said:", transcript);

      setUserText(transcript);

      try {
        const data = await getGeminiResponse(transcript);
        handleCommand(data);
      } catch (err) {
        console.error("Gemini error", err);
      }
    };

    // greeting once
    const greet = new SpeechSynthesisUtterance(
      `Hello ${userData?.name}, click the mic and speak`
    );
    window.speechSynthesis.speak(greet);

    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  /* ================= UI ================= */
  return (
    <div className="w-full h-screen bg-gradient-to-t from-black to-[#02023d] flex flex-col justify-center items-center gap-4">
      <button
        onClick={handleLogOut}
        className="absolute top-5 right-5 bg-white px-6 py-2 rounded-full"
      >
        Log Out
      </button>

      <button
        onClick={() => navigate("/customize")}
        className="absolute top-20 right-5 bg-white px-6 py-2 rounded-full"
      >
        Customize your Assistant
      </button>

      <div className="w-[300px] h-[400px] rounded-xl overflow-hidden shadow-lg">
        <img
          src={userData?.assistantImage}
          alt="assistant"
          className="w-full h-full object-cover"
        />
      </div>

      <h1 className="text-white text-lg">
        I'm {userData?.assistantName}
      </h1>

      <img
        src={listening ? aiImg : userImg}
        alt="mic"
        className="w-[180px] cursor-pointer"
        onClick={startRecognition}
      />

      <h1 className="text-white text-center px-6">
        {userText || aiText}
      </h1>
    </div>
  );
}

export default Home;
