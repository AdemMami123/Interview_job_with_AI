"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import FreeVoiceService from '@/lib/free-voice.service'

enum CallStatus{
    INACTIVE= 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED= 'FINISHED',
}

interface savedMessage {
    role:"user" |"system" |"assistant";
    content:string;
}
const Agent = ({userName,userId,type,questions}:AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setisSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [voiceDisabled, setVoiceDisabled] = useState(false);
    const [audioDetected, setAudioDetected] = useState(false);
    const [speechDetected, setSpeechDetected] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<savedMessage[]>([]);
    const [voiceService, setVoiceService] = useState<FreeVoiceService | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
    const [isConversational, setIsConversational] = useState(true); // New conversational mode
    const [conversationCount, setConversationCount] = useState(0);
    
    // Interview tracking
    const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
    const [isSavingInterview, setIsSavingInterview] = useState(false);
    const [interviewSaved, setInterviewSaved] = useState(false);

    // Initialize voice service
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const service = new FreeVoiceService();
            setVoiceService(service);
        }
    }, []);

    // Generate questions when component mounts or type changes
    useEffect(() => {
        if (questions && questions.length > 0) {
            setInterviewQuestions(questions);
        } else if (type === 'generate') {
            generateQuestions();
        }
    }, [questions, type]);

    const generateQuestions = async () => {
        try {
            const response = await fetch('/api/vapi/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'technical',
                    role: 'Software Developer',
                    level: 'mid',
                    techstack: 'react,nodejs,typescript',
                    amount: 5,
                    userid: userId
                })
            });
            
            const { data } = await response.json();
            if (data?.questions) {
                setInterviewQuestions(data.questions);
            }
        } catch (error) {
            console.error('Error generating questions:', error);
        }
    };

    const speak = async (text: string) => {
        if (!voiceService) {
            console.error('❌ No voice service available for speaking');
            return;
        }
        
        try {
            console.log('🗣️ Starting to speak:', text);
            setisSpeaking(true);
            setIsThinking(false);
            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
            await voiceService.speak(text);
            console.log('✅ Finished speaking');
            setisSpeaking(false);
            
            // Wait a moment then start listening naturally (only if voice is not disabled)
            if (callStatus === CallStatus.ACTIVE && !voiceDisabled) {
                console.log('🤖 AI finished speaking, waiting for your response...');
                setTimeout(() => {
                    startListening();
                }, 1000); // Just 1 second delay for natural flow
            } else if (voiceDisabled) {
                // If voice is disabled, show text input automatically
                console.log('🤖 AI finished speaking, please use text input to respond...');
                setShowTextInput(true);
            }
        } catch (error) {
            console.error('❌ Error speaking:', error);
            setisSpeaking(false);
        }
    };

    const startListening = async () => {
        if (!voiceService || callStatus !== CallStatus.ACTIVE || isListening) return;
        
        setIsListening(true);
        setIsThinking(false);
        setSpeechError(null); // Clear any previous errors
        setAudioDetected(false);
        setSpeechDetected(false);
        setCurrentTranscript('');
        
        // Give immediate feedback that we're attempting to listen
        console.log('🎤 Starting microphone... Please wait a moment then speak...');
        
        try {
            console.log('🎤 Ready to listen - please speak...');
            const transcript = await voiceService.startListening({
                onAudioStart: () => {
                    console.log('🎤 Callback: Audio input started');
                    setAudioDetected(true);
                },
                onSoundStart: () => {
                    console.log('🎤 Callback: Sound detected');
                    setAudioDetected(true);
                },
                onSpeechStart: () => {
                    console.log('🎤 Callback: Speech started');
                    setSpeechDetected(true);
                },
                onSpeechEnd: () => {
                    console.log('🎤 Callback: Speech ended');
                    setSpeechDetected(false);
                },
                onTranscript: (text: string, isFinal: boolean) => {
                    console.log('🎤 Callback: Transcript update:', text, isFinal ? '(final)' : '(interim)');
                    setCurrentTranscript(text);
                }
            });
            console.log('✅ You said:', transcript);
            console.log('📊 Current state - isListening:', isListening, 'transcript length:', transcript.trim().length);
            
            // Process the transcript if we got meaningful input
            if (transcript.trim().length > 1) {
                console.log('🎤 Processing voice input:', transcript);
                setIsListening(false);
                setIsThinking(true); // Show thinking while processing
                setCurrentTranscript('');
                setAudioDetected(false);
                setSpeechDetected(false);
                setMessages(prev => [...prev, { role: 'user', content: transcript }]);
                await handleUserAnswer(transcript);
            } else {
                console.log('🎤 Transcript too short, not processing:', transcript);
                setIsListening(false);
                setCurrentTranscript('');
                setAudioDetected(false);
                setSpeechDetected(false);
            }
        } catch (error) {
            console.error('❌ Error listening:', error);
            setIsListening(false);
            setIsThinking(false);
            setCurrentTranscript('');
            setAudioDetected(false);
            setSpeechDetected(false);
            
            // Check network status
            const networkStatus = voiceService.getNetworkStatus();
            
            // Only disable voice after multiple failures (not just network issues)
            if (networkStatus.issueCount >= 4) {
                setVoiceDisabled(true);
                setSpeechError('Voice recognition has failed multiple times. Please use text input to continue.');
                setShowTextInput(true);
                return;
            }
            
            // Show user-friendly error messages
            if (error instanceof Error) {
                if (error.message.includes('not-allowed') || error.message.includes('denied')) {
                    setSpeechError('Microphone access denied. Please allow microphone permissions or use text input.');
                    return;
                } else if (error.message.includes('network') || error.message.includes('service-not-allowed')) {
                    setSpeechError('Speech service issue. Please try again or use text input.');
                    return;
                } else if (error.message.includes('timeout') || error.message.includes('No speech')) {
                    setSpeechError('No speech detected. Try the Test Voice button first, then speak closer to your microphone.');
                    return;
                } else if (error.message.includes('unavailable')) {
                    setSpeechError('Speech service is currently unavailable. Please use text input.');
                    return;
                } else {
                    setSpeechError('Speech recognition failed. Please try again or use text input.');
                }
            }
            
            // Don't auto-retry any errors - let user manually use Push to Talk
            console.log('🎤 Please use the Push to Talk button to continue');
        }
    };

    const handleUserAnswer = async (answer: string) => {
        try {
            console.log('🤖 AI is processing your response:', answer);
            
            // Track conversation flow
            setConversationCount(prev => prev + 1);
            
            // Check if we should end the interview (after 8-10 exchanges)
            if (conversationCount >= 8) {
                const endingResponses = [
                    `${userName}, this has been a really great conversation. Thank you so much for taking the time to share your experiences with me. We'll be in touch soon with next steps. Have a wonderful day!`,
                    `Thank you ${userName}, I've really enjoyed learning about your background and experience. You've shared some fantastic insights. We'll follow up with you shortly. Take care!`,
                    `This has been excellent ${userName}. I appreciate you taking the time to speak with me today. Your experience sounds really valuable. We'll be in touch soon with feedback. Thanks again!`
                ];
                
                const randomEnding = endingResponses[Math.floor(Math.random() * endingResponses.length)];
                await speak(randomEnding);
                
                // Save interview before finishing
                setTimeout(async () => {
                    await saveInterview();
                    setCallStatus(CallStatus.FINISHED);
                }, 4000);
                return;
            }
            
            // New conversational approach - chat with AI like Gemini
            console.log('🌐 Sending request to AI with:', { answer, messagesCount: messages.length });
            const response = await fetch('/api/interview/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: answer,
                    conversationHistory: messages,
                    interviewContext: {
                        role: 'Software Developer',
                        level: 'Mid-level',
                        techStack: 'React, Node.js, TypeScript',
                        conversationCount: conversationCount
                    }
                })
            });
            
            console.log('🌐 API Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const { response: aiResponse, success } = await response.json();
            console.log('🤖 AI Response received:', { success, aiResponse });
            
            if (!success) {
                throw new Error('API returned unsuccessful response');
            }
            
            if (!aiResponse || aiResponse.trim().length === 0) {
                throw new Error('AI returned empty response');
            }
            
            // Speak the AI's conversational response
            console.log('🗣️ About to speak AI response:', aiResponse);
            await speak(aiResponse);
            
        } catch (error) {
            console.error('❌ Error processing answer:', error);
            setIsThinking(false);
            
            // Fallback responses
            const fallbackResponses = [
                "That's interesting. Can you tell me more about that?",
                "I see. What was the most challenging part of that experience?",
                "Thanks for sharing. How did that impact your approach to development?",
                "That sounds like valuable experience. What did you learn from it?"
            ];
            
            const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            console.log('🗣️ Using fallback response:', randomResponse);
            await speak(randomResponse);
        }
    };

    // Save interview to Firebase
    const saveInterview = async () => {
        if (!userId || !interviewStartTime || isSavingInterview || interviewSaved) {
            console.log('❌ Cannot save interview - missing data or already saving/saved');
            return;
        }

        try {
            setIsSavingInterview(true);
            console.log('💾 Saving interview to Firebase...');

            const endTime = new Date();
            const durationMinutes = Math.round((endTime.getTime() - interviewStartTime.getTime()) / (1000 * 60));

            // Extract technologies and role info from conversation
            const conversationText = messages.map(msg => msg.content).join(' ').toLowerCase();
            
            // Default data that will be enhanced by AI analysis
            const interviewData = {
                userId: userId,
                role: 'Software Developer', // AI will generate a better contextual name
                level: 'Mid-level',
                techstack: ['General'], // AI will extract actual technologies discussed
                transcript: messages,
                duration: durationMinutes,
                interviewType: 'Technical'
            };

            const response = await fetch('/api/interview/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(interviewData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Interview saved successfully!', result);
                console.log(`📝 AI-generated name: ${result.interviewName}`);
                console.log(`🔧 Extracted technologies: ${result.extractedTechStack?.join(', ')}`);
                console.log(`⭐ Score: ${result.score}/100`);
                setInterviewSaved(true);
            } else {
                console.error('❌ Failed to save interview:', result.error);
            }

        } catch (error) {
            console.error('❌ Error saving interview:', error);
        } finally {
            setIsSavingInterview(false);
        }
    };

    useEffect(() => {
        if(callStatus === CallStatus.FINISHED) {
            if (voiceService) {
                voiceService.stopSpeaking();
                voiceService.stopListening();
            }
            router.push('/');
        }
    }, [callStatus, router, voiceService]);

    const handleCall = async () => {
        if (!voiceService || !voiceService.supported) {
            alert('Voice features are not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (interviewQuestions.length === 0) {
            alert('No questions available. Please try again.');
            return;
        }

        // Test microphone access first
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ Microphone access granted');
        } catch (error) {
            console.error('❌ Microphone access denied:', error);
            alert('Please allow microphone access to start the interview. Check your browser permissions.');
            return;
        }

        // Reset voice service completely for new interview
        voiceService.resetVoiceService();
        setSpeechError(null);
        setVoiceDisabled(false);

        setCallStatus(CallStatus.CONNECTING);
        setCurrentQuestionIndex(0);
        setMessages([]);
        setConversationCount(0);
        setInterviewSaved(false);
        setIsSavingInterview(false);
        
        try {
            setCallStatus(CallStatus.ACTIVE);
            setInterviewStartTime(new Date()); // Track interview start time
            
            // Start with a natural greeting instead of following a script
            const greeting = `Hello ${userName}! It's great to meet you. I'm excited to learn more about you and your experience. To get started, could you tell me a bit about yourself and what you're passionate about in software development?`;
            await speak(greeting);
            
        } catch (error) {
            console.error('Error starting interview:', error);
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const handleDisconnect = async () => {
        // Save interview before disconnecting if there's conversation content
        if (messages.length > 2 && !interviewSaved) {
            await saveInterview();
        }
        
        setCallStatus(CallStatus.FINISHED);
        setIsListening(false);
        setIsThinking(false);
        setisSpeaking(false);
        setShowTextInput(false);
        setVoiceDisabled(false);
        setAudioDetected(false);
        setSpeechDetected(false);
        setCurrentTranscript('');
        if (voiceService) {
            voiceService.stopSpeaking();
            voiceService.stopListening();
        }
    };

    const handleTextInput = async () => {
        if (!textInput.trim()) return;
        
        const userAnswer = textInput.trim();
        setTextInput('');
        setShowTextInput(false);
        setSpeechError(null);
        setIsThinking(true);
        
        // Add user message to transcript
        setMessages(prev => [...prev, { role: 'user', content: userAnswer }]);
        
        // Process the answer
        await handleUserAnswer(userAnswer);
    };
    const lastMessage=messages[messages.length - 1]?.content || '';
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;




  return (
    <>
<div className='call-view'>
        <div className='card-interviewer'>
            <div className='avatar'>
                <Image src="/ai-avatar.png" alt="AI Interviewer" height={65} width={54} className='object-cover' />
                {isSpeaking && <span className='animate-speak'></span>}
           
           </div>
           <h3>AI Interviewer</h3>
        </div>
        <div className='card-border'>
            <div className='card-content'>
                <Image src="/user-avatar.png" alt="user avatar" height={540} width={540} className='rounded-full object-cover size-[120px]' />
                <h3>{userName}</h3>
            </div>
        </div>
    </div>
    {messages.length > 0 && (
        <div className='transcript-border'>
            <div className='transcript'>
                <p key={lastMessage} className={cn('transition-opacity duration-500 opacity-0','animate-fadeIn opacity-100')}>
                    {lastMessage}
                </p>
            </div>
        </div>
    )}
    
    {/* Status indicators */}
    {speechError && (
        <div className='w-full flex flex-col items-center gap-3 my-4'>
            <div className='flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 rounded-full'>
                <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                <span className='text-sm text-red-800 dark:text-red-200'>❌ {speechError}</span>
            </div>
            <button 
                className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
                onClick={() => setShowTextInput(!showTextInput)}
            >
                {showTextInput ? 'Hide Text Input' : '⌨️ Type Your Answer Instead'}
            </button>
            {voiceDisabled && (                    <button 
                        className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                        onClick={() => {
                            setVoiceDisabled(false);
                            setSpeechError(null);
                            if (voiceService) voiceService.resetVoiceService();
                        }}
                    >
                        🔄 Reset & Try Voice Again
                    </button>
            )}
        </div>
    )}
    
    {/* Text input fallback */}
    {showTextInput && (
        <div className='w-full max-w-md mx-auto my-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800'>
            <div className='flex flex-col gap-3'>
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your answer here..."
                    className='w-full p-3 border rounded-lg resize-none h-20 bg-white dark:bg-gray-700 text-black dark:text-white'
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleTextInput();
                        }
                    }}
                />
                <div className='flex gap-2'>
                    <button
                        onClick={handleTextInput}
                        disabled={!textInput.trim()}
                        className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Submit Answer
                    </button>
                    <button
                        onClick={() => {setShowTextInput(false); setTextInput('');}}
                        className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )}
    
    {isListening && !speechError && (
        <div className='w-full flex flex-col items-center gap-3 my-4'>
            <div className='flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full'>
                <div className={cn(
                    'w-3 h-3 rounded-full transition-all duration-300',
                    audioDetected ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
                )}></div>
                <span className='text-sm text-green-800 dark:text-green-200'>
                    {audioDetected ? '🔊 Microphone Active - Speak Now!' : '🎤 Initializing microphone...'}
                </span>
            </div>
            
            {speechDetected && (
                <div className='flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full'>
                    <div className='w-3 h-3 bg-blue-500 rounded-full animate-bounce'></div>
                    <span className='text-sm text-blue-800 dark:text-blue-200'>
                        🗣️ Speech Detected - Keep talking!
                    </span>
                </div>
            )}
            
            {currentTranscript && (
                <div className='max-w-md mx-auto p-3 bg-gray-100 dark:bg-gray-800 rounded-lg'>
                    <div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
                        What I'm hearing:
                    </div>
                    <div className='text-sm text-gray-900 dark:text-gray-100 italic'>
                        "{currentTranscript}"
                    </div>
                </div>
            )}
            
            <div className='text-xs text-gray-500 text-center'>
                Speak clearly and take your time • Orange dot = mic active • Blue dot = speech detected<br/>
                You can speak for up to 30 seconds • Natural pauses are OK
            </div>
        </div>
    )}
    
    {isThinking && (
        <div className='w-full flex justify-center my-4'>
            <div className='flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full'>
                <div className='w-3 h-3 bg-blue-500 rounded-full animate-bounce'></div>
                <span className='text-sm text-blue-800 dark:text-blue-200'>🤖 AI is thinking about your response...</span>
            </div>
        </div>
    )}
    
    {isSpeaking && (
        <div className='w-full flex justify-center my-4'>
            <div className='flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900 rounded-full'>
                <div className='w-3 h-3 bg-purple-500 rounded-full animate-pulse'></div>
                <span className='text-sm text-purple-800 dark:text-purple-200'>🗣️ AI is speaking...</span>
            </div>
        </div>
    )}
    <div className='w-full flex justify-center gap-4'>
        {callStatus !== CallStatus.ACTIVE ? (
            <button className='relative btn-call mt-6 px-6 py-3 text-lg' onClick={handleCall}>
    <span className={cn(
        'absolute inset-0 animate-ping rounded-full opacity-75 bg-current',
        callStatus !== CallStatus.CONNECTING && 'hidden'
    )}></span>
    <span className={cn(
        'relative z-10',
        callStatus === CallStatus.CONNECTING && 'opacity-50'
    )}>
        {callStatus === CallStatus.CONNECTING ? 'Connecting...' : 'Start Call'}
    </span>
</button>
        ) : (
            <>
                <button className='btn-disconnect' onClick={handleDisconnect}>End Call</button>
                {(!isListening && !isSpeaking && !isThinking) && !voiceDisabled && (
                    <button 
                        className={cn(
                            'px-4 py-2 text-white rounded-lg font-medium transition-all',
                            speechError 
                                ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        )}
                        onClick={() => {
                            setSpeechError(null);
                            setShowTextInput(false);
                            setCurrentTranscript('');
                            setAudioDetected(false);
                            setSpeechDetected(false);
                            startListening();
                        }}
                    >
                        🎤 {speechError ? 'Try Voice Again' : 'Push to Talk'}
                    </button>
                )}
                {voiceDisabled && (
                    <button 
                        className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700'
                        onClick={() => setShowTextInput(true)}
                    >
                        ⌨️ Use Text Input
                    </button>
                )}
                {/* Test voice button when not in call */}
                {callStatus !== CallStatus.ACTIVE && (
                    <button 
                        className='px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm'
                        onClick={async () => {
                            if (!voiceService) return;
                            try {
                                setSpeechError(null);
                                setAudioDetected(false);
                                setSpeechDetected(false);
                                setCurrentTranscript('');
                                
                                console.log('🧪 Testing microphone and voice recognition...');
                                const result = await voiceService.testMicrophone();
                                console.log('✅ Voice test successful:', result);
                                alert(result);
                            } catch (error) {
                                console.error('❌ Voice test failed:', error);
                                const errorMsg = error instanceof Error ? error.message : 'Voice test failed';
                                setSpeechError(errorMsg);
                                alert(`Voice test failed: ${errorMsg}`);
                            }
                        }}
                    >
                        🧪 Test Voice
                    </button>
                )}
            </>
        )}
    </div>
    {isSavingInterview && (
        <div className='w-full flex justify-center my-4'>
            <div className='flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full'>
                <div className='w-3 h-3 bg-green-500 rounded-full animate-spin'></div>
                <span className='text-sm text-green-800 dark:text-green-200'>💾 Saving your interview...</span>
            </div>
        </div>
    )}

    {interviewSaved && !isSavingInterview && (
        <div className='w-full flex justify-center my-4'>
            <div className='flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <span className='text-sm text-green-800 dark:text-green-200'>✅ Interview saved successfully!</span>
            </div>
        </div>
    )}
    </>
    
  )
}

export default Agent