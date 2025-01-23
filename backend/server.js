require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
// const Imap = require('imap-simple');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const MessagingResponse = require('twilio').twiml.VoiceResponse;
const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;
const app = express();

// Middleware Configuration
// app.use(
//     cors({
//         origin: process.env.FRONTEND_URL || 'http://localhost:5173' || 'http://localhost:4173', // Frontend URL
//         methods: ['GET', 'POST', 'PUT', 'DELETE'],
//         allowedHeaders: ['Content-Type','ngrok-skip-browser-warning'],
//     })
// );
// app.use(
//     cors({
//         origin: function (origin, callback) {
//             // Allow requests with no origin (like mobile apps or curl requests)
//             if (!origin) return callback(null, true);
            
//             const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'];
//             if (allowedOrigins.indexOf(origin) !== -1) {
//                 callback(null, true);
//             } else {
//                 callback(new Error('Not allowed by CORS'));
//             }
//         },
//         methods: ['GET', 'POST', 'PUT', 'DELETE'],
//         allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning','Authorization',],
//         // allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning',],
//     })
// );
app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
  });
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            const allowedOrigins = [
                process.env.FRONTEND_URL, 
                'http://localhost:5173', 
                'http://localhost:4173', 
                'https://sample-omnichannel-app.netlify.app',
                'https://fdc3-202-137-119-154.ngrok-free.app'
            ];
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning', 'Authorization'],
        credentials: true
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });
const io = require('socket.io')(server);

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);
const response = new MessagingResponse();
const incomingClients = {
    // Format: { [username]: incomingClientIdentity }
    client: 'null' // Default fallback
};
// Notify the frontend when an incoming call is received
app.post('/token', (req, res) => {
    // const identity = req.body.username; // User identity for token
    // const voiceGrant = new VoiceGrant({
    //     outgoingApplicationSid: process.env.TWILIO_TWIML_APPLICATION_SID,
    //     incomingAllow: true,
    // });
    const { username, purpose } = req.body; // Add purpose parameter
    // const identity = `${username}_${purpose}`; // Unique identity per purpose
    const identity = `${username}_${purpose}`
    if (purpose === 'incoming') {
        incomingClients['client'] = identity;
        console.log('Registered incoming client:', incomingClients.client);
    }
    
    
    console.log("Identity:"+identity);
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: purpose === 'outgoing' 
            ? 'AP1a0a12a820ed87a81b4cb80f09db80ab'
            : 'APcfebb7ee00d7184b49a4f7b6f89da43d',
        incomingAllow: purpose === 'incoming'
    });
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        { identity }
    );

    token.addGrant(voiceGrant);
    res.json({ token: token.toJwt() });
});

// app.post('/incoming-call', (req, res) => {
//     console.log('Incoming call request body:', req.body); // Log the request body
//     console.log('Twilio Webhook Request Headers:', req.headers);
//     // console.log('Twilio Webhook Request Body:', req.body);
//     // const { from, to } = req.body;
//     // const from = req.body.From || 'Unknown'; // Default to 'Unknown' if missing
//     const from = twilioPhoneNumber; // Default to 'Unknown' if missing
//     const to = req.body.To || twilioPhoneNumber;
//     const VoiceResponse = twilio.twiml.VoiceResponse;
//     const response = new VoiceResponse();
//     const dial = response.dial();
//         // const dial = response.dial({ callerId: req.body.From, answerOnBridge: true });
//     dial.client('sample'); // Replace 'client-name' with the actual client identifier
//     // if (!from || !to) {
//     //     console.error('Invalid request data:', req.body);
//     //     return res.status(400).json({ success: false, message: 'Missing "from" or "to" in the request body.' });
//     // }
//     // console.log(`Emitting  ${from}`);
//     // wss.clients.forEach((client, index) => {
//     //     console.log(`Client #${index} - WebSocket Ready State: ${client.readyState}`);

//     //     if (client.readyState === WebSocket.OPEN) {
//     //         const message = {
//     //             type: 'call',
//     //             action: 'incoming',
//     //             from,
//     //         };

//     //         console.log(`Sending message to client #${index}: ${JSON.stringify(message)}`);

//     //         client.send(JSON.stringify(message)); // Notify the client
//     //     } else {
//     //         console.warn(`Client #${index} is not open. Ready state: ${client.readyState}`);
//     //     }
//     // });

//     // console.log(`Notified user ${to} of incoming call from ${from}`);
//     // response.say("Please wait while we connect your call.");
//     // response.pause({ length: 5 }); // Add a delay to simulate "ringing"

//     // Set the Content-Type to text/xml and send the response
//     res.set('Content-Type', 'text/xml');
//     res.status(200).send(response.toString());
// });
app.post('/incoming-call', (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    const dial = twiml.dial();
    console.log('res:', res)
    // dial.client('yeah_incoming'); // Match 'sample' to the client identity
    dial.client(incomingClients.client)
    console.log('TwiML Response:', twiml.toString())
    res.type('text/xml');
    res.send(twiml.toString());
  });
app.post('/outgoing-call', (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    const dial = response.dial({ callerId: twilioPhoneNumber });
    console.log('Incoming call request body:', req.body);
    dial.number(req.body.To);
    res.type('text/xml');
    res.send(response.toString());
});
// app.post('/incoming-call', (req, res) => {
//     const VoiceResponse = twilio.twiml.VoiceResponse;
//     const response = new VoiceResponse();
//     console.log('Incoming call request body:', req.body); // Log the request body
//     console.log('Twilio Webhook Request Headers:', req.headers);
//     // Create a <Dial> node
//     // const dial = response.dial();

//     // Add <Client> inside <Dial>
//     try {
//         const dial = response.dial({ callerId: req.body.From, answerOnBridge: true });
//         dial.client('sample'); // Replace 'client-name' with the actual client identifier
//         console.log('Dialing client:', 'sample');
//     } catch (err) {
//         console.error('Error adding client to Dial:', err.message);
//         res.status(500).send('Internal Server Error');
//         return;
//     }

//     // Respond with the TwiML
//     res.set('Content-Type', 'text/xml');
//     res.send(response.toString());
// });
// Sample endpoint to return a call response (you can adjust as needed)
// app.post('/voice-response', (req, res) => {
//     const VoiceResponse = new twilio.twiml.VoiceResponse();
//     VoiceResponse.say('Please answer the call.');

//     res.type('text/xml');
//     res.send(VoiceResponse.toString());
// });
// SMS Sending Endpoint
app.post('/send-sms', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ success: false, message: 'Both "to" number and message are required.' });
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: to
        });

        console.log('SMS sent successfully:', result.sid);
        res.json({ success: true, messageSid: result.sid, message: 'SMS sent successfully.' });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ success: false, message: 'Failed to send SMS.', error: error.message });
    }
});
app.post('/incoming-sms', (req, res) => {
    const MessagingResponse = twilio.twiml.MessagingResponse;
    const twiml = new MessagingResponse();
    console.log('Incoming SMS:', req.body);

    // Extract the incoming message details
    const from = req.body.From;
    const body = req.body.Body;

    // Log the incoming message
    console.log(`Received message from ${from}: ${body}`);

    // You can add custom logic here to process the incoming message
    // For example, you could store it in a database, trigger notifications, etc.

    // Send a response back to the sender
    twiml.message('Thank you for your message. We have received it and will process it shortly.');

    // Broadcast the incoming message to all connected WebSocket clients
    broadcast({
        type: 'incomingSMS',
        from: from,
        message: body
    });

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});

app.post('/call', async (req, res) => {
    const { to } = req.body; // The number to call

    if (!to) {
        return res.status(400).json({ success: false, message: 'The "to" phone number is required.' });
    }

    try {
        // Initiate the call
        const call = await client.calls.create({
            to, // The number to call
            from: twilioPhoneNumber, // Your Twilio phone number
            // No TwiML URL specified for direct connection
            url: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient',
        });

        console.log('Call initiated:', call.sid);
        res.json({ success: true, callSid: call.sid, message: 'Call initiated successfully.' });
    } catch (error) {
        console.error('Error making the call:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate call.', error });
    }
});

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    logger: true, // Enable logging
    debug: true,  // Show debug output
});


const imapConfig = {
    user: process.env.EMAIL_USER, // Email address from .env
    password: process.env.EMAIL_PASS, // Password or app-specific password from .env
    host: 'imap.gmail.com', // IMAP server for Gmail
    port: 993, // Secure IMAP port
    tls: true, // Use TLS for secure connection
    tlsOptions: {
        rejectUnauthorized: false, // Allow self-signed certificates
    },
};
// Directory for uploaded files
const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// WebSocket server logic
let users = {}; // Store connected users

wss.on('connection', (ws) => {
    console.log('Client connected.');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'login') {
            ws.username = data.username;
            users[data.username] = ws;

            broadcast({
                type: 'notification',
                message: `${data.username} joined the chat.`,
            });
            sendUserList();
        } else if (data.type === 'message') {
            broadcast({
                type: 'message',
                username: ws.username,
                message: data.message,
            });
        } else if (data.type === 'image' || data.type === 'others') {
            broadcast({
                type: data.type,
                username: ws.username,
                filePath: data.filePath,
                fileName: data.fileName,
            });
        } else if (data.type === 'call') {
            handleCallRequest(ws, data);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
        if (ws.username) {
            delete users[ws.username];
            broadcast({
                type: 'notification',
                message: `${ws.username} left the chat.`,
            });
            sendUserList();
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleCallRequest(ws, data) {
    const { action, to, from } = data;

    if (action === 'incoming') {
        // Notify the recipient about the incoming call
        console.log(`Incoming call from ${from} to ${to}`);
        const recipientWs = users[to];
        if (recipientWs) {
            recipientWs.send(JSON.stringify({
                type: 'call',
                action: 'incoming',
                from: from,
            }));
        }
    } else if (action === 'accept') {
        console.log(`${ws.username} accepted the call from ${from}`);
        // const callerWs = users[from];
        // if (callerWs) {
        //     // Notify the caller that the call has been accepted
            // ws.send(JSON.stringify({
            //     type: 'call',
            //     action: 'accepted',
            //     from: ws.username,
            // }));
            try {
                const twilio = require('twilio');
                const client = twilio(accountSid, authToken);
    
                client.calls.create({
                    twiml: `<Response><Say>Connecting your call.</Say><Dial>${twilioPhoneNumber}</Dial></Response>`,
                    to: twilioPhoneNumber, // Recipient's phone number
                    from: twilioPhoneNumber, // Twilio number used as the caller ID
                }).then((call) => {
                    console.log(`Twilio call initiated successfully: ${call.sid}`);
                }).catch((error) => {
                    console.error('Error initiating call with Twilio:', error.message);
                    ws.send(JSON.stringify({
                        type: 'call',
                        action: 'error',
                        message: 'Failed to initiate call with Twilio.',
                    }));
                });
            } catch (error) {
                console.error('Twilio integration error:', error.message);
            }
            // Notify both parties to start media communication
            const mediaSetupMessage = JSON.stringify({
                type: 'call',
                action: 'accepted',
                participants: {
                    caller: from,
                    recipient: twilioPhoneNumber,
                },
            });

            // Send media setup message to both caller and recipient
            ws.send(mediaSetupMessage); // To the recipient
            // callerWs.send(mediaSetupMessage); // To the caller

            // Optional: Broadcast or log the active call status
            console.log(`Media setup initiated between ${from} (caller) and ${ws.username} (recipient)`);

            // Optional: Start a call timer or other backend logic
            // startCallTimer(from, ws.username);
        // } else {
        //     // Caller WebSocket not found (e.g., caller disconnected)
        //     console.error(`Caller WebSocket not found for ${from}`);
        //     ws.send(JSON.stringify({
        //         type: 'call',
        //         action: 'error',
        //         message: 'Caller is unavailable',
        //     }));
        // }
    } else if (action === 'reject') {
        // Call is rejected by the recipient
        console.log(`${ws.username} rejected the call from ${from}`);
        const callerWs = users[from];
        if (callerWs) {
            callerWs.send(JSON.stringify({
                type: 'call',
                action: 'rejected',
                from: ws.username,
            }));
        }
    }
}
// File Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const filePath = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    // const filePath = `http://fdc3-202-137-119-154.ngrok-free.app/uploads/${encodeURIComponent(req.file.filename)}`;
    console.log('File uploaded, path:', filePath); 
    res.json({ success: true, path: filePath });
});

// Send Email with Attachments
app.post('/send-email', upload.array('attachments', 5), async (req, res) => {
    const { to, subject, content } = req.body;

    // Debugging: Log the request body and uploaded files
    console.log('Request Body:', req.body);
    console.log('Uploaded Files:', req.files);

    // Validate required fields
    if (!to || !subject || !content) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        // Map uploaded files to attachments
        const attachments = req.files.map((file) => ({
            filename: file.originalname,
            path: file.path,
        }));

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: content,
            attachments,
        });

        res.json({ success: true, message: 'Email sent successfully with attachments!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send email.' });
    }
});

// Fetch Emails Endpoint
app.get('/fetch-emails', (req, res) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.error('Error opening inbox:', err);
                return res.status(500).json({ success: false, message: 'Failed to open inbox.' });
            }

            const searchCriteria = ['ALL'];
            const fetchOptions = { 
                bodies: '',
                struct: true,
                // Add this line to sort emails by date in descending order
                sort: [['DATE', 'DESC']]
            };

            imap.search(searchCriteria, (err, results) => {
                if (err) {
                    console.error('Error searching emails:', err);
                    return res.status(500).json({ success: false, message: 'Failed to search emails.' });
                }

                if (!results.length) {
                    return res.json({ success: true, emails: [] });
                }

                const f = imap.fetch(results.slice(0, 50), fetchOptions);
                const emails = [];

                f.on('message', (msg, seqno) => {
                    console.log(`Processing email #${seqno}`);
                    let email = { from: 'Unknown sender', subject: 'No subject', date: 'No date', content: 'No content', attachments: [] };
                    let parsingDone = false;
                    let parsingPromise = new Promise((resolve) => {
                        msg.on('body', (stream) => {
                            simpleParser(stream, { skipHtmlToText: true }, (err, parsed) => {
                                if (err) {
                                    console.error(`Error parsing email #${seqno}:`, err);
                                    return resolve();
                                }

                                // Handle email fields with defaults
                                email.from = parsed.from?.text || 'Unknown sender';
                                email.subject = parsed.subject || 'No subject';
                                
                                try {
                                    email.date = parsed.date ? new Date(parsed.date).toISOString() : 'No date';
                                } catch (e) {
                                    console.error(`Invalid date in email #${seqno}:`, parsed.date);
                                    email.date = 'Invalid date';
                                }

                                email.content = parsed.text || parsed.html || 'No content';

                                // Process attachments
                                email.attachments = (parsed.attachments || []).map((attachment) => ({
                                    filename: attachment.filename || 'unnamed-file',
                                    contentType: attachment.contentType || 'application/octet-stream',
                                    size: attachment.size,
                                    content: attachment.content.toString('base64'),
                                }));

                                parsingDone = true;
                                resolve();
                            });
                        });
                    });

                    msg.once('end', async () => {
                        console.log(`Finished fetching email #${seqno}`);
                        await parsingPromise;
                        if (parsingDone) {
                            emails.push(email);
                            console.log(`Completed processing email #${seqno}`);
                        }
                    });
                });

                f.once('error', (err) => {
                    console.error('Error fetching emails:', err);
                    res.status(500).json({ success: false, message: 'Failed to fetch emails.' });
                });

                f.once('end', () => {
                    console.log('All emails fetched successfully.');
                    imap.end();
                    res.json({ success: true, emails });
                });
            });
        });
    });

    imap.once('error', (err) => {
        console.error('IMAP Connection Error:', err);
        res.status(500).json({ success: false, message: 'Failed to connect to IMAP server.' });
    });

    imap.once('end', () => {
        console.log('IMAP Connection closed.');
    });

    imap.connect();
});
// app.get('/fetch-emails', (req, res) => {
//     const imap = new Imap(imapConfig);

//     imap.once('ready', () => {
//         imap.openBox('INBOX', true, (err, box) => {
//             if (err) {
//                 console.error('Error opening inbox:', err);
//                 return res.status(500).json({ success: false, message: 'Failed to open inbox.' });
//             }

//             const searchCriteria = ['ALL'];
//             const fetchOptions = { bodies: '', struct: true }; // Empty 'bodies' fetches the structure

//             imap.search(searchCriteria, (err, results) => {
//                 if (err) {
//                     console.error('Error searching emails:', err);
//                     return res.status(500).json({ success: false, message: 'Failed to search emails.' });
//                 }

//                 if (!results.length) {
//                     return res.json({ success: true, emails: [] });
//                 }

//                 const f = imap.fetch(results, fetchOptions);
//                 const emails = [];

//                 f.on('message', (msg, seqno) => {
//                     console.log(`Processing email #${seqno}`);
//                     let email = { from: '', subject: '', date: '', content: '', attachments: [] };

//                     msg.on('body', (stream, info) => {
//                         simpleParser(stream, { skipHtmlToText: true }, (err, parsed) => {
//                             if (err) {
//                                 console.error(`Error parsing email #${seqno}:`, err);
//                                 return;
//                             }

//                             // Extract email details
//                             email.from = parsed.from?.text || 'Unknown sender';
//                             email.subject = parsed.subject || 'No subject';
//                             email.date = parsed.date ? new Date(parsed.date).toISOString() : 'No date';
//                             email.content = parsed.text || parsed.html || 'No content';

//                             // Extract attachments
//                             if (parsed.attachments?.length) {
//                                 email.attachments = parsed.attachments.map((attachment) => ({
//                                     filename: attachment.filename,
//                                     contentType: attachment.contentType,
//                                     size: attachment.size,
//                                     content: attachment.content.toString('base64'), // Encode binary data
//                                 }));
//                             }
//                         });
//                     });

//                     msg.once('end', () => {
//                         emails.push(email);
//                         console.log(`Finished processing email #${seqno}`);
//                     });
//                 });

//                 f.once('error', (err) => {
//                     console.error('Error fetching emails:', err);
//                     res.status(500).json({ success: false, message: 'Failed to fetch emails.' });
//                 });

//                 f.once('end', () => {
//                     console.log('All emails fetched successfully.');
//                     imap.end();
//                     res.json({ success: true, emails });
//                 });
//             });
//         });
//     });

//     imap.once('error', (err) => {
//         console.error('IMAP Connection Error:', err);
//         res.status(500).json({ success: false, message: 'Failed to connect to IMAP server.' });
//     });

//     imap.once('end', () => {
//         console.log('IMAP Connection closed.');
//     });

//     imap.connect();
// });




// Helper Functions
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function sendUserList() {
    const userList = Object.keys(users);
    broadcast({ type: 'userList', users: userList });
}

// Start the Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

