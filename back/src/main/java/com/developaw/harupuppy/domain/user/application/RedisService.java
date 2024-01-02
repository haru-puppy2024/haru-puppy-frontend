package com.developaw.harupuppy.domain.user.application;


import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, String> redisTemplate;

    public void setValue(String key, String value) {
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        values.set(key, value);
    }

    public void setValue(String key, String value, Duration duration) {
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        values.set(key, value, duration);
    }

    public Optional<String> getValues(String key) {
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        String value = values.get(key);
        return Optional.ofNullable(value);
    }

    public void deleteValue(String key) {
        redisTemplate.delete(key);
    }
}