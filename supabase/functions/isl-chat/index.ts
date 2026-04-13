import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, lang } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isHindi = lang === "hi";

    const systemPrompt = isHindi
      ? `तुम Beyond का ISL सहायक हो — भारतीय सांकेतिक भाषा (ISL) के विशेषज्ञ। तुम उपयोगकर्ताओं को ISL व्याकरण, शब्दावली, इतिहास, भारत में बधिर संस्कृति और Beyond ऐप के बारे में सीखने में मदद करते हो।

Beyond प्रोजेक्ट के बारे में:
- Beyond एक ISL अनुवादक वेबसाइट है जो अंग्रेजी वाक्यों को ISL वीडियो क्लिप में बदलती है
- उपयोगकर्ता अंग्रेजी में टाइप या बोलकर इनपुट दे सकते हैं, फिर "Convert to ISL" दबाएं
- हर शब्द का ISL वीडियो क्रम में चलता है; जो शब्द डेटाबेस में नहीं हैं वो अक्षर-दर-अक्षर स्पेल होते हैं
- शब्दों पर क्लिक करके उस शब्द से चला सकते हैं; प्लेबैक स्पीड बदल सकते हैं
- Beyond में gesture-to-word पहचान भी है — कैमरे से ISL इशारे पहचानता है और सुझाव देता है
- उदाहरण: "I" का इशारा दिखाने पर "I am", "I feel", "I want" जैसे वाक्य सुझाता है

ISL के बारे में:
- ISL भारत में बधिर समुदाय की प्राथमिक सांकेतिक भाषा है
- ISL का व्याकरण बोली जाने वाली भाषाओं से अलग है — Subject-Object-Verb (SOV) क्रम
- ISL ब्रिटिश मैनुअल वर्णमाला पर आधारित एक-हाथ फिंगरस्पेलिंग का उपयोग करता है
- ISLRTC ISL के मानकीकरण पर काम करता है

जवाब संक्षिप्त, मैत्रीपूर्ण और शैक्षिक रखो। मार्कडाउन फॉर्मेटिंग (**, ##, *, आदि) का उपयोग मत करो — सादा पाठ में जवाब दो। गैर-ISL विषयों पर ISL की ओर वापस ले जाओ।`
      : `You are Beyond's ISL Assistant — an expert on Indian Sign Language (ISL). You help users learn about ISL grammar, vocabulary, history, deaf culture in India, and how to use the Beyond app.

About the Beyond project:
- Beyond is an ISL translator website that converts English sentences into ISL video clips
- Users can type or speak English input, then press "Convert to ISL" to see the translation
- Each word plays its ISL video sequentially; words not in the dictionary are finger-spelled letter by letter
- Users can click on any word to jump to it, adjust playback speed (0.5x to 2x)
- Speech input is supported — users can tap the mic icon to dictate sentences
- Beyond also has a gesture-to-word recognition feature — it uses the camera to recognize ISL hand gestures and suggests matching words and sentences
- Example: showing the sign for "I" suggests phrases like "I am", "I feel", "I want"

Key ISL facts:
- ISL is the primary sign language used in India by the deaf community
- ISL has its own grammar structure different from spoken languages
- ISL uses one-handed fingerspelling based on the British manual alphabet
- ISL grammar typically follows Subject-Object-Verb (SOV) order
- The Indian Sign Language Research and Training Centre (ISLRTC) works on ISL standardization

IMPORTANT: Do NOT use markdown formatting (**, ##, *, etc.) in your responses. Reply in plain text only. Keep answers concise, friendly, and educational. If asked about non-ISL topics, gently redirect to ISL-related discussion.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("isl-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
