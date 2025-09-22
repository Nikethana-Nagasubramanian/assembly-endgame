import React, { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { languages } from "./languages";
import { clsx } from "clsx";
import { getFarewellText, getRandomWord } from "./utils";
import { getHint } from "./ai";

export default function AssemblyEndgame() {
  //State variables
  const [currentWord, setCurrentWord] = useState(() => getRandomWord());
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [hint, setHint] = useState();

  //Derived variables
  const wrongGuessCount = guessedLetters.filter(
    (letter) => !currentWord.includes(letter)
  ).length;
  const lastGuessedLetter = guessedLetters[guessedLetters.length - 1];
  const isLastGuessIncorrect =
    lastGuessedLetter && !currentWord.includes(lastGuessedLetter);

  const isGameWon = currentWord
    .split("")
    .every((letter) => guessedLetters.includes(letter));

  const isGameLost = wrongGuessCount >= languages.length - 1;
  const isGameOver = isGameWon || isGameLost;

  //Static variables
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  const fetchHint = useCallback(async () => {
    try {
      const newHint = await getHint(currentWord);
      setHint(newHint);
      console.log('fetched hint:', newHint); // log the fresh value
    } catch (err) {
      console.error('Error getting hint:', err);
      alert('Failed to fetch hint. Check console for details.');
    }
  }, [currentWord]);
  
  useEffect(() => {
    fetchHint();
  }, [fetchHint]);  

  const eachLetter = currentWord.split("").map((letter, index) => {
    const letterClassName = clsx(
      isGameLost && !guessedLetters.includes(letter) && "missed-letter"
    ) 
    return (
      <span key={index} className={letterClassName}>
        {(isGameOver && isGameLost ? letter : (guessedLetters.includes(letter) ? letter : ""))}
      </span>
    );
  });

  const langMap = languages.map((lang, index) => {
    const isLangLost = index < wrongGuessCount;
    return (
      <>
        <span
          key={lang.name}
          style={{ color: lang.color, backgroundColor: lang.backgroundColor }}
          className={`chip ${isLangLost ? "lost" : ""}`}
        >
          {lang.name}
        </span>
      </>
    );
  });

  const keyboardElements = alphabet.split("").map((letter) => {
    const buttonClass = clsx("letter-button", {
      correct: currentWord.includes(letter) && guessedLetters.includes(letter),
      incorrect:
        !currentWord.includes(letter) && guessedLetters.includes(letter),
    });

    return (
      <button
        key={letter}
        onClick={() => addingGuessedLetters(letter)}
        className={buttonClass}
        disabled={isGameOver ? true : false}
        aria-disabled={guessedLetters.includes(letter)}
        aria-label={`Letter ${letter}`}
      >
        {letter}
      </button>
    );
  });

  useEffect(() => {
    function handleKeyDown(event) {
      if(isGameOver && isGameLost) {
        return
      }
      const key = event.key.toLowerCase();
      if (key.length === 1 && key >= "a" && key <= "z") {
        addingGuessedLetters(key);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addingGuessedLetters]);  

  function addingGuessedLetters(letter) {
    setGuessedLetters((prevLetters) =>
      prevLetters.includes(letter) ? prevLetters : [...prevLetters, letter]
    );
  }

  const gameStatusClass = clsx("status-card", {
    won: isGameWon,
    lost: isGameLost,
    farewell: !isGameLost && !isGameWon,
  });

  function renderStatusContent() {
    if (isGameOver && isGameWon) {
      return (
        <div>
          <h5>You Win!</h5>
          <p>Well done! 🎉</p>
        </div>
      );
    }

    if (isGameOver && isGameLost) {
      return (
        <div>
          <h5>You Lose!</h5>
          <p>Go learn Assembly now.</p>
        </div>
      );
    }

    if (!isGameOver && isLastGuessIncorrect) {
      return (
        <div>
          <p>{getFarewellText(languages[wrongGuessCount - 1].name)}</p>
        </div>
      );
    } else {
      return (
        <div>
          <p>Save the {languages.length - wrongGuessCount} languages!</p>
        </div>
      );
    }
  }

  function resetGame() {
    setCurrentWord(getRandomWord())
    setGuessedLetters([])
  }

  return (
    <main>
      <header>
        <h1>Assembly: Endgame</h1>
        <p>
          Guess the word in under 8 attempts to keep the programming world safe
          from Assembly! (If you lose, you have to learn Assembly)
        </p>
      </header>
      <section className={gameStatusClass} aria-live="polite" role="status">
        {renderStatusContent()}
      </section>
      <section className="language-chips">{langMap}</section>
      <section className="guessWord">{eachLetter}</section>
      {
      (wrongGuessCount > 5) && 
      <section className="hint">
        <h3>Hint:</h3>
        <p>{hint}</p>
      </section>
      }
      <section className="keyboard">{keyboardElements}</section>
      
      {isGameOver && 
      <button className="new-game"
              onClick={() => resetGame()}
      >New Game</button>}

    </main>
  );
}
