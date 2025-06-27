// Free Voice Interview Service using Browser APIs + Google Gemini
export class FreeVoiceService {
    private recognition: any = null;
    private synthesis: SpeechSynthesis | null = null;
    private isListening = false;
    private isSpeaking = false;
    private networkIssueCount = 0;
    private maxNetworkRetries = 3; // Increased from 2 to 3

    constructor() {
        if (typeof window !== 'undefined') {
            // Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true; // Changed to true for better detection
                this.recognition.interimResults = true; // Changed to true for better detection
                this.recognition.lang = 'en-US';
                this.recognition.maxAlternatives = 1;
                
                console.log('🎤 Speech recognition initialized with continuous=true, interimResults=true');
            }

            // Initialize Speech Synthesis
            this.synthesis = window.speechSynthesis;
        }
    }

    // Start listening for user speech with better network error handling
    startListening(callbacks?: {
        onAudioStart?: () => void;
        onSoundStart?: () => void;
        onSpeechStart?: () => void;
        onSpeechEnd?: () => void;
        onTranscript?: (transcript: string, isFinal: boolean) => void;
    }): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                console.error('❌ Speech recognition not supported in this browser');
                reject(new Error('Speech recognition not supported'));
                return;
            }

            // If already listening, stop the current session first
            if (this.isListening) {
                console.log('🛑 Already listening, stopping previous session...');
                this.recognition.stop();
                this.isListening = false;
                // Wait a bit before starting new session
                setTimeout(() => {
                    this.startListening(callbacks).then(resolve).catch(reject);
                }, 800);
                return;
            }

            console.log('🎤 Initializing speech recognition...');
            console.log('🎤 Network issue count:', this.networkIssueCount);
            
            this.isListening = true;

            let timeoutId: NodeJS.Timeout;
            let hasResult = false;
            let silenceTimer: NodeJS.Timeout;
            let finalTranscript = '';

            // Set a longer timeout for speech detection
            timeoutId = setTimeout(() => {
                if (this.isListening && !hasResult) {
                    console.log('⏰ Speech recognition timeout after 15 seconds');
                    this.recognition.stop();
                    this.isListening = false;
                    reject(new Error('Speech recognition timeout - please try again'));
                }
            }, 15000); // Increased to 15 seconds

            this.recognition.onresult = (event: any) => {
                console.log('🎤 OnResult triggered with', event.results.length, 'results');
                
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                        console.log('🎤 Final transcript:', finalTranscript);
                        callbacks?.onTranscript?.(finalTranscript, true);
                    } else {
                        interimTranscript += transcript;
                        console.log('🎤 Interim transcript:', interimTranscript);
                        callbacks?.onTranscript?.(interimTranscript, false);
                    }
                }
                
                // If we have any final transcript, use it
                if (finalTranscript.trim().length > 0 && !hasResult) {
                    hasResult = true;
                    clearTimeout(timeoutId);
                    clearTimeout(silenceTimer);
                    this.isListening = false;
                    this.networkIssueCount = 0;
                    this.recognition.stop();
                    resolve(finalTranscript.trim());
                    return;
                }
                
                // If we have interim results, set up silence detection
                if (interimTranscript.trim().length > 0) {
                    console.log('🎤 Detected speech, setting up silence timer...');
                    clearTimeout(silenceTimer);
                    
                    // Wait for silence after detecting speech
                    silenceTimer = setTimeout(() => {
                        if (finalTranscript.trim().length > 0 || interimTranscript.trim().length > 0) {
                            const result = finalTranscript.trim() || interimTranscript.trim();
                            if (!hasResult && result.length > 0) {
                                hasResult = true;
                                clearTimeout(timeoutId);
                                this.isListening = false;
                                this.networkIssueCount = 0;
                                this.recognition.stop();
                                console.log('🎤 Using result after silence:', result);
                                resolve(result);
                            }
                        }
                    }, 1500); // Wait 1.5 seconds of silence
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('🎤 Speech recognition error:', event.error);
                console.log('🎤 Error details:', event);
                clearTimeout(timeoutId);
                this.isListening = false;
                
                // Handle network errors with limited retry logic
                if (event.error === 'network') {
                    this.networkIssueCount++;
                    
                    // Allow 2 retries for network errors before giving up
                    if (this.networkIssueCount <= 2) {
                        console.log(`🔄 Network error, retrying... (${this.networkIssueCount}/2)`);
                        setTimeout(() => {
                            this.startListening(callbacks).then(resolve).catch(reject);
                        }, 1000 + (this.networkIssueCount * 500)); // Increasing delay
                        return;
                    } else {
                        reject(new Error('Speech service is having network issues. Please try again or use text input.'));
                        return;
                    }
                }
                
                // More specific error handling for other errors
                switch (event.error) {
                    case 'not-allowed':
                        reject(new Error('Microphone access denied. Please allow microphone permissions and try again.'));
                        break;
                    case 'no-speech':
                        reject(new Error('No speech detected. Please speak louder and try again.'));
                        break;
                    case 'audio-capture':
                        reject(new Error('Microphone not available. Please check your microphone.'));
                        break;
                    case 'service-not-allowed':
                        reject(new Error('Speech recognition not available. Please use text input instead.'));
                        break;
                    case 'aborted':
                        // Don't reject for aborted - this is expected when stopping
                        console.log('🎤 Speech recognition aborted');
                        break;
                    default:
                        reject(new Error(`Speech recognition failed (${event.error}). Please try text input instead.`));
                }
            };

            this.recognition.onend = () => {
                console.log('🎤 Speech recognition ended');
                clearTimeout(timeoutId);
                clearTimeout(silenceTimer);
                
                // Only reject if we haven't already resolved and we don't have any transcript
                if (this.isListening && !hasResult) {
                    this.isListening = false;
                    
                    // If we have any collected transcript, use it
                    if (finalTranscript.trim().length > 0) {
                        console.log('🎤 Using final transcript on end:', finalTranscript);
                        resolve(finalTranscript.trim());
                    } else {
                        console.log('🎤 No speech detected during session');
                        reject(new Error('No speech detected. Please speak closer to your microphone.'));
                    }
                } else {
                    this.isListening = false;
                }
            };

            this.recognition.onaudiostart = () => {
                console.log('🎤 Audio input started - microphone is working');
                callbacks?.onAudioStart?.();
            };

            this.recognition.onsoundstart = () => {
                console.log('🎤 Sound detected - speak now!');
                callbacks?.onSoundStart?.();
            };

            this.recognition.onspeechstart = () => {
                console.log('🎤 Speech detected - keep talking');
                callbacks?.onSpeechStart?.();
            };

            this.recognition.onspeechend = () => {
                console.log('🎤 Speech ended - processing...');
                callbacks?.onSpeechEnd?.();
            };

            this.recognition.onsoundend = () => {
                console.log('🎤 Sound ended');
            };

            this.recognition.onaudioend = () => {
                console.log('🎤 Audio input ended');
            };

            this.recognition.onstart = () => {
                console.log('🎤 Speech recognition started successfully - speak now!');
                console.log('🎤 Make sure you speak clearly and wait for the response');
                // Immediately trigger audio start callback since recognition is active
                if (callbacks?.onAudioStart) {
                    console.log('🎤 Triggering audio start callback immediately');
                    callbacks.onAudioStart();
                }
            };

            try {
                console.log('🎤 Attempting to start speech recognition...');
                this.recognition.start();
                console.log('🎤 Speech recognition started successfully');
                
                // Immediately notify that audio input is beginning
                setTimeout(() => {
                    if (callbacks?.onAudioStart) {
                        console.log('🎤 Triggering initial audio callback after start');
                        callbacks.onAudioStart();
                    }
                }, 50); // Very short delay to ensure it's after the recognition starts
            } catch (error) {
                console.error('🎤 Failed to start recognition:', error);
                clearTimeout(timeoutId);
                this.isListening = false;
                
                // More specific error based on what we know
                if (error instanceof Error) {
                    if (error.message.includes('not allowed')) {
                        reject(new Error('Microphone permission denied. Please allow microphone access.'));
                    } else if (error.message.includes('not supported')) {
                        reject(new Error('Speech recognition not supported. Please use Chrome or Edge browser.'));
                    } else {
                        reject(new Error('Speech recognition failed to start. Please try text input instead.'));
                    }
                } else {
                    reject(new Error('Speech recognition failed to start. Please try text input instead.'));
                }
            }
        });
    }

    // Stop listening
    stopListening() {
        if (this.recognition && this.isListening) {
            console.log('🛑 Stopping speech recognition');
            this.isListening = false; // Set this first to prevent restart
            this.recognition.stop();
        }
    }

    // Speak text using browser TTS
    speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                console.error('❌ Speech synthesis not supported');
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            if (this.isSpeaking) {
                console.log('🛑 Canceling previous speech');
                this.synthesis.cancel();
            }

            console.log('🗣️ Creating speech utterance for:', text);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                console.log('🗣️ Speech synthesis started');
                this.isSpeaking = true;
            };

            utterance.onend = () => {
                console.log('✅ Speech synthesis completed');
                this.isSpeaking = false;
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('❌ Speech synthesis error:', event.error);
                this.isSpeaking = false;
                reject(new Error(`Speech synthesis error: ${event.error}`));
            };

            console.log('🗣️ Starting speech synthesis...');
            this.synthesis.speak(utterance);
        });
    }

    // Stop speaking
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    // Check if currently speaking
    get speaking() {
        return this.isSpeaking;
    }

    // Check if currently listening
    get listening() {
        return this.isListening;
    }

    // Check if services are supported
    get supported() {
        return !!(this.recognition && this.synthesis);
    }

    // Check if we're having network issues
    get hasNetworkIssues() {
        return this.networkIssueCount >= this.maxNetworkRetries;
    }

    // Reset network issue count (call this when starting a new interview)
    resetNetworkIssues() {
        this.networkIssueCount = 0;
        console.log('🔄 Reset network issues count');
    }

    // Complete reset of voice service state
    resetVoiceService() {
        this.stopListening();
        this.stopSpeaking();
        this.networkIssueCount = 0;
        console.log('🔄 Complete voice service reset');
    }

    // Test microphone access and basic functionality
    async testMicrophone(): Promise<string> {
        try {
            // Test microphone permissions
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Microphone access granted');
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            // Test speech recognition
            return new Promise((resolve, reject) => {
                if (!this.recognition) {
                    reject(new Error('Speech recognition not supported'));
                    return;
                }

                console.log('🧪 Testing speech recognition...');
                const testRecognition = new (window as any).webkitSpeechRecognition();
                testRecognition.continuous = false;
                testRecognition.interimResults = false;
                testRecognition.lang = 'en-US';
                
                let testTimeout = setTimeout(() => {
                    testRecognition.stop();
                    reject(new Error('Test timeout - please speak louder'));
                }, 5000);

                testRecognition.onresult = (event: any) => {
                    if (event.results.length > 0) {
                        const transcript = event.results[0][0].transcript.trim();
                        clearTimeout(testTimeout);
                        testRecognition.stop();
                        resolve(`Test successful! You said: "${transcript}"`);
                    }
                };

                testRecognition.onerror = (event: any) => {
                    clearTimeout(testTimeout);
                    reject(new Error(`Test failed: ${event.error}`));
                };

                testRecognition.onend = () => {
                    clearTimeout(testTimeout);
                };

                testRecognition.start();
            });
            
        } catch (error) {
            throw new Error(`Microphone test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get current network issue status
    getNetworkStatus() {
        return {
            issueCount: this.networkIssueCount,
            maxRetries: this.maxNetworkRetries,
            hasIssues: this.hasNetworkIssues
        };
    }
}

export default FreeVoiceService;
