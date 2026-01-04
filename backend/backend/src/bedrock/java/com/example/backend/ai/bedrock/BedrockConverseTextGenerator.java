// package com.example.backend.ai.bedrock;

// import com.example.backend.ai.*;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Component;
// import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
// import software.amazon.awssdk.services.bedrockruntime.model.*;

// import java.time.Duration;
// import java.time.Instant;
// import java.util.HashMap;
// import java.util.Map;

// @Component
// public class BedrockConverseTextGenerator implements AiTextGenerator {

//   private final BedrockRuntimeClient client;

//   // Optional guardrail wiring (can be blank)
//   private final String guardrailId;
//   private final String guardrailVersion;

//   public BedrockConverseTextGenerator(
//       BedrockRuntimeClient client,
//       @Value("${ai.bedrock.guardrailId:}") String guardrailId,
//       @Value("${ai.bedrock.guardrailVersion:}") String guardrailVersion
//   ) {
//     this.client = client;
//     this.guardrailId = guardrailId;
//     this.guardrailVersion = guardrailVersion;
//   }

//   @Override
//   public GenerationResult generate(GenerationRequest request) {
//     String modelId = mapModel(request.modelProfile());

//     int attempts = 0;
//     Instant start = Instant.now();

//     // conservative retry: transient only
//     int maxAttempts = 3;
//     long backoffMs = 250;

//     RuntimeException last = null;

//     while (attempts < maxAttempts) {
//       attempts++;
//       try {
//         ConverseRequest.Builder b = ConverseRequest.builder()
//             .modelId(modelId)
//             // system prompt can be used too; for now keep it in renderedPrompt for simplicity
//             .messages(Message.builder()
//                 .role(ConversationRole.USER)
//                 .content(ContentBlock.fromText(request.renderedPrompt()))
//                 .build()
//             );

//         // Optionally attach guardrail config (Converse supports guardrailConfig) :contentReference[oaicite:3]{index=3}
//         if (!guardrailId.isBlank() && !guardrailVersion.isBlank()) {
//           b.guardrailConfig(GuardrailConfiguration.builder()
//               .guardrailIdentifier(guardrailId)
//               .guardrailVersion(guardrailVersion)
//               .build());
//         }

//         ConverseResponse resp = client.converse(b.build());

//         String text = extractText(resp);
//         long latencyMs = Duration.between(start, Instant.now()).toMillis();

//         Map<String, Object> meta = new HashMap<>();
//         meta.put("stopReason", resp.stopReasonAsString());
//         if (resp.usage() != null) {
//           meta.put("inputTokens", resp.usage().inputTokens());
//           meta.put("outputTokens", resp.usage().outputTokens());
//           meta.put("totalTokens", resp.usage().totalTokens());
//         }

//         return new GenerationResult(text, "BEDROCK", modelId, attempts, latencyMs, meta);

//       } catch (ThrottlingException | TimeoutException | InternalServerException e) {
//         // transient -> retry
//         last = new RuntimeException(e);
//       } catch (ModelNotReadyException e) {
//         // can be transient; AWS SDK mentions retries for not-ready situations :contentReference[oaicite:4]{index=4}
//         last = new RuntimeException(e);
//       } catch (BedrockRuntimeException e) {
//         // treat other Bedrock errors as non-retryable by default
//         throw e;
//       }

//       try {
//         Thread.sleep(backoffMs);
//       } catch (InterruptedException ie) {
//         Thread.currentThread().interrupt();
//         throw new RuntimeException("Interrupted during backoff", ie);
//       }
//       backoffMs *= 2;
//     }

//     throw new RuntimeException("Bedrock generation failed after retries", last);
//   }

//   private static String extractText(ConverseResponse resp) {
//     if (resp.output() == null || resp.output().message() == null) return "";
//     var blocks = resp.output().message().content();
//     if (blocks == null) return "";
//     StringBuilder sb = new StringBuilder();
//     for (ContentBlock cb : blocks) {
//       if (cb.text() != null) sb.append(cb.text());
//     }
//     return sb.toString().trim();
//   }

//   private static String mapModel(ModelProfile profile) {
//     // Use Bedrock supported model IDs from AWS docs in real setup :contentReference[oaicite:5]{index=5}
//     // Keep as config-driven later; hardcoded here for a portfolio baseline.
//     return switch (profile) {
//       case BEDROCK_CLAUDE_SONNET -> "anthropic.claude-3-sonnet-20240229-v1:0";
//       case BEDROCK_CLAUDE_HAIKU -> "anthropic.claude-3-haiku-20240307-v1:0";
//     };
//   }
// }
