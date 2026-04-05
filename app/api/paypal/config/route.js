import { NextResponse } from 'next/server';

export async function GET() {
    // Return PayPal Client ID safely to the client side.
    const clientId = process.env.PAYPAL_CLIENT_ID || 'test';
    return NextResponse.json({ clientId });
}
