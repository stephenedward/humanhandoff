import React, { Component } from 'react';


class App extends Component {
  callApi() {
    // Github fetch library : https://github.com/github/fetch
    // Call the API page
    // fetch('http://10.100.8.247:8080/hello/?name=Test', {
      fetch('https://voiztrailwebhook.herokuapp.com/getAgent?name=New customer', {
      mode: 'no-cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': ' application/json'
      }
    
    })
      .then((result) => {
        // Get the result
        // If we want text, call result.text()
        console.log(result);
        // return result.text();
      })
    // .then((jsonResult) => {
    //   // Do something with the result
    //   console.log(jsonResult);
    // })
  }
  callPost() {
    // Github fetch library : https://github.com/github/fetch
    // Call the API page
    // fetch('http://10.100.8.247:8080/datapost/', {
      fetch('https://voiztrailwebhook.herokuapp.com/setAgent', {
      mode: 'no-cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': ' application/json'
      },
      method: 'POST',
      body: 'stephen'
    })
      .then((result) => {
        // Get the result
        // If we want text, call result.text()
        console.log(result);
        // return result.text();
      })
    // .then((jsonResult) => {
    //   // Do something with the result
    //   console.log(jsonResult);
    // })
  }


  render() {
    return (
      <div>
        <button onClick={() => this.callPost()}> Post  </button>
        <button onClick={() => this.callApi()}> Get  </button>
      </div>
    );
  }
}

export default App;
