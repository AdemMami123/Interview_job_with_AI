// Free Voice Interview Service using Browser APIs + Google Gemini
export class FreeVoiceService {
    private recognition: any = null;
    private synthesis: SpeechSynthesis | null = null;
    private isListening = false;
    private isSpeaking = false;
    private networkIssueCount = 0;
    private maxNetworkRetries = 3;
    private isMobile = false;
    private microphonePermissionGranted = false;

    constructor() {
        if (typeof window !== 'undefined') {
            // Detect mobile device
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            console.log('📱 Device type:', this.isMobile ? 'Mobile' : 'Desktop');
            
            // Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                
                // Mobile-specific configuration
                if (this.isMobile) {
                    this.recognition.continuous = false; // Better for mobile
                    this.recognition.interimResults = true; // Enable interim results for better UX
                    console.log('📱 Mobile speech recognition configured: continuous=false, interimResults=true');
                } else {
                    this.recognition.continuous = true;
                    this.recognition.interimResults = true;
                    console.log('🖥️ Desktop speech recognition configured: continuous=true, interimResults=true');
                }
                
                this.recognition.lang = 'en-US';
                this.recognition.maxAlternatives = 1;
                
                console.log('🎤 Speech recognition initialized');
            } else {
                console.error('❌ Speech recognition not supported in this browser');
            }

            // Initialize Speech Synthesis
            this.synthesis = window.speechSynthesis;
        }
    }

    // Request microphone permissions explicitly (especially important for mobile)
    async requestMicrophonePermission(): Promise<boolean> {
        try {
            console.log('🎤 Requesting microphone permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    ...(this.isMobile && {
                        sampleRate: 16000, // Lower sample rate for mobile
                        channelCount: 1 // Mono for mobile
                    })
                } 
            });
            
            console.log('✅ Microphone permission granted');
            this.microphonePermissionGranted = true;
            
            // Stop the stream after getting permission
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Audio track stopped after permission check');
            });
            
            return true;
        } catch (error) {
            console.error('❌ Microphone permission denied or not available:', error);
            this.microphonePermissionGranted = false;
            return false;
        }
    }

    // Start listening for user speech with better mobile support
    startListening(callbacks?: {
        onAudioStart?: () => void;
        onSoundStart?: () => void;
        onSpeechStart?: () => void;
        onSpeechEnd?: () => void;
        onTranscript?: (transcript: string, isFinal: boolean) => void;
    }): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (!this.recognition) {
                console.error('❌ Speech recognition not supported in this browser');
                reject(new Error('Speech recognition not supported'));
                return;
            }

            // For mobile devices, ensure microphone permission first
            if (this.isMobile && !this.microphonePermissionGranted) {
                console.log('📱 Mobile device detected, requesting microphone permission...');
                const permissionGranted = await this.requestMicrophonePermission();
                if (!permissionGranted) {
                    reject(new Error('Microphone permission required for voice input on mobile devices'));
                    return;
                }
            }

            // If already listening, stop the current session first
            if (this.isListening) {
                console.log('🛑 Already listening, stopping previous session...');
                this.recognition.stop();
                this.isListening = false;
                // Longer wait for mobile devices
                const waitTime = this.isMobile ? 1500 : 800;
                setTimeout(() => {
                    this.startListening(callbacks).then(resolve).catch(reject);
                }, waitTime);
                return;
            }

            console.log('🎤 Initializing speech recognition...');
            console.log('🎤 Device type:', this.isMobile ? 'Mobile' : 'Desktop');
            console.log('🎤 Network issue count:', this.networkIssueCount);
            
            this.isListening = true;

            let timeoutId: NodeJS.Timeout;
            let hasResult = false;
            let silenceTimer: NodeJS.Timeout;
            let finalTranscript = '';

            // Mobile devices get shorter timeout, desktop gets longer
            const timeout = this.isMobile ? 15000 : 30000; // 15s mobile, 30s desktop
            timeoutId = setTimeout(() => {
                if (this.isListening && !hasResult) {
                    console.log(`⏰ Speech recognition timeout after ${timeout/1000} seconds`);
                    this.recognition.stop();
                    this.isListening = false;
                    const errorMsg = this.isMobile 
                        ? 'No speech detected. Please speak closer to your microphone and ensure permissions are granted.'
                        : 'Speech recognition timeout - please try again';
                    reject(new Error(errorMsg));
                }
            }, timeout);

            this.recognition.onresult = (event: any) => {
                console.log('🎤 OnResult triggered with', event.results.length, 'results');
                console.log('🎤 Has result flag:', hasResult);
                
                // Prevent multiple processing of the same result
                if (hasResult) {
                    console.log('🔄 Result already processed, ignoring additional onresult');
                    return;
                }
                
                let interimTranscript = '';
                let latestInterimText = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                        console.log('🎤 Final transcript part:', transcript);
                        console.log('🎤 Complete final transcript so far:', finalTranscript);
                        callbacks?.onTranscript?.(finalTranscript, true);
                        
                        // Use final result immediately - don't wait for silence
                        if (finalTranscript.trim().length > 0 && !hasResult) {
                            hasResult = true;
                            clearTimeout(timeoutId);
                            clearTimeout(silenceTimer);
                            this.isListening = false;
                            this.networkIssueCount = 0;
                            this.recognition.stop();
                            console.log('🎤 Using final transcript immediately:', finalTranscript.trim());
                            resolve(finalTranscript.trim());
                            return;
                        }
                    } else {
                        interimTranscript += transcript;
                        latestInterimText = transcript;
                        console.log('🎤 Interim transcript:', interimTranscript);
                        callbacks?.onTranscript?.(finalTranscript + interimTranscript, false);
                    }
                }
                
                // For mobile devices or when we have substantial interim results, use them more quickly
                if (this.isMobile && interimTranscript.trim().length > 10 && !hasResult) {
                    console.log('📱 Mobile: Using interim result due to substantial content');
                    hasResult = true;
                    clearTimeout(timeoutId);
                    clearTimeout(silenceTimer);
                    this.isListening = false;
                    this.networkIssueCount = 0;
                    this.recognition.stop();
                    resolve((finalTranscript + interimTranscript).trim());
                    return;
                }
                
                // Set up silence detection for interim results
                if (interimTranscript.trim().length > 0 || latestInterimText.trim().length > 0) {
                    console.log('🎤 Detected speech, resetting silence timer...');
                    clearTimeout(silenceTimer);
                    
                    // Shorter silence timeout for better responsiveness
                    const totalSpeech = (finalTranscript + interimTranscript).trim();
                    const speechLength = totalSpeech.length;
                    let silenceTimeout = 1500; // Reduced base timeout to 1.5 seconds
                    
                    // Add time for longer responses but keep it reasonable
                    if (speechLength > 50) silenceTimeout = 2000; // 2 seconds for medium responses
                    if (speechLength > 100) silenceTimeout = 2500; // 2.5 seconds for long responses
                    
                    console.log(`🎤 Setting silence timeout to ${silenceTimeout}ms for speech length: ${speechLength}`);
                    
                    silenceTimer = setTimeout(() => {
                        const result = (finalTranscript + interimTranscript).trim();
                        if (!hasResult && result.length > 0) {
                            hasResult = true;
                            clearTimeout(timeoutId);
                            this.isListening = false;
                            this.networkIssueCount = 0;
                            this.recognition.stop();
                            console.log('🎤 Using result after silence:', result);
                            resolve(result);
                        }
                    }, silenceTimeout);
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
                console.log('🎤 Final transcript at end:', finalTranscript);
                console.log('🎤 Has result flag:', hasResult);
                clearTimeout(timeoutId);
                clearTimeout(silenceTimer);
                
                // Always set listening to false
                this.isListening = false;
                
                // If we haven't resolved yet and have any transcript, use it
                if (!hasResult) {
                    if (finalTranscript.trim().length > 0) {
                        hasResult = true;
                        console.log('🎤 Using final transcript on end:', finalTranscript.trim());
                        resolve(finalTranscript.trim());
                    } else {
                        console.log('🎤 No speech detected during session');
                        reject(new Error('No speech detected. Please speak closer to your microphone.'));
                    }
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
