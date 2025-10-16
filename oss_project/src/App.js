import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';

function Hello(props) {
  return (
    <h1>Hello, {props.name} ({props.age})</h1>
  )
}

function Count(){
  const [count, setCount] = useState(0);
  return (
    <button onClick={ () => setCount(count + 1) }>Count {count}</button>
  )
}

function NameList() {
  const names = ['Teawoo', 'Daeyeon', 'Jiwon'];
  return (
    <ul>
      {
        names.map((name, index) => <li key={index}>{name}</li> )
      }
    </ul>
  )
}

function HelloBtn() {
  const message = () => {
    alert("Hello!");
  }
  return (
    <button onClick={message}>Say Hello</button>
  )
}

function HelloBtn2() {
  const message = (name) => {
    alert(`Hello, ${name}!`);
  }
  return (
    <button onClick={() => message('Teawoo')}>Say Hello</button>
  )
}
function App() {
  return (
    <div className="App">
      <Hello name="Teawoo" age={21} />
      <HelloBtn />
      <HelloBtn2 />
      
      
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <NameList />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <br></br>
        <Count />
      </header>
    </div>
  );
}

export default App;
