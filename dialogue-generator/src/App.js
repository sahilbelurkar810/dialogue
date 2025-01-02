import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [context, setContext] = useState("");
  const [characters, setCharacters] = useState([
    { displayName: "", characteristics: "", occupation: "", relationship: "" },
    { displayName: "", characteristics: "", occupation: "", relationship: "" },
    { displayName: "", characteristics: "", occupation: "", relationship: "" },
  ]);
  const [length, setLength] = useState("short");
  const [dialogue, setDialogue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCharacterChange = (index, field, value) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index][field] = value;
    setCharacters(updatedCharacters);
  };

  const generateDialogue = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/generate-dialogue",
        {
          context,
          characters,
          length,
        }
      );
      setDialogue(response.data.dialogue);
    } catch (error) {
      console.error("Error generating dialogue:", error);
      setDialogue("ERROR: Failed to generate dialogue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addCharacter = () => {
    if (characters.length < 5) {
      setCharacters([
        ...characters,
        { displayName: "", characteristics: "", occupation: "", relationship: "" },
      ]);
    }
  };

  const removeCharacter = (index) => {
    if (characters.length > 2) {
      const updatedCharacters = characters.filter((_, i) => i !== index);
      setCharacters(updatedCharacters);
    }
  };

  return (
    <div className="app-container">
      <div className="cyber-header">
        <h1>DIALOGUE<span className="accent">_</span>GENERATOR</h1>
        <div className="header-line"></div>
      </div>

      <div className="cyber-container">
        <div className="input-section">
          <div className="section-label">SCENARIO_PARAMETERS</div>
          <textarea
            className="cyber-textarea"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Enter scenario context..."
          />

          <div className="section-label">CHARACTER_CONFIGURATION</div>
          <div className="characters-grid">
            {characters.map((character, index) => (
              <div key={index} className="character-card">
                <div className="card-header">
                  <input
                    type="text"
                    className="character-name-input"
                    value={character.displayName}
                    onChange={(e) => handleCharacterChange(index, "displayName", e.target.value)}
                    placeholder="Enter name..."
                  />
                  {characters.length > 2 && (
                    <button
                      className="remove-button"
                      onClick={() => removeCharacter(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="cyber-input"
                  value={character.characteristics}
                  onChange={(e) =>
                    handleCharacterChange(index, "characteristics", e.target.value)
                  }
                  placeholder="Attributes"
                />
                <input
                  type="text"
                  className="cyber-input"
                  value={character.occupation}
                  onChange={(e) =>
                    handleCharacterChange(index, "occupation", e.target.value)
                  }
                  placeholder="Function"
                />
                <input
                  type="text"
                  className="cyber-input"
                  value={character.relationship}
                  onChange={(e) =>
                    handleCharacterChange(index, "relationship", e.target.value)
                  }
                  placeholder="Connection"
                />
              </div>
            ))}
          </div>

          {characters.length < 5 && (
            <button className="cyber-button add-button" onClick={addCharacter}>
              ADD_CHARACTER
            </button>
          )}

          <div className="controls">
            <select
              className="cyber-select"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              <option value="short">BRIEF</option>
              <option value="medium">STANDARD</option>
              <option value="long">EXTENDED</option>
            </select>

            <button
              className={`cyber-button generate-button ${isLoading ? "loading" : ""}`}
              onClick={generateDialogue}
              disabled={isLoading}
            >
              {isLoading ? "PROCESSING..." : "INITIALIZE_DIALOGUE"}
            </button>
          </div>
        </div>

        <div className="output-section">
          <div className="section-label">OUTPUT_STREAM</div>
          <pre className="dialogue-output">
            {dialogue || "Awaiting dialogue generation..."}
          </pre>
        </div>

        <div className="status-bar">
          <div className="status-item">
            CHARACTERS: {characters.length}
          </div>
          <div className="status-item">
            MODE: {length.toUpperCase()}
          </div>
          <div className="status-item">
            STATUS: {isLoading ? "PROCESSING" : "READY"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
