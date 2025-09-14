import React from "react"
import { useState } from "react"
import {languages} from "./languages"
import { clsx } from 'clsx';

export default function AssemblyEndgame() {

  const [currentWord, setCurrentWord] = useState("react")
  const alphabet = "abcdefghijklmnopqrstuvwxyz"

  const [guessedLetters, setGuessedLetters] = useState([])

  console.log("Guessed letters:", guessedLetters)

  const eachLetter = (currentWord.split("")).map((letter, index) => {
    return(
      <>
        <span key={index}
        className="each-letter">
          {letter}
        </span>
      </>
    )
  })

  const langMap = languages.map((lang) => {
    return (
      <>
        <span key={lang.name}
        style={{color: lang.color, backgroundColor: lang.backgroundColor}}
        className="language"
        >
          {lang.name}
        </span>
      </>
    )
  })

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
        className={buttonClass}>
            {letter}
      </button>
    );
  });

  function addingGuessedLetters(letter) {
    console.log("Clicked:", letter)
    setGuessedLetters(prevLetters => 
      prevLetters.includes(letter) ? prevLetters : [...prevLetters, letter]
    )
  }
  
  return (
      <main>
          <header>
              <h1>Assembly: Endgame</h1>
              <p>Guess the word in under 8 attempts to keep the programming world safe from Assembly!</p>
          </header>
          <section className="status-card">
            <h6>You Win!</h6>
            <p>Well done! 🎉</p>
          </section>
          <section className="language-chips"> 
            {langMap}
          </section>
          <section className="guessWord"> 
            {eachLetter}
          </section>
          <section className="keyboard">
            {keyboardElements}
          </section>
          <button className="new-game">New Game</button>
      </main>
  )
}