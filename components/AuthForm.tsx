"use client";
import Link from "next/link";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Form,
 
} from "@/components/ui/form";
import FormField from "@/components/FormField";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { create } from "domain";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/client";
import { signIn, signUp } from "@/lib/actions/auth.action";
type FormType = "sign-in" | "sign-up";


const authFormSchema = (type: FormType) => {
  return z.object({
    name:
      type === "sign-up"
        ? z.string().min(1, "Name is required")
        : z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
  const formSchema = authFormSchema(type);
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (type === "sign-up") {
        const { name, email, password } = values;
        const userCredentials = await createUserWithEmailAndPassword(auth,email, password);
        const result=await signUp({
          uid: userCredentials.user.uid,
          name:name!,
          email,
          password, 
        })
        if (!result?._success) {
          toast.error(result?.message);
          return;
        }
        // Handle sign-up logic here
        toast.success("Account created successfully");
        router.push("/sign-in");
      } else {
        const { email, password } = values;
        const userCredentials=await signInWithEmailAndPassword(auth,email, password);
        const idToken = await userCredentials.user.getIdToken();
        if(!idToken) {
          toast.error("Failed to get user token");
          return;
        }
        await signIn({
          email,
          idToken,
        })
        // Handle sign-in logic here
        toast.success("Signed in successfully");
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  }
  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col ga^-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">Interview Prep</h2>
        </div>
        <h3>Practice job Interview with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className=" w-full space-y-6 mt-4 from"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your name"
              />
            )}
            <FormField
                control={form.control}
                name="email"
                label="email"
                placeholder="Your email"
                type="email"
              />
            <FormField
                control={form.control}
                name="password"
                label="password"
                placeholder="Your password"
                type="password"
              />

            <Button className="btn" type="submit">
              {isSignIn ? "Sign in" : "Create an Account"}
            </Button>
          </form>
        </Form>
        <p className="text-center">
          {isSignIn ? "No Account yet ?" : "Have an Account Already ?"}
          <Link
            href={!isSignIn ? "/sign-in" : "sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
