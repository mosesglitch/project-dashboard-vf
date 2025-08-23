import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDkveIKYCBjmPMuLRGVFi7I1HTCHQ6xkys");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function generateContent(prompt: string): Promise<string> {
    console.log("the model has been called")
  const result = await model.generateContent(prompt);
  return result.response.text();
}
