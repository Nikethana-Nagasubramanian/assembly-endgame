import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { languages } from "./languages";
import { clsx } from "clsx";
import { getFarewellText, getRandomWord } from "./utils";

export default function AssemblyEndgame() {
  //State variables
  const [currentWord, setCurrentWord] = useState(() => getRandomWord());

  console.log(currentWord)
  const [guessedLetters, setGuessedLetters] = useState([]);

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

  const eachLetter = currentWord.split("").map((letter, index) => {
    return (
      <span key={index} className="each-letter">
        {guessedLetters.includes(letter) ? letter : ""}
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
          <h6>You Win!</h6>
          <p>Well done! 🎉</p>
        </div>
      );
    }

    if (isGameOver && isGameLost) {
      return (
        <div>
          <h6>You Lose!</h6>
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

  return (
    <main>
      <header>
        <h1>Assembly: Endgame</h1>
        <p>
          Guess the word in under 8 attempts to keep the programming world safe
          from Assembly!
        </p>
      </header>
      <section className={gameStatusClass} aria-live="polite" role="status">
        {renderStatusContent()}
      </section>
      <section className="language-chips">{langMap}</section>
      <section className="guessWord">{eachLetter}</section>
      <section className="keyboard">{keyboardElements}</section>
      {isGameOver && <button className="new-game">New Game</button>}
    </main>
  );
}
