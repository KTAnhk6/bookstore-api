package com.bookstore.api.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class PerformanceAspect {

    /**
     * Theo dõi thời gian thực thi các API quản trị
     * sách và thể loại.
     */
    @Around(
        "execution(* com.bookstore.api.controller.AdminBookController.*(..)) || " +
        "execution(* com.bookstore.api.controller.CategoryController.*(..))"
    )
    public Object monitorPerformance(ProceedingJoinPoint joinPoint)
            throws Throwable {

        long startTime = System.nanoTime();

        try {
            return joinPoint.proceed();
        } finally {
            long endTime = System.nanoTime();
            long durationMs = (endTime - startTime) / 1_000_000;

            String methodName =
                    joinPoint.getSignature().toShortString();

            log.info(
                "[PERFORMANCE] Method: {} | Execution time: {} ms",
                methodName,
                durationMs
            );

            if (durationMs > 1000) {
                log.warn(
                    "[SLOW API] Method: {} took {} ms",
                    methodName,
                    durationMs
                );
            }
        }
    }
}
