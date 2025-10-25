// src/config.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Supabase setup
export const supabase = createClient(
  "https://tjffqhpfbklclqxbihhb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmZxaHBmYmtsY2xxeGJpaGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDk3NTcsImV4cCI6MjA3NjcyNTc1N30.prWhJwm0p4omtGgm7_hw6zYk-noEDRNsxQ8F6NU6vxc"
);

// Mock AI (no OpenAI calls)
export const openai = {

  async createEmbedding(input) {
    //return random numbers instead of using OpenAI API
    return Array.from({ length: 10 }, () => Math.random());
  },

  // fake chat completion
  async createChatCompletion(messages, opts = {}) {
    const userText = messages.find(m => m.role === "user")?.content || "";
    return `Based on your choices, this movie is a great fit because it matches your taste in themes and mood!`;
  }
};
