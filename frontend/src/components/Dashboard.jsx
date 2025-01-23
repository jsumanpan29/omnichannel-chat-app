import React, { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';

const Dashboard = ({ username }) => {
    const [activeTab, setActiveTab] = useState('chat');  // Default active tab is 'chat'
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [file, setFile] = useState(null);
    const ws = useRef(null);
    const [emailInbox, setEmailInbox] = useState([]); // Email inbox state
    const [emailRecipient, setEmailRecipient] = useState(''); // Email recipient
    const [emailContent, setEmailContent] = useState(''); // Email compose content
    const [emailSubject, setEmailSubject] = useState(''); // Email subject
    const [loadingEmails, setLoadingEmails] = useState(false); // Loading indicator for emails
    const [emailAttachment, setEmailAttachment] = useState(null); // For email attachments
    const [phoneNumber, setPhoneNumber] = useState(''); // State to hold the entered phone number
    const [phoneNumberValid, setPhoneNumberValid] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null); // Incoming call state
    // const [callAccepted, setCallAccepted] = useState(false); // Call acceptance state
    // const [callDuration, setCallDuration] = useState('00:00'); // Call duration in "mm:ss"
    // const [callTimer, setCallTimer] = useState(null); // Timer ID
    const [countryCode, setCountryCode] = useState('+1'); // '+1' or '+63'
    // const [device, setDevice] = useState(null);
    // const [isReady, setIsReady] = useState(false);
    const [incomingDevice, setIncomingDevice] = useState(null);
    const [outgoingDevice, setOutgoingDevice] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const callParams = useRef(null); // To hold call parameters, if needed
    const [callStatus, setCallStatus] = useState('');
    const [recipientNumber, setRecipientNumber] = useState('');
    const [smsContent, setSmsContent] = useState('');
    const [messageHistory, setMessageHistory] = useState([]);
    const [smsStatus, setSmsStatus] = useState('');
    const [ongoingCall, setOngoingCall] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [callTimer, setCallTimer] = useState(null);
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    const handleIncomingSMS = (data) => {
        setMessageHistory(prev => [
            ...prev, 
            { 
                type: 'SMS', 
                recipient: 'You', 
                sender: data.from, 
                content: data.message 
            }
        ]);
    };

    // const handleDial = () => {
    //     if (phoneNumber.trim() === '') {
    //         alert('Please enter a phone number to dial.');
    //         return;
    //     }
    //     console.log(`Dialing: ${phoneNumber}`);
    //     // Trigger the dial functionality (e.g., API call to start the call)
    // };
    // const handleDial = async () => {
    //     if (!phoneNumberValid) {
    //         alert(`Please enter a valid ${countryCode === '+1' ? 'US' : 'Philippines'} phone number`);
    //         return;
    //     }
    
    //     const fullNumber = countryCode + phoneNumber;
    
    
    //     try {
    //         const response = await fetch('https://fdc3-202-137-119-154.ngrok-free.app/call', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'ngrok-skip-browser-warning': 'true'
    //             },
    //             body: JSON.stringify({
    //                 to: fullNumber
    //             })
    //         });
    
    //         const data = await response.json();
            
    //         if (data.success) {
    //             setCallStatus(`Calling ${formatPhoneNumber(phoneNumber)}...`);
    //             console.log('Call initiated:', data.callSid);
    //         } else {
    //             setCallStatus('Failed to initiate call: ' + data.message);
    //         }
    //     } catch (error) {
    //         console.error('Error initiating call:', error);
    //         setCallStatus('Error connecting to call service');
    //     }
    // };
    const handleDial = async () => {
        if (!phoneNumberValid || !outgoingDevice) {
            alert('Device not ready or invalid number');
            return;
        }

        const fullNumber = countryCode + phoneNumber;
        
        try {
            setCallStatus('Dialing...');
            
            const call = await outgoingDevice.connect({
                params: { To: fullNumber }
            });

            call.on('accept', () => {
                setOngoingCall(call);
                setCallStatus('Call connected');
                // Start timer
                const startTime = Date.now();
                const timer = setInterval(() => {
                    setCallDuration(Math.floor((Date.now() - startTime) / 1000));
                }, 1000);
                setCallTimer(timer);
            });

            call.on('disconnect', () => {
                setOngoingCall(null);
                clearInterval(callTimer);
                setCallTimer(null);
                setCallDuration(0);
                setCallStatus('Call ended');
            });

            call.on('error', (error) => {
                console.error('Call error:', error);
                setCallStatus(`Call failed: ${error.message}`);
                setOngoingCall(null);
            });

        } catch (error) {
            console.error('Call initiation failed:', error);
            setCallStatus(`Error: ${error.message}`);
        }
    };
    // const handleDial = async () => {
    //     if (!phoneNumberValid) {
    //         alert(`Please enter a valid ${countryCode === '+1' ? 'US' : 'Philippines'} phone number`);
    //         return;
    //     }
    
    //     const fullNumber = countryCode + phoneNumber;
    //     console.log('Fullnumber',fullNumber)
    //     try {
    //         if (!device) {
    //             throw new Error('Twilio device not initialized');
    //         }
    
    //         setCallStatus('Dialing...');
            
    //         // Initiate the call using Twilio Device
    //         const call = await device.connect({
    //             params: {
    //                 To: fullNumber,
    //                 // From: twilioPhoneNumber // Your Twilio number
    //                 // From:'+13613264841'
    //             }
    //         });
    
    //         // Set up call handlers
    //         call.on('accept', () => {
    //             setOngoingCall(call);
    //             setCallStatus('Call connected');
    //             // Start call timer
    //             const startTime = Date.now();
    //             const timer = setInterval(() => {
    //                 const seconds = Math.floor((Date.now() - startTime) / 1000);
    //                 setCallDuration(seconds);
    //             }, 1000);
    //             setCallTimer(timer);
    //         });
    
    //         call.on('disconnect', () => {
    //             setCallStatus('Call ended');
    //             setOngoingCall(null);
    //             clearInterval(callTimer);
    //             setCallTimer(null);
    //             setCallDuration(0);
    //         });
    
    //         call.on('error', (error) => {
    //             console.error('Call error:', error);
    //             setCallStatus(`Call failed: ${error.message}`);
    //             setOngoingCall(null);
    //         });
    
    //     } catch (error) {
    //         console.error('Error initiating call:', error);
    //         setCallStatus(`Error: ${error.message}`);
    //     }
    // };
    // Format phone number display
    const formatPhoneNumber = (number) => {
        if (countryCode === '+1') {
            return number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        if (countryCode === '+63') {
            return number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3'); // PH format: 9123 456 789
        }
        return number;
    };
    

    // Handle number input with validation
    const handleNumberInput = (value) => {
        // Remove non-digit characters
        const formattedNumber = value.replace(/\D/g, '');
        setRecipientNumber(formattedNumber);
    };

    // Get keypad letters (like traditional phone keypads)
    const getKeypadLetters = (num) => {
        const letterMap = {
            '2': 'ABC',
            '3': 'DEF',
            '4': 'GHI',
            '5': 'JKL',
            '6': 'MNO',
            '7': 'PQRS',
            '8': 'TUV',
            '9': 'WXYZ'
        };
        return letterMap[num] || '';
    };
    // const handleEndCall = () => {
    //     console.log('Ending call');
    //     setCallAccepted(false);
    //     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    //         ws.current.send(JSON.stringify({ type: 'call', action: 'end' }));
    //     }
    //     setCallAccepted(false); // Reset call state
    //     setCallDuration('00:00'); // Reset call duration
    //     clearInterval(callTimer); // Clear the timer
    //     setCallTimer(null);
    // };
    const sendSms = async () => {
        if (!recipientNumber || !smsContent) {
            alert('Please enter both recipient number and message.');
            return;
        }
    
        try {
            const response = await fetch('https://fdc3-202-137-119-154.ngrok-free.app/send-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    to: recipientNumber,
                    message: smsContent
                })
            });
    
            const data = await response.json();
    
            if (data.success) {
                // setMessageHistory(prev => [...prev, { type: 'SMS', recipient: recipientNumber, content: smsContent }]);
                setRecipientNumber('');
                setSmsContent('');
                setSmsStatus('SMS sent successfully!');
            } else {
                setSmsStatus('Failed to send SMS: ' + data.message);
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
            setSmsStatus('An error occurred while sending the SMS.');
        }
    };

    // const handleEndCall = () => {
    //     if (ongoingCall) {
    //         console.log('Ending call with', ongoingCall.parameters.From);
            
    //         try {
    //             // Properly disconnect using Twilio SDK
    //             ongoingCall.disconnect();
    
    //             // Send WebSocket notification
    //             if (ws.current?.readyState === WebSocket.OPEN) {
    //                 ws.current.send(JSON.stringify({ 
    //                     type: 'call', 
    //                     action: 'end', 
    //                     from: ongoingCall.parameters.From,
    //                     duration: callDuration,
    //                     timestamp: new Date().toISOString()
    //                 }));
    //             }
    
    //             // Clean up call states
    //             setOngoingCall(null);
    //             clearInterval(callTimer);
    //             setCallTimer(null);
    //             setCallDuration(0);
    //             setCallStatus('Call ended');
    
    //         } catch (error) {
    //             console.error('Error ending call:', error);
    //             setCallStatus('Error ending call');
    //         }
    //     }
    // };
    const handleEndCall = () => {
        if (ongoingCall) {
            try {
                ongoingCall.disconnect();
                setCallStatus('Call ended');
            } catch (error) {
                console.error('Error ending call:', error);
                setCallStatus('Error ending call');
            }
        }
    };
    // const handleAcceptCall = () => {
    //     console.log('Accepting call from',incomingCall.from );
    //     setCallAccepted(true);
    //     setIncomingCall(null); // Hide incoming call modal
    //     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    //         ws.current.send(JSON.stringify({ type: 'call', action: 'accept', from: incomingCall.from }));
    //     }

    //     // Start the call duration timer
    //     let seconds = 0;
    //     const timer = setInterval(() => {
    //         seconds += 1;
    //         const minutes = Math.floor(seconds / 60);
    //         const remainingSeconds = seconds % 60;
    //         setCallDuration(
    //             `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    //         );
    //     }, 1000);

    //     setCallTimer(timer);
    // };
    const handleAcceptCall = () => {
        if (incomingCall) {
            // Accept the call and connect audio
            incomingCall.accept();
            
            // Optional: Add audio constraints
            const constraints = { 
                audio: true,
                video: false 
            };
            
            // Get user media and connect to call
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    // Connect the audio stream to the call
                    const audioTrack = stream.getAudioTracks()[0];
                    incomingCall.audioTrack = audioTrack;
                })
                .catch(error => {
                    console.error('Error accessing media devices:', error);
                });
        }
    };
    // const handleRejectCall = () => {
    //     console.log('Rejecting call');
    //     setIncomingCall(null);
    //     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    //         ws.current.send(JSON.stringify({ type: 'call', action: 'reject', from: incomingCall.from }));
    //     }
    // };
    const handleRejectCall = () => {
        if (incomingCall) {
            console.log('Rejecting call from', incomingCall.parameters.From);
            
            try {
                // Reject the call using Twilio SDK
                incomingCall.reject();
                
                // Send WebSocket notification (optional)
                if (ws.current?.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ 
                        type: 'call', 
                        action: 'reject', 
                        from: incomingCall.parameters.From,
                        timestamp: new Date().toISOString()
                    }));
                }
    
                // Clear call states
                setIncomingCall(null);
                setCallStatus('Call rejected');
    
            } catch (error) {
                console.error('Error rejecting call:', error);
                setCallStatus('Error rejecting call');
            }
        }
    };
    const handleKeypadPress = (key) => {
        if (phoneNumber.length < 15) { // Reasonable max length
            setPhoneNumber((prev) => prev + key);
        }
    };
    
    // useEffect(() => {
    //     // Set up WebSocket connection
    //     const ws = new WebSocket('wss://9776-202-137-119-157.ngrok-free.app');

    //     ws.onmessage = (event) => {
    //         const data = JSON.parse(event.data);
    //         if (data.type === 'incomingSMS') {
    //             handleIncomingSMS(data);
    //         }
    //     };

    //     return () => {
    //         ws.close();
    //     };
    // }, []);
    // useEffect(() => {
    //     let twilioDevice;
        
    //     const setupDevice = async () => {
    //         try {
    //             const response = await fetch('https://fdc3-202-137-119-154.ngrok-free.app/token', {
    //                 method: 'POST',
    //                 headers: { 
    //                     'Content-Type': 'application/json',
    //                     'ngrok-skip-browser-warning': 'true'
    //                 },
    //                 body: JSON.stringify({ username: 'sample' })
    //             });
                
    //             const data = await response.json();
    //             if (!data.token) throw new Error('No token received');

    //             twilioDevice = new Device(data.token, {
    //                 debug: true,
    //                 codecPreferences: ['opus', 'pcmu'],
    //                 enableIceRestart: true,
    //                 app: {
    //                     applicationSid: 'AP1a0a12a820ed87a81b4cb80f09db80ab'
    //                 }
    //             });

    //             // Event listeners
    //             twilioDevice.on('registered', () => {
    //                 console.log('Device registered');
    //                 setIsReady(true);
    //                 setCallStatus('Ready to receive calls');
    //             });

    //             twilioDevice.on('unregistered', () => {
    //                 console.log('Device unregistered');
    //                 setIsReady(false);
    //                 setCallStatus('Offline');
    //             });

    //             twilioDevice.on('incoming', (call) => {
    //                 console.log('Incoming call:', call);
    //                 setIncomingCall(call);
    //                 setCallStatus('Incoming call...');

    //                 // call.on('accept', () => {
    //                 //     setCallStatus('Call in progress');
    //                 //     setIncomingCall(null);
    //                 // });

    //                 // call.on('disconnect', () => {
    //                 //     setCallStatus('Call ended');
    //                 //     setIncomingCall(null);
    //                 // });
                    
    //                 // Set up call acceptance handler
    //                 call.on('accept', (acceptedCall) => {
    //                     console.log('Call accepted');
    //                     setCallStatus('Call in progress');
    //                     setIncomingCall(null);
    //                     setOngoingCall(acceptedCall); // Store the active call reference
                        
    //                     // Start call timer
    //                     const startTime = Date.now();
    //                     const timer = setInterval(() => {
    //                         const seconds = Math.floor((Date.now() - startTime) / 1000);
    //                         setCallDuration(seconds);
    //                     }, 1000);
    //                     setCallTimer(timer);
    //                 });

    //                 // Set up call disconnect handler
    //                 call.on('disconnect', () => {
    //                     console.log('Call disconnected');
    //                     setCallStatus('Call ended');
    //                     setIncomingCall(null);
    //                     setOngoingCall(null);
    //                     clearInterval(callTimer);
    //                     setCallTimer(null);
    //                     setCallDuration(0);
    //                 });

    //                 // Handle call rejection
    //                 call.on('reject', () => {
    //                     console.log('Call rejected');
    //                     setIncomingCall(null);
    //                     setCallStatus('Call rejected');
    //                 });
    //             });

    //             twilioDevice.on('error', (error) => {
    //                 console.error('Device error:', error);
    //                 setCallStatus(`Error: ${error.message}`);
    //             });

    //             // Register the device
    //             await twilioDevice.register();
    //             setDevice(twilioDevice);

    //         } catch (error) {
    //             console.error('Device setup failed:', error);
    //             setCallStatus(`Connection error: ${error.message}`);
    //         }
    //     };

    //     setupDevice();

    //     return () => {
    //         if (twilioDevice) {
    //             twilioDevice.destroy();
    //             console.log('Device cleaned up');
    //         }
    //     };
    // }, [username]);
    useEffect(() => {
        let incomingDeviceInstance;
        let outgoingDeviceInstance;

        const setupDevices = async () => {
            try {
                // Setup incoming call device
                const incomingTokenRes = await fetch('https://fdc3-202-137-119-154.ngrok-free.app/token', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ 
                        username,
                        purpose: 'incoming'
                    })
                });
                
                const incomingTokenData = await incomingTokenRes.json();
                console.log('incoming_token:',JSON.stringify(incomingTokenData))
                
                incomingDeviceInstance = new Device(incomingTokenData.token, {
                    debug: true,
                    codecPreferences: ['opus', 'pcmu'],
                    enableIceRestart: true,
                    // app: {
                    //     applicationSid: 'APcfebb7ee00d7184b49a4f7b6f89da43d'
                    // }
                });

                // Setup outgoing call device
                const outgoingTokenRes = await fetch('https://fdc3-202-137-119-154.ngrok-free.app/token', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ 
                        username,
                        purpose: 'outgoing'
                    })
                });

                const outgoingTokenData = await outgoingTokenRes.json();
                
                outgoingDeviceInstance = new Device(outgoingTokenData.token, {
                    debug: true,
                    codecPreferences: ['opus', 'pcmu'],
                    enableIceRestart: true,
                    app: {
                        applicationSid: 'AP1a0a12a820ed87a81b4cb80f09db80ab'
                    }
                });

                // Configure incoming device listeners
                incomingDeviceInstance.on('registered', () => {
                    console.log('Incoming device ready');
                    setIsReady(true);
                });

                incomingDeviceInstance.on('incoming', (call) => {
                    console.log('Incoming call:', call);
                    setIncomingCall(call);
                    setCallStatus('Incoming call...');

                    call.on('accept', (acceptedCall) => {
                        setOngoingCall(acceptedCall);
                        setCallStatus('Call in progress');
                        // Start timer
                        const startTime = Date.now();
                        const timer = setInterval(() => {
                            setCallDuration(Math.floor((Date.now() - startTime) / 1000));
                        }, 1000);
                        setCallTimer(timer);
                    });

                    call.on('disconnect', () => {
                        setIncomingCall(null);
                        setOngoingCall(null);
                        clearInterval(callTimer);
                        setCallTimer(null);
                        setCallDuration(0);
                        setCallStatus('Call ended');
                    });
                });

                // Configure outgoing device listeners
                outgoingDeviceInstance.on('registered', () => {
                    console.log('Outgoing device ready');
                });

                outgoingDeviceInstance.on('error', (error) => {
                    console.error('Outgoing device error:', error);
                    setCallStatus(`Error: ${error.message}`);
                });

                // Register both devices
                await incomingDeviceInstance.register();
                await outgoingDeviceInstance.register();
                
                setIncomingDevice(incomingDeviceInstance);
                setOutgoingDevice(outgoingDeviceInstance);

            } catch (error) {
                console.error('Device setup failed:', error);
                setCallStatus(`Connection error: ${error.message}`);
            }
        };

        setupDevices();

        return () => {
            if (incomingDeviceInstance) {
                incomingDeviceInstance.destroy();
                console.log('Incoming device cleaned up');
            }
            if (outgoingDeviceInstance) {
                outgoingDeviceInstance.destroy();
                console.log('Outgoing device cleaned up');
            }
        };
    }, [username]);
    useEffect(() => {
        // Validate based on country code
        let isValid = false;
        if (countryCode === '+1') {
            isValid = phoneNumber.length === 10; // US: 10 digits
        } else if (countryCode === '+63') {
            isValid = phoneNumber.length === 10; // PH: 10 digits
        }
        setPhoneNumberValid(isValid);
    }, [phoneNumber, countryCode]);
    useEffect(() => {
        let reconnectTimeout = null;
        let isReconnecting = false;  // To track if we are already in the process of reconnecting
    
        const connectWebSocket = () => {
            if (isReconnecting) {
                console.log("Already trying to reconnect. Skipping new connection attempt.");
                return;  // Skip if already in reconnect process
            }
    
            console.log("Connecting to WebSocket...");
            ws.current = new WebSocket('wss://fdc3-202-137-119-154.ngrok-free.app',['ngrok-skip-browser-warning']);
    
            ws.current.onopen = () => {
                console.log('WebSocket connected');
                ws.current.send(JSON.stringify({ type: 'login', username }));
                // Clear reconnect timeout on successful connection
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = null;
                }
                isReconnecting = false; // Reset reconnect state
            };
    
            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'message') {
                    setChat((prev) => [...prev, { type: 'message', username: data.username, content: data.message }]);
                }else if (data.type === 'notification') {
                    setChat((prev) => [...prev, { type: 'notification', content: data.message }]);
                } else if (data.type === 'image') {
                    const encodedFilePath = encodeURI(data.filePath);
                    console.log('data:',JSON.stringify(data))
                    setChat((prev) => [
                        ...prev,
                        // { type: 'image', username: data.username, content: `https://fdc3-202-137-119-154.ngrok-free.app${data.filePath}` },
                        { type: 'image', username: data.username, content: data.filePath },
                    ]);
                    console.log('Image src:',encodedFilePath)
                } else if (data.type === 'userList') {
                    setContacts(data.users);
                } else if (data.type === 'others') {
                    setChat((prev) => [
                        ...prev,
                        {
                            type: 'others',
                            username: data.username,
                            content: `https://fdc3-202-137-119-154.ngrok-free.app${data.filePath}`,
                            fileName: data.fileName,
                        },
                    ]);
                }else if (data.type === 'incomingSMS') {
                    handleIncomingSMS(data);
                }
            };
    
            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                if (!isReconnecting) {
                    isReconnecting = true;  // Mark as reconnecting
                    console.log("Attempting to reconnect...");
                    reconnectTimeout = setTimeout(() => {
                        connectWebSocket();  // Attempt reconnect
                    }, 3000);
                }
            };
    
            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Optional: Handle specific error states, maybe show a message to the user
            };
        };
    
        connectWebSocket(); // Initial connection attempt
    
        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
        };
    }, [username]);
    const sendMessage = () => {
        if (message.trim() === '') {
            alert('Message cannot be empty.');
            return;
        }
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'message', message }));
            setMessage('');
        } else {
            alert('WebSocket connection is not open. Please refresh the page.');
        }
    };

    const uploadFile = async () => {
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('https://fdc3-202-137-119-154.ngrok-free.app/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    const fileType = file.type.startsWith('image/') ? 'image' : 'others';
                    ws.current.send(
                        JSON.stringify({
                            type: fileType,
                            filePath: result.path,
                            fileName: file.name,
                        })
                    );
                }
            } else {
                alert('File upload failed.');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('File upload failed.');
        }
    };

    const fetchEmails = async () => {
        setLoadingEmails(true); // Set loading state to true
    
        try {
            const response = await fetch('https://fdc3-202-137-119-154.ngrok-free.app/fetch-emails', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true', // Add this header
                },
            });
    
            if (!response.ok) {
                console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
                throw new Error('Failed to fetch emails. Please try again later.');
            }
    
            const data = await response.json();
    
            if (data.success) {
                const mappedEmails = data.emails.map((email, index) => ({
                    id: index + 1, // Generate a unique ID
                    from: email.from || 'Unknown sender',
                    subject: email.subject || 'No subject',
                    content: email.content || 'No content',
                    date: email.date || 'No date',
                    attachments: email.attachments || [], // Include attachments
                }));
    
                setEmailInbox(mappedEmails);
            } else {
                console.error('Server Error:', data.message);
                throw new Error(data.message || 'Failed to fetch emails.');
            }
        } catch (error) {
            console.error('Error fetching emails:', error.message || error);
            alert('An error occurred while fetching emails. Please try again.');
        } finally {
            setLoadingEmails(false); // Ensure loading state is reset
        }
    };
    
    
    const validatePhoneNumber = (number) => {
        return number.length === 11; // Changed from 10 to 11
    };
     // Function to send email using the backend
     const sendEmail = async () => {
        if (!emailRecipient.trim() || !emailSubject.trim() || !emailContent.trim()) {
            alert('Recipient, subject, and content cannot be empty.');
            return;
        }
    
        const formData = new FormData();
        formData.append('to', emailRecipient);
        formData.append('subject', emailSubject);
        formData.append('content', emailContent);
        if (emailAttachment) {
            formData.append('attachments', emailAttachment); // Attach the file
        }
    
        try {
            const backendUrl = 'https://fdc3-202-137-119-154.ngrok-free.app/send-email'; // Replace with your actual backend URL
    
            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData,
            });
    
            const result = await response.json();
            if (result.success) {
                alert('Email sent successfully!');
                setEmailRecipient('');
                setEmailSubject('');
                setEmailContent('');
                setEmailAttachment(null); // Reset attachment
            } else {
                alert(`Failed to send email: ${result.message}`);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('An error occurred while sending the email.');
        }
    };
    
    // Load emails when switching to the email tab
    useEffect(() => {
        if (activeTab === 'email') {
            fetchEmails();
        }
    }, [activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Tab Navigation */}
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => handleTabChange('chat')} style={{ padding: '10px', marginRight: '10px' }}>
                    Chat
                </button>
                <button onClick={() => handleTabChange('email')} style={{ padding: '10px', marginRight: '10px' }}>
                    Email
                </button>
                <button onClick={() => handleTabChange('sms')} style={{ padding: '10px', marginRight: '10px' }}>
                    SMS
                </button>
                <button onClick={() => handleTabChange('call')} style={{ padding: '10px', marginRight: '10px' }}>
                    Call
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h3>Online Users</h3>
                        {contacts.length > 0 ? (
                            contacts.map((user, index) => <div key={index}>{user}</div>)
                        ) : (
                            <div>No users online</div>
                        )}
                    </div>
                    <div
                        style={{
                            border: '1px solid #ccc',
                            height: '300px',
                            overflowY: 'scroll',
                            padding: '10px',
                            marginBottom: '10px',
                        }}
                    >
                        {chat.length > 0 ? (
                            chat.map((msg, index) => {
                                if (msg.type === 'message') {
                                    return (
                                        <div key={index}>
                                            <strong>{msg.username}:</strong> {msg.content}
                                        </div>
                                    );
                                } else if (msg.type === 'notification') {
                                    return <div key={index}>* {msg.content}</div>;
                                } else if (msg.type === 'image') {
                                    return (
                                        <div key={index}>
                                            <strong>{msg.username}:</strong>
                                            <img
                                                src={msg.content}
                                                alt="Uploaded"
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    display: 'block',
                                                    marginTop: '5px',
                                                }}
                                            />
                                        </div>
                                    );
                                } else if (msg.type === 'others') {
                                    return (
                                        <div key={index}>
                                            <strong>{msg.username}:</strong>
                                            <a href={msg.content} target="_blank" rel="noopener noreferrer">
                                                {msg.fileName}
                                            </a>
                                        </div>
                                    );
                                }
                                return null;
                            })
                        ) : (
                            <div>No messages yet</div>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ width: '60%', padding: '10px', marginRight: '10px' }}
                    />
                    <button onClick={sendMessage} style={{ padding: '10px' }}>
                        Send
                    </button>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ marginLeft: '10px' }}
                    />
                    <button onClick={uploadFile} style={{ padding: '10px', marginLeft: '10px' }}>
                        Upload
                    </button>
                </div>
            )}

             {/* Tab Content */}
             {activeTab === 'email' && (
                <div>
                    <h3>Email Inbox</h3>
                    <button onClick={fetchEmails} style={{ marginBottom: '10px', padding: '10px' }}>
                        Refresh
                    </button>
                    {loadingEmails ? (
                        <div>Loading emails...</div>
                    ) : (
                        <div>
                            {emailInbox.length > 0 ? (
                                <ul>
                                    {emailInbox.map((email) => (
                                        <li key={email.id}>
                                            <strong>From:</strong> {email.from} <br />
                                            <strong>Subject:</strong> {email.subject} <br />
                                            <strong>Date:</strong> {email.date} <br />
                                            <p>{email.content}</p>
                                            {email.attachments.length > 0 && (
                                                <div>
                                                    <strong>Attachments:</strong>
                                                    <ul>
                                                        {email.attachments.map((attachment, index) => (
                                                            <li key={index}>
                                                                <a
                                                                    href={`data:${attachment.contentType};base64,${attachment.content}`}
                                                                    download={attachment.filename}
                                                                >
                                                                    {attachment.filename}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <hr />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div>No emails available</div>
                            )}
                        </div>
                    )}

                    <h3>Compose Email</h3>
                    <input
                        type="email"
                        placeholder="Recipient"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                    />
                    <input
                        type="text"
                        placeholder="Subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                    />
                    <textarea
                        placeholder="Write your email here..."
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        style={{ width: '100%', height: '100px', padding: '10px', marginBottom: '10px' }}
                    ></textarea>
                    <input
                        type="file"
                        onChange={(e) => setEmailAttachment(e.target.files[0])}
                        style={{ marginBottom: '10px' }}
                    />
                    <button onClick={sendEmail} style={{ padding: '10px' }}>
                        Send Email
                    </button>
                </div>
            )}

            {activeTab === 'sms' && (
                <div className="sms-tab">
                    <h2 className="sms-tab__title">SMS Tab</h2>
                    <div className="sms-tab__input-group">
                        <label className="sms-tab__label">Recipient Number:</label>
                        <input 
                            type="text" 
                            className="sms-tab__input"
                            value={recipientNumber} 
                            onChange={(e) => handleNumberInput(e.target.value)} 
                        />
                    </div>
                    <div className="sms-tab__input-group">
                        <label className="sms-tab__label">Message:</label>
                        <textarea 
                            className="sms-tab__textarea"
                            value={smsContent} 
                            onChange={(e) => setSmsContent(e.target.value)} 
                        />
                    </div>
                    <button className="sms-tab__button" onClick={sendSms}>Send SMS</button>
                    <div className="sms-tab__history">
                        <h3 className="sms-tab__history-title">Message History:</h3>
                        <ul className="sms-tab__history-list">
                            {messageHistory.map((msg, index) => (
                                <li key={index} className="sms-tab__history-item">
                                    <span className="sms-tab__history-type">Type: {msg.type}</span>
                                    <span className="sms-tab__history-recipient">
                                        {msg.type === 'SMS' ? `From: ${msg.sender}` : `To: ${msg.recipient}`}
                                    </span>
                                    <span className="sms-tab__history-content">Content: {msg.content}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="sms-tab__status">{smsStatus}</p>
                </div>
            )}
            {activeTab === 'call' && (
                <div className="call-interface">
                    <div className="call-header">
                        <h3>Phone Dialer</h3>
                        <div className="call-status">
                            {isReady ? (
                                <span className="status-indicator connected">Connected</span>
                            ) : (
                                <span className="status-indicator disconnected">Disconnected</span>
                            )}
                        </div>
                    </div>
                    <div className="country-selector">
                        <select 
                            value={countryCode} 
                            onChange={(e) => setCountryCode(e.target.value)}
                            disabled={ongoingCall}
                        >
                            <option value="+1">United States (+1)</option>
                            <option value="+63">Philippines (+63)</option>
                        </select>
                    </div>        
                    <div className="number-display">
                        <input
                            type="tel"
                            placeholder={countryCode === '+1' ? '(555) 555-5555' : '912 345 6789'}
                            value={formatPhoneNumber(phoneNumber)}
                            onChange={(e) => {
                                const rawNumber = e.target.value.replace(/\D/g, '');
                                setPhoneNumber(rawNumber);
                            }}
                            className="number-input"
                            disabled={ongoingCall}
                        />
                        <button 
                            className="clear-button"
                            onClick={() => setPhoneNumber('')}
                            disabled={!phoneNumber || ongoingCall}
                        >
                            ⌫
                        </button>
                    </div>

                    <div className="call-controls">
                        <button 
                            className={`dial-button ${ongoingCall ? 'active-call' : ''}`}
                            onClick={handleDial}
                            disabled={!isReady || !phoneNumberValid || ongoingCall}
                        >
                            {ongoingCall ? (
                                <>
                                    <span className="pulse-dot"></span>
                                    On Call
                                </>
                            ) : (
                                `Dial`
                            )}
                        </button>
                        <button 
                            className="end-call-button"
                            onClick={handleEndCall}
                            disabled={!ongoingCall}
                        >
                            End Call
                        </button>
                    </div>

                    <div className="keypad-grid">
                        {[
                            ['1', '2', '3'],
                            ['4', '5', '6'],
                            ['7', '8', '9'],
                            ['*', '0', '#']
                        ].map((row, rowIndex) => (
                            <div key={rowIndex} className="keypad-row">
                                {row.map((key) => (
                                    <button
                                        key={key}
                                        className="keypad-button"
                                        onClick={() => handleKeypadPress(key)}
                                        disabled={ongoingCall}
                                    >
                                        <span className="number">{key}</span>
                                        {['2','3','4','5','6','7','8','9'].includes(key) && (
                                            <span className="letters">{getKeypadLetters(key)}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}
                        <button 
                            className="keypad-button backspace"
                            onClick={() => setPhoneNumber(prev => prev.slice(0, -1))}
                            disabled={!phoneNumber || ongoingCall}
                        >
                            ⌫
                        </button>
                    </div>
                </div>
            )}
            {incomingCall && !ongoingCall && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <p><strong>Incoming call from:</strong> {incomingCall.parameters.From}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button 
                                onClick={handleAcceptCall}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Accept
                            </button>
                            <button 
                                onClick={handleRejectCall}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ongoing Call Modal */}
            {/* {ongoingCall && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <p><strong>On Call with:</strong> {ongoingCall.parameters.From}</p>
                        <p><strong>Duration:</strong> {formatDuration(callDuration)}</p>
                        <button 
                            onClick={handleEndCall}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            End Call
                        </button>
                    </div>
                </div>
            )} */}
            {ongoingCall && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <p><strong>On Call with:</strong> {formatPhoneNumber(phoneNumber)}</p>
                        <p><strong>Duration:</strong> {formatDuration(callDuration)}</p>
                        <button 
                            onClick={handleEndCall}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            End Call
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
// Styles for the modal
const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const modalContentStyle = {
    background: '#fff',
    padding: '20px',
    borderRadius: '5px',
    textAlign: 'center',
};

export default Dashboard;
