import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { email, username, password, firstName, lastName, phoneNumber } = await req.json();
    
    console.log(" Creating Clerk user via API for:", email);
    console.log(" Data received:", { email, username, firstName, lastName, phoneNumber });
    
    // Validate required fields
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }
    
    // Await clerkClient() first, then access users
    const client = await clerkClient();
    
    // Create user in Clerk
    const user = await client.users.createUser({
      emailAddress: [email],
      username,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phoneNumber: phoneNumber ? [phoneNumber] : undefined,
    });
    
    console.log(" Clerk user created:", user.id);
    
    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      user 
    });
    
  } catch (error: any) {
    console.error(" Error creating Clerk user:", error);
    
    // Handle specific Clerk errors
    if (error.errors) {
      const clerkError = error.errors[0];
      return NextResponse.json(
        { error: clerkError.message || "Failed to create user" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}