"use client"
import React, { useEffect, useState, useRef } from 'react'
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
const Agent = ({userName,userId,type,questions,questionCount,templateId,role,level,techstack,interviewType}:AgentProps) => {
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
    const [isMobile, setIsMobile] = useState(false);
    const [pushToTalkMode, setPushToTalkMode] = useState(false);
    
    // Interview tracking
    const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
    const [isSavingInterview, setIsSavingInterview] = useState(false);
    const [interviewSaved, setInterviewSaved] = useState(false);
    const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
    const [lastProcessedQuestionIndex, setLastProcessedQuestionIndex] = useState(-1);
    
    // Use refs for immediate state tracking to avoid React async state issues
    const currentQuestionIndexRef = useRef(0);
    const lastProcessedQuestionIndexRef = useRef(-1);

    // Initialize voice service and detect mobile
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const service = new FreeVoiceService();
            setVoiceService(service);
            
            // Detect mobile device
            const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(mobileCheck);
            
            // Enable push-to-talk mode by default on mobile for better reliability
            if (mobileCheck) {
                setPushToTalkMode(true);
            }
        }
    }, []);

    // Generate questions when component mounts or type changes
    useEffect(() => {
        if (questions && questions.length > 0) {
            setInterviewQuestions(questions);
        } else if (type === 'generate') {
            generateQuestions();
        } else if (type === 'template' && questions) {
            setInterviewQuestions(questions);
        }
    }, [questions, type]);

    // Debug effect to track question index changes
    useEffect(() => {
        console.log(`🎯 Question index changed to: ${currentQuestionIndex} (Question ${currentQuestionIndex + 1})`);
        if (interviewQuestions.length > 0 && currentQuestionIndex < interviewQuestions.length) {
            console.log(`🎯 Current question: "${interviewQuestions[currentQuestionIndex]?.substring(0, 50)}..."`);
        }
        console.log(`🎯 State update completed at ${new Date().toLocaleTimeString()}`);
        // Update ref to match state
        currentQuestionIndexRef.current = currentQuestionIndex;
    }, [currentQuestionIndex, interviewQuestions]);

    // Debug effect to track lastProcessedQuestionIndex changes
    useEffect(() => {
        console.log(`🔄 LastProcessedQuestionIndex changed to: ${lastProcessedQuestionIndex} at ${new Date().toLocaleTimeString()}`);
        // Update ref to match state
        lastProcessedQuestionIndexRef.current = lastProcessedQuestionIndex;
    }, [lastProcessedQuestionIndex]);

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

    const speak = async (text: string, expectedQuestionIndex?: number) => {
        if (!voiceService) {
            console.error('No voice service available for speaking');
            return;
        }
        
        try {
            setisSpeaking(true);
            setIsThinking(false);
            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
            await voiceService.speak(text);
            setisSpeaking(false);
            
            // Check if this is the interview ending
            if (text.includes('That completes our interview') || text.includes('Have a great day!')) {
                return;
            }
            
            // For template interviews, auto-start listening after AI responses
            if (type === 'template') {
                // Always auto-start listening after any response in template interviews now that they're interactive
                console.log('🎤 Template interview: Scheduling voice restart after AI response');
                if (callStatus === CallStatus.ACTIVE && !voiceDisabled) {
                    setTimeout(() => {
                        console.log('🎤 Template interview: Checking if we can restart voice recognition');
                        console.log('🎤 Call status:', callStatus);
                        console.log('🎤 Is listening:', isListening);
                        console.log('🎤 Is speaking:', isSpeaking);
                        console.log('🎤 Is thinking:', isThinking);
                        console.log('🎤 Voice disabled:', voiceDisabled);
                        console.log('🎤 Current question index:', currentQuestionIndex);
                        console.log('🎤 Last processed question index:', lastProcessedQuestionIndex);
                        console.log('🎤 Current question index (ref):', currentQuestionIndexRef.current);
                        console.log('🎤 Last processed question index (ref):', lastProcessedQuestionIndexRef.current);
                        console.log('🎤 Expected question index:', expectedQuestionIndex);
                        console.log('🎤 Interview questions length:', interviewQuestions.length);
                        
                        // If we have an expected question index, use it for verification
                        if (expectedQuestionIndex !== undefined) {
                            console.log(`🎤 Expected question index: ${expectedQuestionIndex}, Current (ref): ${currentQuestionIndexRef.current}`);
                            if (currentQuestionIndexRef.current !== expectedQuestionIndex) {
                                console.log(`⚠️ State mismatch detected! Expected: ${expectedQuestionIndex}, Current (ref): ${currentQuestionIndexRef.current}`);
                                console.log(`⚠️ This suggests React state hasn't updated yet. Voice restart may be premature.`);
                                // Don't restart voice recognition if state hasn't caught up
                                console.log('❌ Skipping voice restart due to state mismatch');
                                return;
                            } else {
                                console.log(`✅ State verification passed! Current ref matches expected: ${expectedQuestionIndex}`);
                            }
                        }
                        
                        if (callStatus === CallStatus.ACTIVE && !isListening && !isSpeaking && !isThinking && !voiceDisabled) {
                            console.log('✅ Template interview: All conditions met, restarting voice recognition');
                            startListening();
                        } else {
                            console.log('❌ Template interview: Cannot restart voice recognition due to current state');
                            if (callStatus !== CallStatus.ACTIVE) console.log('  - Call status not active');
                            if (isListening) console.log('  - Already listening');
                            if (isSpeaking) console.log('  - Currently speaking');
                            if (isThinking) console.log('  - Currently thinking');
                            if (voiceDisabled) console.log('  - Voice disabled');
                        }
                    }, 4000); // Increased delay to 4 seconds to ensure state updates complete
                }
                return;
            }
            
            // Wait a moment then start listening naturally (only for conversational interviews)
            if (callStatus === CallStatus.ACTIVE && !voiceDisabled) {
                setTimeout(() => {
                    if (callStatus === CallStatus.ACTIVE && !isListening && !isSpeaking && !isThinking) { // Add more checks
                        startListening();
                    }
                }, 2000); // Increased delay from 1 to 2 seconds
            } else if (voiceDisabled) {
                // If voice is disabled, show text input automatically
                setShowTextInput(true);
            }
        } catch (error) {
            console.error('Error speaking:', error);
            setisSpeaking(false);
        }
    };

    const startListening = async () => {
        if (!voiceService || callStatus !== CallStatus.ACTIVE || isListening) {
            return;
        }
        
        // Prevent rapid-fire listening attempts
        const now = Date.now();
        if (now - (startListening as any).lastCall < 3000) {
            console.log('🔄 Preventing rapid listening restart');
            return;
        }
        (startListening as any).lastCall = now;
        
        setIsListening(true);
        setIsThinking(false);
        setSpeechError(null); // Clear any previous errors
        setAudioDetected(false);
        setSpeechDetected(false);
        setCurrentTranscript('');
        
        try {
            const transcript = await voiceService.startListening({
                onAudioStart: () => {
                    setAudioDetected(true);
                },
                onSoundStart: () => {
                    setAudioDetected(true);
                },
                onSpeechStart: () => {
                    setSpeechDetected(true);
                },
                onSpeechEnd: () => {
                    setSpeechDetected(false);
                },
                onTranscript: (text: string, isFinal: boolean) => {
                    setCurrentTranscript(text);
                }
            });
            
            // Process the transcript if we got meaningful input
            if (transcript.trim().length > 2) { // Reduced from 3 to 2 for better sensitivity
                console.log(`🎯 Voice transcript received: "${transcript}"`);
                setIsListening(false);
                setIsThinking(true); // Show thinking while processing
                setCurrentTranscript('');
                setAudioDetected(false);
                setSpeechDetected(false);
                setMessages(prev => [...prev, { role: 'user', content: transcript }]);
                await handleUserAnswer(transcript);
            } else if (transcript.trim().length > 0) {
                // Very short transcript - likely noise or incomplete speech
                console.log(`🔄 Short transcript received ("${transcript}"), NOT auto-retrying for template interview to avoid loops`);
                setIsListening(false);
                setCurrentTranscript('');
                setAudioDetected(false);
                setSpeechDetected(false);
                
                // Don't auto-retry for template interviews with short transcripts to avoid interference
                // The speak() function will handle restarting voice recognition after AI response
            } else {
                console.log('❌ Empty transcript received');
                setIsListening(false);
                setCurrentTranscript('');
                setAudioDetected(false);
                setSpeechDetected(false);
                
                // Don't auto-retry for template interviews - let the speak() function handle it
            }
        } catch (error) {
            console.error('Error listening:', error);
            setIsListening(false);
            setIsThinking(false);
            setCurrentTranscript('');
            setAudioDetected(false);
            setSpeechDetected(false);
            
            // Check network status
            const networkStatus = voiceService.getNetworkStatus();
            
            // Mobile-specific error handling
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            let errorMessage = (error as Error).message;
            
            if (isMobile) {
                if (errorMessage.includes('not-allowed') || errorMessage.includes('permission')) {
                    errorMessage = 'Microphone permission needed. Please allow microphone access in your browser settings.';
                } else if (errorMessage.includes('no-speech')) {
                    errorMessage = 'No speech detected. Please speak closer to your device\'s microphone.';
                } else if (errorMessage.includes('audio-capture')) {
                    errorMessage = 'Cannot access microphone. Please check if another app is using it.';
                } else if (errorMessage.includes('timeout')) {
                    errorMessage = 'Speech recognition timed out. Please try speaking again or use text input.';
                }
            }
            
            setSpeechError(errorMessage);
            
            // Only disable voice after multiple failures (not just network issues)
            if (networkStatus.issueCount >= 4) {
                setVoiceDisabled(true);
                setSpeechError('Voice recognition has failed multiple times. Please use text input to continue.');
                setShowTextInput(true);
                return;
            }
            
            // Show user-friendly error messages and auto-retry for template interviews
            if (error instanceof Error) {
                if (error.message.includes('not-allowed') || error.message.includes('denied')) {
                    setSpeechError('Microphone access denied. Please allow microphone permissions or use text input.');
                    return;
                } else if (error.message.includes('network') || error.message.includes('service-not-allowed')) {
                    setSpeechError('Speech service issue. Please try again or use text input.');
                    
                    // Auto-retry for template interviews with network issues
                    if (type === 'template' && networkStatus.issueCount < 2) {
                        setTimeout(() => {
                            if (callStatus === CallStatus.ACTIVE && !isListening && !isSpeaking && !isThinking) {
                                console.log('🔄 Auto-retrying voice recognition for template interview');
                                setSpeechError(null);
                                startListening();
                            }
                        }, 2000);
                    }
                    return;
                } else if (error.message.includes('timeout') || error.message.includes('No speech')) {
                    setSpeechError('No speech detected. Try speaking closer to your microphone.');
                    
                    // Don't auto-retry for template interviews with timeout - let speak() function handle restarts
                    console.log('🔄 Template interview timeout - will restart via speak() function after AI response');
                    return;
                } else if (error.message.includes('unavailable')) {
                    setSpeechError('Speech service is currently unavailable. Please use text input.');
                    return;
                } else {
                    setSpeechError('Speech recognition failed. Please try again or use text input.');
                    
                    // Don't auto-retry for template interviews with generic errors - let speak() function handle restarts
                    console.log('🔄 Template interview error - will restart via speak() function after AI response');
                }
            }
        }
    };

    const handleUserAnswer = async (answer: string) => {
        console.log(`📥 handleUserAnswer called with: "${answer.substring(0, 50)}..."`);
        console.log(`📥 Current state - Question index: ${currentQuestionIndex}, Last processed: ${lastProcessedQuestionIndex}, Processing: ${isProcessingAnswer}`);
        console.log(`📥 Current refs - Question index: ${currentQuestionIndexRef.current}, Last processed: ${lastProcessedQuestionIndexRef.current}`);
        
        // Prevent multiple simultaneous processing
        if (isProcessingAnswer) {
            console.log('🔄 Already processing an answer, skipping duplicate');
            return;
        }
        
        // For template interviews, extra validation to prevent processing old questions
        if (type === 'template') {
            // Use refs for immediate state checking (not async React state)
            const currentIdx = currentQuestionIndexRef.current;
            const lastProcessedIdx = lastProcessedQuestionIndexRef.current;
            
            // Check if this might be a delayed response to a previous question
            if (currentIdx > 0 && currentIdx === lastProcessedIdx) {
                console.log(`🔄 Detected potential stale voice input: current question ${currentIdx + 1} already processed (using refs)`);
                console.log(`🔄 This often happens when voice recognition captures delayed audio. Ignoring.`);
                return;
            }
            
            // Additional safety check
            if (currentIdx > 0 && lastProcessedIdx === currentIdx - 1) {
                console.log(`✅ This appears to be a valid answer for current question ${currentIdx + 1} (using refs)`);
            } else if (currentIdx === 0 && lastProcessedIdx === -1) {
                console.log(`✅ This appears to be the first question, proceeding (using refs)`);
            } else {
                console.log(`⚠️ Unexpected ref state: currentQuestionIndex=${currentIdx}, lastProcessedQuestionIndex=${lastProcessedIdx}`);
                console.log(`⚠️ This might indicate a timing issue or stale voice input`);
            }
        }
        
        // Check for duplicate answers to prevent voice recognition issues
        // Look at the last 3 user messages to catch rapid duplicates
        const recentUserMessages = messages.filter(m => m.role === 'user').slice(-3);
        const isDuplicate = recentUserMessages.some(msg => 
            msg.content.trim().toLowerCase() === answer.trim().toLowerCase()
        );
        
        if (isDuplicate) {
            console.log('🔄 Duplicate answer detected in recent messages, skipping');
            return;
        }
        
        try {
            setIsProcessingAnswer(true);
            setIsThinking(true);
            
            console.log(`📝 Processing answer: "${answer.substring(0, 50)}..."`);
            
            // Additional validation: Don't process very short answers (likely voice recognition errors)
            if (answer.trim().length < 3) {
                console.log('❌ Answer too short, skipping');
                setIsThinking(false);
                return;
            }
            
            // Template-based interview logic with conversational AI
            if (type === 'template' && interviewQuestions.length > 0) {
                console.log(`🎯 Processing template answer for question ${currentQuestionIndex + 1} of ${questionCount || interviewQuestions.length}`);
                console.log(`🎯 Last processed question index: ${lastProcessedQuestionIndex}`);
                console.log(`🎯 Current question index: ${currentQuestionIndex}`);
                console.log(`🎯 Question count limit: ${questionCount || interviewQuestions.length}`);
                
                // Prevent processing the same question index multiple times
                if (currentQuestionIndexRef.current === lastProcessedQuestionIndexRef.current) {
                    console.log(`🔄 Question ${currentQuestionIndexRef.current + 1} already processed (using refs for immediate check), skipping`);
                    console.log(`🔄 This means we've already processed this question index, voice recognition might have picked up duplicate`);
                    setIsThinking(false);
                    setIsProcessingAnswer(false);
                    return;
                }
                
                // Mark this question as being processed (update both state and ref immediately)
                setLastProcessedQuestionIndex(currentQuestionIndexRef.current);
                lastProcessedQuestionIndexRef.current = currentQuestionIndexRef.current;
                console.log(`✅ Marked question ${currentQuestionIndexRef.current + 1} as being processed (both state and ref)`);
                
                // Increment conversation count for template interviews too
                setConversationCount(prev => prev + 1);
                
                // Check if this was the last question based on questionCount
                const maxQuestions = questionCount || interviewQuestions.length;
                if (currentQuestionIndexRef.current >= maxQuestions - 1) {
                    console.log(`🏁 Processing final question response (${currentQuestionIndexRef.current + 1}/${maxQuestions})`);
                    // All template questions completed - get AI's final response
                    const response = await fetch('/api/interview/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: answer,
                            conversationHistory: messages,
                            interviewContext: {
                                role: role || 'Software Developer',
                                level: level || 'Mid-level',
                                techStack: techstack?.join(', ') || 'General',
                                conversationCount: conversationCount + 1,
                                isTemplateInterview: true,
                                templateQuestions: interviewQuestions,
                                currentQuestionIndex: currentQuestionIndex,
                                isLastQuestion: true,
                                templateData: {
                                    name: templateId,
                                    role: role,
                                    level: level,
                                    techStack: techstack
                                }
                            }
                        })
                    });
                    
                    if (response.ok) {
                        const { response: aiResponse } = await response.json();
                        if (aiResponse) {
                            await speak(aiResponse);
                        }
                    }
                    
                    // End the interview after AI response
                    const endingResponse = `${userName}, that completes our interview. Thank you so much for your thoughtful responses! We'll review your answers and get back to you soon. Have a great day!`;
                    await speak(endingResponse);
                    
                    // Save interview and end immediately after speaking
                    setTimeout(async () => {
                        await saveInterview();
                        setCallStatus(CallStatus.FINISHED);
                    }, 3000); // Give time for the goodbye message to finish
                    return;
                }
                
                // Calculate the next question index
                const nextQuestionIndex = currentQuestionIndexRef.current + 1;
                const nextQuestion = interviewQuestions[nextQuestionIndex];
                
                console.log(`🔄 Moving from question ${currentQuestionIndexRef.current + 1} to question ${nextQuestionIndex + 1}`);
                console.log(`🔄 Next question: "${nextQuestion}"`);
                
                // Get AI response to current answer and transition to next question
                console.log(`🤖 Requesting AI response for question ${currentQuestionIndexRef.current + 1} with next question: "${nextQuestion}"`);
                const response = await fetch('/api/interview/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: answer,
                        conversationHistory: messages,
                        interviewContext: {
                            role: role || 'Software Developer',
                            level: level || 'Mid-level',
                            techStack: techstack?.join(', ') || 'General',
                            conversationCount: conversationCount + 1,
                            isTemplateInterview: true,
                            templateQuestions: interviewQuestions,
                            currentQuestionIndex: currentQuestionIndexRef.current,
                            nextQuestion: nextQuestion,
                            templateData: {
                                name: templateId,
                                role: role,
                                level: level,
                                techStack: techstack
                            }
                        }
                    })
                });
                
                let aiResponse = '';
                if (response.ok) {
                    const data = await response.json();
                    aiResponse = data.response || '';
                    console.log('🤖 AI Response received:', aiResponse.substring(0, 200) + '...');
                    console.log(`🤖 AI Response includes next question: ${aiResponse.includes(nextQuestion) ? 'YES' : 'NO'}`);
                } else {
                    console.error('🤖 AI Response failed with status:', response.status);
                }
                
                // CRITICAL: Update states BEFORE speaking to ensure they're ready when voice restarts
                console.log(`✅ About to move from question ${currentQuestionIndexRef.current + 1} to question ${nextQuestionIndex + 1}`);
                console.log(`✅ Before update - currentQuestionIndex: ${currentQuestionIndexRef.current}`);
                
                // Update both states and refs immediately BEFORE speaking
                const previousQuestionIndex = currentQuestionIndexRef.current;
                setCurrentQuestionIndex(nextQuestionIndex);
                currentQuestionIndexRef.current = nextQuestionIndex;
                setLastProcessedQuestionIndex(previousQuestionIndex);
                lastProcessedQuestionIndexRef.current = previousQuestionIndex;
                
                console.log(`✅ Updated states and refs BEFORE speaking: currentQuestionIndex -> ${nextQuestionIndex}, lastProcessedQuestionIndex -> ${previousQuestionIndex}`);
                console.log(`✅ Question ${nextQuestionIndex + 1} is now the active question`);
                
                // Speak the AI response AFTER state updates
                if (aiResponse.trim()) {
                    console.log(`🗣️ Speaking AI response for transition to question ${nextQuestionIndex + 1}`);
                    await speak(aiResponse, nextQuestionIndex); // Pass the expected next question index
                } else {
                    // Fallback conversational transition to next question
                    const transitionResponses = [
                        `That's a great answer! I can see you have good experience there. Let me ask you about something else: ${nextQuestion}`,
                        `Interesting perspective! Thanks for sharing that. Now I'd like to know: ${nextQuestion}`,
                        `I appreciate that insight. That gives me a good understanding. My next question is: ${nextQuestion}`,
                        `Thank you for that detailed response. It's clear you've thought about this. Let me ask: ${nextQuestion}`
                    ];
                    
                    const randomTransition = transitionResponses[Math.floor(Math.random() * transitionResponses.length)];
                    console.log('🔄 Using fallback transition:', randomTransition.substring(0, 100) + '...');
                    console.log(`🗣️ Speaking fallback transition for question ${nextQuestionIndex + 1}`);
                    await speak(randomTransition, nextQuestionIndex); // Pass the expected next question index
                }
                
                return;
            }
            
            // Original conversational interview logic (for non-template interviews)
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
            
            // Conversational approach - chat with AI like Gemini
            const response = await fetch('/api/interview/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: answer,
                    conversationHistory: messages,
                    interviewContext: {
                        role: role || 'Software Developer',
                        level: level || 'Mid-level',
                        techStack: techstack?.join(', ') || 'React, Node.js, TypeScript',
                        conversationCount: conversationCount,
                        interviewType: interviewType || 'general',
                        isTemplateInterview: false,
                        candidateProfile: {
                            userName: userName,
                            userId: userId
                        }
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const { response: aiResponse, success } = await response.json();
            
            if (!success) {
                throw new Error('API returned unsuccessful response');
            }
            
            if (!aiResponse || aiResponse.trim().length === 0) {
                throw new Error('AI returned empty response');
            }
            
            // Speak the AI's conversational response
            await speak(aiResponse);
            
        } catch (error) {
            console.error('Error processing answer:', error);
            setIsThinking(false);
            
            // Fallback responses
            const fallbackResponses = [
                "That's interesting. Can you tell me more about that?",
                "I see. What was the most challenging part of that experience?",
                "Thanks for sharing. How did that impact your approach to development?",
                "That sounds like valuable experience. What did you learn from it?"
            ];
            
            const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            await speak(randomResponse);
        } finally {
            setIsProcessingAnswer(false);
        }
    };

    // Save interview to Firebase
    const saveInterview = async () => {
        if (!userId || !interviewStartTime || isSavingInterview || interviewSaved) {
            return;
        }

        try {
            setIsSavingInterview(true);

            const endTime = new Date();
            const durationMinutes = Math.round((endTime.getTime() - interviewStartTime.getTime()) / (1000 * 60));

            // Handle template-based interviews differently
            if (type === 'template' && templateId) {
                // Save template response
                const templateResponseData = {
                    templateId: templateId,
                    candidateName: userName,
                    candidateEmail: localStorage.getItem('candidateEmail') || '',
                    transcript: messages,
                    duration: durationMinutes,
                    completedAt: new Date().toISOString()
                };

                const response = await fetch(`/api/interview/template/${templateId}/responses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(templateResponseData)
                });

                const result = await response.json();

                if (result.success) {
                    setInterviewSaved(true);
                    
                    // Redirect to template feedback page immediately
                    window.location.href = `/interview/${result.responseId}/template-feedback`;
                } else {
                    console.error('Failed to save template response:', result.error);
                    alert('Failed to save your interview response. Please try again.');
                }
            } else {
                // Regular interview save logic
                const interviewData = {
                    userId: userId,
                    role: role || 'Software Developer',
                    level: level || 'Mid-level',
                    techstack: techstack || ['General'],
                    transcript: messages,
                    duration: durationMinutes,
                    interviewType: interviewType || 'Technical'
                };

                const response = await fetch('/api/interview/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(interviewData)
                });

                const result = await response.json();

                if (result.success) {
                    setInterviewSaved(true);
                } else {
                    console.error('Failed to save interview:', result.error);
                }
            }

        } catch (error) {
            console.error('Error saving interview:', error);
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

        // Test microphone access first with mobile-specific handling
        try {
            // Request microphone permission using the voice service
            const permissionGranted = await voiceService.requestMicrophonePermission();
            if (!permissionGranted) {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const errorMsg = isMobile 
                    ? 'Please allow microphone access in your browser settings. On mobile devices, you may need to tap the microphone icon in your browser\'s address bar and select "Allow".'
                    : 'Please allow microphone access to start the interview. Check your browser permissions.';
                alert(errorMsg);
                return;
            }
        } catch (error) {
            console.error('Microphone access denied:', error);
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const errorMsg = isMobile 
                ? 'Microphone permission is required for voice input. Please check your browser settings and ensure microphone access is allowed for this website.'
                : 'Please allow microphone access to start the interview. Check your browser permissions.';
            alert(errorMsg);
            return;
        }

        // Reset voice service completely for new interview
        voiceService.resetVoiceService();
        setSpeechError(null);
        setVoiceDisabled(false);

        setCallStatus(CallStatus.CONNECTING);
        setCurrentQuestionIndex(0);
        currentQuestionIndexRef.current = 0; // Reset ref as well
        setLastProcessedQuestionIndex(-1);
        lastProcessedQuestionIndexRef.current = -1; // Reset ref as well
        setMessages([]);
        setConversationCount(0);
        setInterviewSaved(false);
        setIsSavingInterview(false);
        setIsProcessingAnswer(false);
        
        try {
            setCallStatus(CallStatus.ACTIVE);
            setInterviewStartTime(new Date()); // Track interview start time
            
            // Different greeting based on interview type
            if (type === 'template' && interviewQuestions.length > 0) {
                // Template-based interview: Start with conversational introduction and first question
                const maxQuestions = questionCount || interviewQuestions.length;
                const templateGreeting = `Hello ${userName}! It's great to meet you today. Thank you for taking the time to interview with us. I'm really excited to learn more about you and your experience. We'll be going through ${maxQuestions} questions together, and I encourage you to share as much detail as you'd like - this is your chance to really showcase your skills and experience. Are you ready to get started? Great! Let's begin with: ${interviewQuestions[0]}`;
                
                await speak(templateGreeting);
            } else {
                // Regular conversational interview
                const greeting = `Hello ${userName}! It's great to meet you. I'm excited to learn more about you and your experience. To get started, could you tell me a bit about yourself and what you're passionate about in software development?`;
                await speak(greeting);
            }
            
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
        setIsProcessingAnswer(false);
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
           {type === 'template' && (
               <div className='text-xs text-blue-400 mt-1 px-2 py-1 bg-blue-900/30 rounded-full border border-blue-700'>
                   📋 Template Mode
               </div>
           )}
        </div>
        <div className='card-border'>
            <div className='card-content'>
                <Image src="/user2.png" alt="user avatar" height={540} width={540} className='rounded-full object-cover size-[120px]' />
                <h3>{userName}</h3>
            </div>
        </div>
    </div>

    {/* Progress indicator for template interviews */}
    {type === 'template' && interviewQuestions.length > 0 && callStatus === CallStatus.ACTIVE && (
        <div className='w-full max-w-md mx-auto my-4 max-sm:my-6'>
            <div className='bg-gray-800 rounded-lg max-sm:rounded-xl p-4 max-sm:p-6'>
                <div className='flex justify-between items-center mb-2 max-sm:mb-3'>
                    <span className='text-sm max-sm:text-base text-gray-300'>Question Progress</span>
                    <span className='text-sm max-sm:text-base text-blue-400 font-medium max-sm:font-semibold'>
                        {currentQuestionIndex + 1} of {questionCount || interviewQuestions.length}
                    </span>
                </div>
                <div className='w-full bg-gray-700 rounded-full h-2 max-sm:h-3'>
                    <div 
                        className='bg-blue-500 h-2 max-sm:h-3 rounded-full transition-all duration-500'
                        style={{ width: `${((currentQuestionIndex + 1) / (questionCount || interviewQuestions.length)) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    )}
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
        <div className='w-full flex flex-col items-center gap-3 max-sm:gap-4 my-4 max-sm:my-6'>
            <div className='flex items-center gap-2 px-4 py-2 max-sm:px-6 max-sm:py-3 bg-red-100 dark:bg-red-900 rounded-full max-sm:rounded-xl'>
                <div className='w-3 h-3 max-sm:w-4 max-sm:h-4 bg-red-500 rounded-full'></div>
                <span className='text-sm max-sm:text-base text-red-800 dark:text-red-200'>❌ {speechError}</span>
            </div>
            {isMobile && (
                <div className='text-xs max-sm:text-sm text-gray-600 dark:text-gray-400 text-center max-sm:px-4'>
                    💡 Mobile Tips: Ensure microphone permission is granted • Speak closer to your device • Use headphones for better audio quality
                </div>
            )}
            <button 
                className='px-4 py-2 max-sm:px-6 max-sm:py-3 max-sm:text-lg bg-gray-600 text-white rounded-lg max-sm:rounded-xl hover:bg-gray-700'
                onClick={() => setShowTextInput(!showTextInput)}
            >
                {showTextInput ? 'Hide Text Input' : '⌨️ Type Your Answer Instead'}
            </button>
            {voiceDisabled && (                    <button 
                        className='px-4 py-2 max-sm:px-6 max-sm:py-3 max-sm:text-lg bg-green-600 text-white rounded-lg max-sm:rounded-xl hover:bg-green-700'
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
        <div className='w-full max-w-md mx-auto my-4 p-4 max-sm:p-6 border rounded-lg max-sm:rounded-xl bg-gray-50 dark:bg-gray-800'>
            <div className='flex flex-col gap-3 max-sm:gap-4'>
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your answer here..."
                    className='w-full p-3 max-sm:p-4 border rounded-lg max-sm:rounded-xl resize-none h-20 max-sm:h-28 bg-white dark:bg-gray-700 text-black dark:text-white max-sm:text-lg'
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleTextInput();
                        }
                    }}
                />
                <div className='flex gap-2 max-sm:gap-3 max-sm:flex-col'>
                    <button
                        onClick={handleTextInput}
                        disabled={!textInput.trim()}
                        className='flex-1 px-4 py-2 max-sm:py-3 max-sm:text-lg max-sm:font-semibold bg-blue-600 text-white rounded-lg max-sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Submit Answer
                    </button>
                    <button
                        onClick={() => {setShowTextInput(false); setTextInput('');}}
                        className='px-4 py-2 max-sm:py-3 max-sm:text-lg bg-gray-600 text-white rounded-lg max-sm:rounded-xl hover:bg-gray-700'
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
            
            <div className='text-xs text-gray-500 text-center max-sm:text-sm max-sm:px-4'>
                {isMobile 
                    ? 'Mobile Mode: Push the "🎤 Push to Talk" button to speak • Orange dot = mic active • Blue dot = speech detected'
                    : 'Speak clearly and take your time • Orange dot = mic active • Blue dot = speech detected'}
                <br/>
                You can speak for up to {isMobile ? '15' : '30'} seconds • Natural pauses are OK
                {isMobile && <br/>}
                {isMobile && 'Tip: Hold device at arm\'s length for better voice recognition'}
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
    <div className='w-full flex justify-center gap-4 max-sm:flex-col max-sm:items-center max-sm:gap-3'>
        {callStatus !== CallStatus.ACTIVE ? (
            <button className='relative btn-call mt-6 px-6 py-3 text-lg max-sm:w-full max-sm:max-w-xs max-sm:py-4 max-sm:text-xl max-sm:font-bold' onClick={handleCall}>
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
                <button className='btn-disconnect max-sm:w-full max-sm:max-w-xs max-sm:py-3 max-sm:text-lg' onClick={handleDisconnect}>End Call</button>
                {(!isListening && !isSpeaking && !isThinking) && !voiceDisabled && (
                    <button 
                        className={cn(
                            'px-4 py-2 text-white rounded-lg font-medium transition-all max-sm:w-full max-sm:max-w-xs max-sm:py-3 max-sm:text-lg max-sm:font-semibold',
                            speechError 
                                ? 'bg-green-600 hover:bg-green-700 animate-pulse max-sm:bg-green-500' 
                                : 'bg-blue-600 hover:bg-blue-700 max-sm:bg-blue-500'
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
                        🎤 {speechError ? 'Try Voice Again' : isMobile ? 'Tap to Speak' : 'Push to Talk'}
                    </button>
                )}
                {voiceDisabled && (
                    <button 
                        className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 max-sm:w-full max-sm:max-w-xs max-sm:py-3 max-sm:text-lg max-sm:bg-purple-500'
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
                                
                                const result = await voiceService.testMicrophone();
                                alert(result);
                            } catch (error) {
                                console.error('Voice test failed:', error);
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