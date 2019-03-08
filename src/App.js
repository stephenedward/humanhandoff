import React, { Component } from 'react';
import './App.css';
import './main';

class App extends Component {


  render() {
    return (
      <div>
        <ul class="pages">
          <li class="chat page">
            <div class="chatArea">
              <ul class="messages"></ul>
            </div>
            <input class="inputMessage" placeholder="Type here..." />
          </li>
          <li class="login page">
            <div class="form">
              <h3 class="title">What's your nickname?</h3>
              <input class="usernameInput" type="text" maxlength="14" />
            </div>
          </li>
        </ul>        
      </div>
    );
  }
}

export default App;
