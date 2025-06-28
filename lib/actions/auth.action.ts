"use server";

import { _success } from "zod/v4/core";
//check this may cause error
import { db,auth } from "@/firebase/admin"
import { cookies } from "next/headers";
import { id } from "zod/v4/locales";
export async function signUp(params:SignUpParams){
    const {uid,name,email}= params;
    try {
        const userRecord=await db.collection("users").doc(uid).get();
        if(userRecord.exists){
            return {
                _success: false,
                message: "User already exists. Please log in instead.",
            };
        }
        await db.collection("users").doc(uid).set({
            name,
            email,
            
        })
        return {
            _success: true,
            message: "User signed up successfully.",
        };
       

        
    } catch (e:any) {
        console.error("Error signing up:", e);
        if(e.code==="auth/email-already-in-use"){
           return {
            _success: false,
            message: "Email already in use. Please try another email.",
        }
    }
        return {
            _success: false,
            message: "An error occurred during sign up. Please try again later.",
        };
    }
}
export async function setSessionCookie(idToken:string){
    const cookieStore = await cookies();
    const sessionCookie=await auth.createSessionCookie(idToken, {
        expiresIn: 60 * 60 * 24 * 7 * 1000
    });
    cookieStore.set('session', sessionCookie, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
    }
    
    );
        
}
export async function signIn(params:SignInParams){
    const {email,idToken}=params;
    try {
        const userRecord=await auth.getUserByEmail(email);
        if (!userRecord) {
            return {
                _success: false,
                message: "User not found. Please sign up first.",
            };
        }
        await setSessionCookie(idToken);
        
    } catch (error) {
        console.error("Error signing in:", error);
        return {
            _success: false,
            message: "An error occurred during sign in. Please try again later.",
        };
    }
}
export async function getCurrentUser(){
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
        return null;
    }
    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userRecord = await db.collection("users").doc(decodedClaims.uid).get(); 
        if (!userRecord.exists) {
            return null;
        }
        return{
            ...userRecord.data(),
            id: userRecord.id,
        }as User;
    } catch (error) {
        console.error("Error verifying session cookie:", error);
        return null;
    }
}
export async function isAuthenticated(){
    const user=await getCurrentUser();
    return !!user;
}
export async function logout() {
    try {
        const cookieStore = await cookies();
        // Clear the session cookie
        cookieStore.delete('session');
        
        return {
            _success: true,
            message: "Logged out successfully.",
        };
    } catch (error) {
        console.error("Error during logout:", error);
        return {
            _success: false,
            message: "An error occurred during logout.",
        };
    }
}

