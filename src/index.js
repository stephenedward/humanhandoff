// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require("path");
var io = require('socket.io')(server);
var port = 7000;

var aryAgentSocket = [];
var aryCustomerSocket = [];
var AgentCustomerMappingBool = true;
var CustomerInTakeover = false;

const dialogflow = require('dialogflow');
const uuid = require('uuid');
// const dialog = require('./dialog');

var fs = require('fs');

// // Grab the service account credentials path from an environment variable
// const keyPath = process.env.DF_SERVICE_ACCOUNT_PATH;
// if (!keyPath) {
//     console.log('You need to specify a path to a service account keypair in environment variable DF_SERVICE_ACCOUNT_PATH. See README.md for details.');
//     process.exit(1);
// }

// // Grab the Dialogflow project ID from an environment variable
// const projectId = process.env.DF_PROJECT_ID;
// if (!projectId) {
//     console.log('You need to specify a project ID in the environment variable DF_PROJECT_ID. See README.md for details.');
//     process.exit(1);
// }

// // Load and instantiate the Dialogflow client library
// const { SessionsClient } = require('dialogflow');
// const BotAgent = new SessionsClient({
//     keyFilename: keyPath
// })

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static('public'));

app.get('/index', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});
app.get('/customer', (req, res) => {
    // res.sendFile(path.join(__dirname, '/public', '/customer.html'));
    res.sendFile('customer.html', { root: path.join(__dirname, '../public') });
});

/*C O N T I N U E S -- M O N I T O R I N G -- A G E N T & C U S T O M E R */
function checkAgentCustomerStatus() {
    // console.log('AgentCustomerMapping'+AgentCustomerMappingBool);
    if (AgentCustomerMappingBool) {

        if (aryCustomerSocket.filter((e) => e.takeover !== '').length > 0) {
            // console.log('take over');
            if (aryAgentSocket.filter((e) => e.status === 'idle').length > 0) {
                //Get the customer clientID one by one and assign to one by one Agent
                CustomerInTakeover = true;
                assignAgentCustomer();
            }
        } else {

            if (aryCustomerSocket.filter((e) => e.status === 'idle').length > 0) {
                //Get the clientID and sent to Agent is busy
                if (aryAgentSocket.filter((e) => e.status === 'idle').length > 0) {
                    assignAgentCustomer();
                }
            }
        }
    }
}

assignAgentCustomer = () => {
    AgentCustomerMappingBool = false;
    var AgentIdle = null;
    var CustomerIdle = null;

    if (CustomerInTakeover) {
        CustomerIdle = aryCustomerSocket.filter((e) => e.takeover !== '');
        CustomerInTakeover = false;
    } else {
        CustomerIdle = aryCustomerSocket.filter((e) => e.status === 'idle');
    }

    AgentIdle = aryAgentSocket.filter((e) => e.status === 'idle');

    var Agentfirstelement = AgentIdle[0];
    var Customerfirstelement = CustomerIdle[0];
    console.log('Agent :' + Agentfirstelement.id);
    console.log('Customer :' + Customerfirstelement.id);

    io.sockets.in(Agentfirstelement.id).emit('customerid', {
        customerid: Customerfirstelement.id
    });

    io.sockets.in(Customerfirstelement.id).emit('agentid', {
        agentid: Agentfirstelement.id
    });

    // Update the staus as busy in Agent & Customer socket 
    Agentfirstelement.status = "busy";
    Customerfirstelement.status = "busy";
    Customerfirstelement.takeover = '';

    Agentfirstelement.assign = Customerfirstelement.id;
    Customerfirstelement.assign = Agentfirstelement.id;

    AgentCustomerMappingBool = true;
}

setInterval(checkAgentCustomerStatus, 1000);

//  runSample(data2) {
async function runSample(data2) {

    console.log('Called Bot Agent');
    console.log(data2);
    //projectId
    const projectId = 'dansitu-humanhandoff-accfc';
    // A unique identifier for the given session
    const sessionId = uuid.v4();

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: data2,
                // The language used by the client (en-US)
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    // const responses = await sessionClient.detectIntent(request);
    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');
    // console.log(responses);
    const result = responses[0].queryResult;
    var resultfulfillmentText = '';
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    resultfulfillmentText=result.fulfillmentText;
    // console.log('  Response: '+resultfulfillmentText);
    if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
    } else {
        console.log(`  No intent matched.`);
    }
    return resultfulfillmentText;
}

function detectTextIntent() {
    // [START dialogflow_detect_intent_text]
    // Imports the Dialogflow library
    const dialogflow = require('dialogflow');
    const uuid = require('uuid');
    const queries = 'WELCOME';
    const languageCode = '';


    //projectId
    const projectId = 'dansitu-humanhandoff-accfc';
    // A unique identifier for the given session
    const sessionId = uuid.v4();

    // Instantiates a session client
    const sessionClient = new dialogflow.SessionsClient();

    if (!queries || !queries.length) {
        return;
    }

    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    let promise;

    // Detects the intent of the queries.
    for (const query of queries) {
        // The text query request.
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: query,
                    languageCode: languageCode,
                },
            },
        };

        if (!promise) {
            // First query.
            console.log(`Sending query "${query}"`);
            promise = sessionClient.detectIntent(request);
        } else {
            promise = promise.then(responses => {
                console.log('Detected intent');
                const response = responses[0];
                logQueryResult(sessionClient, response.queryResult);

                // Use output contexts as input contexts for the next query.
                response.queryResult.outputContexts.forEach(context => {
                    // There is a bug in gRPC that the returned google.protobuf.Struct
                    // value contains fields with value of null, which causes error
                    // when encoding it back. Converting to JSON and back to proto
                    // removes those values.
                    context.parameters = structjson.jsonToStructProto(
                        structjson.structProtoToJson(context.parameters)
                    );
                });
                request.queryParams = {
                    contexts: response.queryResult.outputContexts,
                };

                console.log(`Sending query "${query}"`);
                return sessionClient.detectIntent(request);
            });
        }
    }

    promise
        .then(responses => {
            console.log('Detected intent');
            logQueryResult(sessionClient, responses[0].queryResult);
        })
        .catch(err => {
            console.error('ERROR:', err);
        });

    // [END dialogflow_detect_intent_text]
}


//F I L E M A N A G E M E N T
appendJSONFile = (filepath, username, data) => {
    const Mdata = {
        name: username,
        message: data,
        datetime: new Date()
    };
    const JSONdata = JSON.stringify(Mdata, null, 2);
    fs.appendFile(filepath, JSONdata + ',\n', (err) => {
        // fs.appendFile(filepath, ',\n' + username + ' : ' + data, (err) => {

        if (err) throw err;
        console.log('The data was appended to file!');
    });
}

// Chatroom

var numUsers = 0;
var numCustomerUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;
    var addedCustomerUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });


    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (addedUser) return;
        // console.log('User '+addedUser+' Id '+socket.id)
        // we store the username in the socket session for this client
        // console.log(socket.id)
        socket.username = username;
        socket.status = "idle";
        socket.takeover = '';
        ++numUsers;
        addedUser = true;
        aryAgentSocket.push(socket);
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers + "-" + socket.status
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('customertyping', function () {
        socket.broadcast.emit('customertyping', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('customer stop typing', function () {
        socket.broadcast.emit('customer stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });

            // Remove the customer and also set the assign agent status to idle          
            var filterData = socket.assign;

            //check for not assign
            var CustomerTakeover = aryCustomerSocket.filter((e) => e.id === filterData);
            // console.log('Length ' + CustomerTakeover.length);

            if (CustomerTakeover.length > 0) {
                // console.log(CustomerTakeover[0].takeoverhistory + 'takeover check empty ' + ' ' + CustomerTakeover[0].assign);
                if (CustomerTakeover[0].takeover === '') {
                    CustomerTakeover[0].takeover = CustomerTakeover[0].assign;
                    if (CustomerTakeover[0].takeoverhistory === undefined) {
                        CustomerTakeover[0].takeoverhistory = CustomerTakeover[0].assign;
                    } else {
                        CustomerTakeover[0].takeoverhistory = CustomerTakeover[0].takeoverhistory + ' , ' + CustomerTakeover[0].assign;
                    }
                }
                // console.log('takeover' + CustomerTakeover[0].takeover);
                // console.log('takeoverHistory' + CustomerTakeover[0].takeoverhistory);

                CustomerTakeover[0].status = 'idle';
                CustomerTakeover[0].assign = '';

                aryAgentSocket.splice(aryAgentSocket.indexOf(socket), 1)
                // Customer is waiting for the agent take over
            }
        }
    });

    socket.on('agentdata', function (data1, data2) {
        // appendJSONFile(socket.filepath, socket.username, data2);

        // // we pass the data to particular agent
        // io.sockets.in(data1).emit('agentdata', {
        //     data: data2
        // });

        // console.log(runSample(data2));

        var temp = '';
        (async () => {
            temp = (await runSample(data2))
            // console.log(temp);
            // appendJSONFile(socket.filepath, socket.username, data2);
            // // // we pass the data to particular agent
            // io.sockets.in(data1).emit('agentdata', {
            //     data: temp
            // });            
            socket.emit('customerdata', temp);
        })()

        // var retrunresultfulfillmentText=runSample(data2);
        // console.log('Return to pass client');
        // console.log(retrunresultfulfillmentText);

        // var sersocket = io.sockets.in(data1);
        // var resent = sersocket.assign;


        // dialog.runSample(data2);



    });


    /*      C U S T O M E R --- L O G I C --- S T A R T   */

    // when the customer client emits 'add user', this listens and executes
    socket.on('customer add user', function (username) {
        // console.log('customer User '+addedUser+' Id '+socket.id)
        if (addedCustomerUser) return;

        // we store the customr username in the socket session for this client
        var filepath = socket.id + '.json';
        socket.username = username;
        socket.status = "idle";
        socket.takeover = '';
        socket.filepath = filepath;
        ++numCustomerUsers;
        addedCustomerUser = true;
        aryCustomerSocket.push(socket);
        //File create for history
        fs.exists(filepath, (exists) => {
            if (exists) {
            } else {
                fs.writeFile(filepath, '[', (err) => {
                    if (err) throw err;
                    console.log('The file Created!');
                });
            }
        });
        socket.emit('customerlogin', {
            numCustomerUsers: numCustomerUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('customer user joined', {
            username: socket.username,
            numCustomerUsers: numCustomerUsers
        });
    });

    // when the client emits 'customer new message', this listens and executes
    socket.on('customer new message', function (data) {
        // we tell the client to execute 'customer new message'
        socket.broadcast.emit('customer new message', {
            username: socket.username,
            message: data
        });
    });

    // when the customer user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedCustomerUser) {
            --numCustomerUsers;

            // echo globally that this client has left
            socket.broadcast.emit('customer user left', {
                username: socket.username,
                numUsers: numCustomerUsers
            });

            // Remove the customer and also set the assign agent status to idle          
            var filterData = socket.id;
            var AgentBusytoIdle = aryAgentSocket.filter((e) => e.assign === filterData);
            var filepath = socket.filepath;

            // aryAgentSocket.forEach(element => {
            //     console.log(element.id + ' ' + element.username+' '+element.status+' '+element.assign+' '+socket.id);
            // });

            aryCustomerSocket.splice(aryCustomerSocket.indexOf(socket), 1);
            // aryCustomerSocket.forEach(element => {
            //     console.log(element.id + ' ' + element.username)
            // });

            if (AgentBusytoIdle.length > 0) {
                AgentBusytoIdle[0].status = 'idle';
                AgentBusytoIdle[0].assign = '';
            }

            fs.exists(filepath, (exists) => {
                if (exists) {
                    fs.appendFile(filepath, '{}\n]', (err) => {
                        if (err) throw err;
                        console.log('The file closed!');
                    });
                } else {
                }
            });
        }
    });

    socket.on('customerdata', function (data1, data2) {
        var customer = aryCustomerSocket.filter((e) => e.id === data1);
        if (customer.length > 0) {
            appendJSONFile(customer[0].filepath, socket.username, data2);
        }
        io.sockets.in(data1).emit('customerdata', {
            data: data2
        });
    });    
});