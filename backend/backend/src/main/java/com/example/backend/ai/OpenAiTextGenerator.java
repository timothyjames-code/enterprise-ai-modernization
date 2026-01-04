// package com.example.backend.ai.openai;

// import com.example.backend.ai.*;
// import com.theokanning.openai.OpenAiService;
// import com.theokanning.openai.completion.chat.*;

// import java.time.Duration;
// import java.util.HashMap;
// import java.util.Map;

// public class OpenAiTextGenerator implements AiTextGenerator {

//   private final OpenAiService client;

//   public OpenAiTextGenerator(String apiKey) {
//     this.client = new OpenAiService(apiKey, Duration.ofSeconds(30));
//   }

//   @Override
//   public GenerationResult generate(GenerationRequest request) {
//     ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
//         .model("gpt-4o-mini") // free / low-cost during dev
//         .messages(
//             ChatMessage.builder()
//                 .role("user")
//                 .content(request.renderedPrompt())
//                 .build()
//         )
//         .build();

//     var response = client.createChatCompletion(chatRequest);
//     String text = response.getChoices().get(0).getMessage().getContent();

//     Map<String, Object> meta = new HashMap<>();
//     meta.put("model", "gpt-4o-mini");
//     return new GenerationResult(
//         text,
//         "OPENAI",
//         "gpt-4o-mini",
//         1,
//         0,
//         meta
//     );
//   }
// }
