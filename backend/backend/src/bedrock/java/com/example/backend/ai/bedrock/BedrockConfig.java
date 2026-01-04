package com.example.backend.ai.bedrock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;

@Configuration
public class BedrockConfig {

  @Bean
  public BedrockRuntimeClient bedrockRuntimeClient() {
    return BedrockRuntimeClient.builder()
        .region(Region.US_EAST_1) // change via config later
        .build();
  }
}
